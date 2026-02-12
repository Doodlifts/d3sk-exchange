import { useState, useCallback } from 'react'
import { fcl, config, FLOW_NETWORK } from '../config/fcl'
import { TOKEN_REGISTRY, getTokenConfig } from '../config/tokens'

export function useTransactions() {
  const [txStatus, setTxStatus] = useState(null)
  const [txId, setTxId] = useState(null)
  const [error, setError] = useState(null)

  const resetTx = useCallback(() => {
    setTxStatus(null)
    setTxId(null)
    setError(null)
  }, [])

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
          import FlowTransactionScheduler from 0xSCHEDULER
          import FlowTransactionSchedulerUtils from 0xSCHEDULERUTILS

          transaction(sellAmount: UFix64, askTokenTypeIdentifier: String, askAmount: UFix64, duration: UFix64) {
              let offerNFT: @D3SKOfferNFT.NFT
              let expiresAt: UFix64?

              prepare(signer: auth(BorrowValue, SaveValue, LoadValue, IssueStorageCapabilityController, PublishCapability) &Account) {
                  // Calculate expiration
                  if duration > 0.0 {
                      self.expiresAt = getCurrentBlock().timestamp + duration
                  } else {
                      self.expiresAt = nil
                  }

                  // Setup NFT Collection if needed
                  if signer.storage.borrow<&D3SKOfferNFT.Collection>(from: D3SKOfferNFT.CollectionStoragePath) == nil {
                      let collection <- D3SKOfferNFT.createEmptyCollection(nftType: Type<@D3SKOfferNFT.NFT>())
                      signer.storage.save(<-collection, to: D3SKOfferNFT.CollectionStoragePath)

                      // Publish with Fill entitlement so anyone can fill offers
                      let cap = signer.capabilities.storage.issue<
                          auth(D3SKOfferNFT.Fill) &D3SKOfferNFT.Collection
                      >(D3SKOfferNFT.CollectionStoragePath)
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
                  self.offerNFT <- D3SKOfferNFT.mintOffer(
                      sellVault: <-sellVault,
                      askTokenType: askType,
                      askAmount: askAmount,
                      makerAddress: signer.address,
                      expiresAt: self.expiresAt
                  )

                  // Schedule expiration if needed
                  if self.expiresAt != nil {
                      let cancelCap = signer.capabilities.storage.issue<
                          auth(D3SKOfferNFT.Cancel) &D3SKOfferNFT.Collection
                      >(D3SKOfferNFT.CollectionStoragePath)
                      let receiverCap = signer.capabilities.storage.issue<
                          &{FungibleToken.Receiver}
                      >(${sellTokenConfig.storagePath})
                      let handler <- D3SKOfferNFT.createExpirationHandler(
                          offerID: self.offerNFT.id,
                          holderAddress: signer.address,
                          collectionCapability: cancelCap,
                          receiverCapability: receiverCap
                      )
                      let handlerPath = StoragePath(identifier: "D3SKExpire_".concat(self.offerNFT.id.toString()))!
                      signer.storage.save(<-handler, to: handlerPath)
                      let scheduleCap = signer.capabilities.storage.issue<
                          auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}
                      >(handlerPath)
                      FlowTransactionSchedulerUtils.Manager.schedule(
                          handlerCapability: scheduleCap,
                          executeAfter: self.expiresAt!
                      )
                  }
              }

              execute {
                  // Deposit the NFT into signer's collection
                  let collectionRef = self.account.storage.borrow<&D3SKOfferNFT.Collection>(
                      from: D3SKOfferNFT.CollectionStoragePath
                  ) ?? panic("Could not borrow collection")
                  collectionRef.deposit(token: <-self.offerNFT)
              }
          }
        `

        const id = await fcl.mutate({
          cadence: cadenceCode,
          args: (arg, t) => [
            arg(sellAmount, t.UFix64),
            arg(askTokenTypeIdentifier, t.String),
            arg(askAmount, t.UFix64),
            arg(duration, t.UFix64),
          ],
          limit: 9999,
        })

        setTxId(id)
        setTxStatus('submitted')

        await fcl.tx(id).onceSealed()
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
                  // Borrow the HOLDER's collection (not maker's — holder may differ if NFT was transferred)
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
            arg(paymentAmount, t.UFix64),
          ],
          limit: 9999,
        })

        setTxId(id)
        setTxStatus('submitted')

        await fcl.tx(id).onceSealed()
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

        await fcl.tx(id).onceSealed()
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
