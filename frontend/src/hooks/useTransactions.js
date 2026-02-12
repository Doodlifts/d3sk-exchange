import { useState, useCallback } from 'react'
import { fcl, config, FLOW_NETWORK } from '../config/fcl'
import { TOKEN_REGISTRY, getTokenConfig } from '../config/tokens'

// Ensure UFix64 values always have a decimal point (FCL requires "1.0" not "1")
function toUFix64(value) {
  const str = String(value)
  if (!str.includes('.')) return str + '.0'
  return str
}

export function useTransactions() {
  const [txStatus, setTxStatus] = useState(null)
  const [txId, setTxId] = useState(null)
  const [error, setError] = useState(null)

  const resetTx = useCallback(() => {
    setTxStatus(null)
    setTxId(null)
    setError(null)
  }, [])

  // Helper: wait for seal AND check on-chain success (statusCode 0 = success)
  const waitForSeal = async (id) => {
    const txResult = await fcl.tx(id).onceSealed()
    if (txResult.statusCode !== 0) {
      throw new Error(txResult.errorMessage || 'Transaction failed on-chain')
    }
    return txResult
  }

  // ── Create Offer (Mint NFT) ────────────────────────────────────
  const createOffer = useCallback(
    async (sellAmount, askTokenTypeIdentifier, askAmount, sellTokenKey, duration = "0.0") => {
      resetTx()
      try {
        setTxStatus('pending')

        const sellTokenConfig = getTokenConfig(sellTokenKey, FLOW_NETWORK)
        if (!sellTokenConfig) {
          throw new Error(`Invalid sell token: ${sellTokenKey}`)
        }

        const cadenceCode = `
          import FungibleToken from ${config.fungibleToken}
          import NonFungibleToken from ${config.nonFungibleToken}
          import ${sellTokenConfig.contractName} from ${sellTokenConfig.contractAddress}
          import D3SKOfferNFT from ${config.d3skOfferNFT}

          transaction(sellAmount: UFix64, askTokenTypeIdentifier: String, askAmount: UFix64, duration: UFix64) {
              prepare(signer: auth(BorrowValue, SaveValue, LoadValue, IssueStorageCapabilityController, PublishCapability, UnpublishCapability) &Account) {
                  // Calculate expiration
                  var expiresAt: UFix64? = nil
                  if duration > 0.0 {
                      expiresAt = getCurrentBlock().timestamp + duration
                  }

                  // Setup NFT Collection if not already in storage
                  if signer.storage.borrow<&D3SKOfferNFT.Collection>(from: D3SKOfferNFT.CollectionStoragePath) == nil {
                      signer.storage.save(<- D3SKOfferNFT.createEmptyCollection(nftType: Type<@D3SKOfferNFT.NFT>()), to: D3SKOfferNFT.CollectionStoragePath)
                  }

                  // Publish auth(Fill) capability so takers can call access(Fill) fillOffer
                  // Always unpublish first to clear any stale/wrong-typed capability
                  if !signer.capabilities.get<auth(D3SKOfferNFT.Fill) &D3SKOfferNFT.Collection>(D3SKOfferNFT.CollectionPublicPath).check() {
                      signer.capabilities.unpublish(D3SKOfferNFT.CollectionPublicPath)
                      let cap = signer.capabilities.storage.issue<auth(D3SKOfferNFT.Fill) &D3SKOfferNFT.Collection>(D3SKOfferNFT.CollectionStoragePath)
                      signer.capabilities.publish(cap, at: D3SKOfferNFT.CollectionPublicPath)
                  }

                  // Withdraw sell tokens
                  let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &${sellTokenConfig.vaultType}>(
                      from: ${sellTokenConfig.storagePath}
                  ) ?? panic("Could not borrow sell token vault")
                  let sellVault <- vaultRef.withdraw(amount: sellAmount)

                  let askType = CompositeType(askTokenTypeIdentifier)
                      ?? panic("Invalid ask token type")

                  // Mint offer NFT (also registers with D3SKRegistry)
                  let offerNFT <- D3SKOfferNFT.mintOffer(
                      sellVault: <-sellVault,
                      askTokenType: askType,
                      askAmount: askAmount,
                      makerAddress: signer.address,
                      expiresAt: expiresAt
                  )

                  // Deposit the NFT into signer's collection
                  let collectionRef = signer.storage.borrow<&D3SKOfferNFT.Collection>(
                      from: D3SKOfferNFT.CollectionStoragePath
                  ) ?? panic("Could not borrow collection")
                  collectionRef.deposit(token: <-offerNFT)
              }
          }
        `

        const id = await fcl.mutate({
          cadence: cadenceCode,
          args: (arg, t) => [
            arg(toUFix64(sellAmount), t.UFix64),
            arg(askTokenTypeIdentifier, t.String),
            arg(toUFix64(askAmount), t.UFix64),
            arg(toUFix64(duration), t.UFix64),
          ],
          limit: 9999,
        })

        setTxId(id)
        setTxStatus('submitted')

        await waitForSeal(id)
        setTxStatus('sealed')
      } catch (err) {
        console.error('Error creating offer:', err)
        setError(err.message)
        setTxStatus('error')
      }
    },
    [resetTx]
  )

  // ── Fill Offer (Payout goes to NFT holder) ─────────────────────
  const fillOffer = useCallback(
    async (holderAddress, offerId, paymentAmount, paymentTokenKey, receiveTokenKey) => {
      resetTx()
      try {
        setTxStatus('pending')

        const paymentTokenConfig = getTokenConfig(paymentTokenKey, FLOW_NETWORK)
        const receiveTokenConfig = getTokenConfig(receiveTokenKey, FLOW_NETWORK)

        if (!paymentTokenConfig) {
          throw new Error(`Invalid payment token: ${paymentTokenKey}`)
        }
        if (!receiveTokenConfig) {
          throw new Error(`Invalid receive token: ${receiveTokenKey}`)
        }

        const cadenceCode = `
          import FungibleToken from ${config.fungibleToken}
          import ${paymentTokenConfig.contractName} from ${paymentTokenConfig.contractAddress}
          import D3SKOfferNFT from ${config.d3skOfferNFT}

          transaction(holderAddress: Address, offerID: UInt64, paymentAmount: UFix64) {
              prepare(signer: auth(BorrowValue) &Account) {
                  // Borrow the holder's collection with Fill entitlement (published by createOffer)
                  let collectionRef = getAccount(holderAddress)
                      .capabilities.borrow<auth(D3SKOfferNFT.Fill) &D3SKOfferNFT.Collection>(
                          D3SKOfferNFT.CollectionPublicPath
                      ) ?? panic("Could not borrow holder's offer collection")

                  // Calculate total payment including protocol fee
                  let feeRate = D3SKOfferNFT.feeRate
                  let feeAmount = paymentAmount * feeRate
                  let totalPayment = paymentAmount + feeAmount

                  let paymentVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &${paymentTokenConfig.vaultType}>(
                      from: ${paymentTokenConfig.storagePath}
                  ) ?? panic("Could not borrow payment vault")
                  let payment <- paymentVaultRef.withdraw(amount: totalPayment)

                  // Fill the offer — payment goes to holderAddress, sell tokens returned to taker
                  let askReceiverPath = ${paymentTokenConfig.receiverPath}
                  let receivedTokens <- collectionRef.fillOffer(
                      id: offerID,
                      payment: <-payment,
                      holderAddress: holderAddress,
                      takerAddress: signer.address,
                      askReceiverPath: askReceiverPath
                  )

                  // Deposit received sell tokens into taker's vault
                  let receiverRef = signer.storage.borrow<&{FungibleToken.Receiver}>(
                      from: ${receiveTokenConfig.storagePath}
                  ) ?? panic("Could not borrow receiver")
                  receiverRef.deposit(from: <-receivedTokens)
              }
          }
        `

        const id = await fcl.mutate({
          cadence: cadenceCode,
          args: (arg, t) => [
            arg(holderAddress, t.Address),
            arg(offerId, t.UInt64),
            arg(toUFix64(paymentAmount), t.UFix64),
          ],
          limit: 9999,
        })

        setTxId(id)
        setTxStatus('submitted')

        await waitForSeal(id)
        setTxStatus('sealed')
      } catch (err) {
        console.error('Error filling offer:', err)
        setError(err.message)
        setTxStatus('error')
      }
    },
    [resetTx]
  )

  // ── Cancel Offer (holder only) ─────────────────────────────────
  const cancelOffer = useCallback(
    async (offerId, tokenKey) => {
      resetTx()
      try {
        setTxStatus('pending')

        const tokenConfig = getTokenConfig(tokenKey, FLOW_NETWORK)
        if (!tokenConfig) {
          throw new Error(`Invalid token: ${tokenKey}`)
        }

        const cadenceCode = `
          import FungibleToken from ${config.fungibleToken}
          import ${tokenConfig.contractName} from ${tokenConfig.contractAddress}
          import D3SKOfferNFT from ${config.d3skOfferNFT}

          transaction(offerID: UInt64) {
              prepare(signer: auth(BorrowValue) &Account) {
                  // Borrow own collection with Cancel entitlement (holder-only)
                  let collectionRef = signer.storage.borrow<
                      auth(D3SKOfferNFT.Cancel) &D3SKOfferNFT.Collection
                  >(
                      from: D3SKOfferNFT.CollectionStoragePath
                  ) ?? panic("Could not borrow offer collection")

                  let returnedVault <- collectionRef.cancelOffer(id: offerID)

                  let vaultRef = signer.storage.borrow<&{FungibleToken.Receiver}>(
                      from: ${tokenConfig.storagePath}
                  ) ?? panic("Could not borrow vault")
                  vaultRef.deposit(from: <-returnedVault)
              }
          }
        `

        const id = await fcl.mutate({
          cadence: cadenceCode,
          args: (arg, t) => [arg(offerId, t.UInt64)],
          limit: 9999,
        })

        setTxId(id)
        setTxStatus('submitted')

        await waitForSeal(id)
        setTxStatus('sealed')
      } catch (err) {
        console.error('Error cancelling offer:', err)
        setError(err.message)
        setTxStatus('error')
      }
    },
    [resetTx]
  )

  return {
    createOffer,
    fillOffer,
    cancelOffer,
    txStatus,
    txId,
    error,
    resetTx,
  }
}
