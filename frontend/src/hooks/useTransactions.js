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
    async (sellAmount, askTokenTypeIdentifier, askAmount, sellTokenKey, askTokenKey, duration = "0.0") => {
      resetTx()
      try {
        setTxStatus('pending')

        const sellTokenConfig = getTokenConfig(sellTokenKey, FLOW_NETWORK)
        const askTokenConfig = getTokenConfig(askTokenKey, FLOW_NETWORK)
        if (!sellTokenConfig) {
          throw new Error(`Invalid sell token: ${sellTokenKey}`)
        }
        if (!askTokenConfig) {
          throw new Error(`Invalid ask token: ${askTokenKey}`)
        }

        // Build imports — avoid duplicates if sell and ask are same contract
        const askImport = (askTokenConfig.contractName !== sellTokenConfig.contractName ||
                           askTokenConfig.contractAddress !== sellTokenConfig.contractAddress)
          ? `import ${askTokenConfig.contractName} from ${askTokenConfig.contractAddress}`
          : ''

        const cadenceCode = `
          import FungibleToken from ${config.fungibleToken}
          import NonFungibleToken from ${config.nonFungibleToken}
          import ${sellTokenConfig.contractName} from ${sellTokenConfig.contractAddress}
          ${askImport}
          import D3SKOfferNFT from ${config.d3skOfferNFT}
          import D3SKFillProxy from ${config.d3skOfferNFT}

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
                  // Publish NFT collection capability if not already published
                  if !signer.capabilities.get<&D3SKOfferNFT.Collection>(D3SKOfferNFT.CollectionPublicPath).check() {
                      signer.capabilities.unpublish(D3SKOfferNFT.CollectionPublicPath)
                      let colCap = signer.capabilities.storage.issue<&D3SKOfferNFT.Collection>(D3SKOfferNFT.CollectionStoragePath)
                      signer.capabilities.publish(colCap, at: D3SKOfferNFT.CollectionPublicPath)
                  }

                  // Setup FillProxy — stores auth(Fill) capability privately inside a resource,
                  // then publishes non-auth &Proxy so takers can call fillOffer without auth
                  if signer.storage.borrow<&D3SKFillProxy.Proxy>(from: D3SKFillProxy.ProxyStoragePath) == nil {
                      let fillCap = signer.capabilities.storage.issue<auth(D3SKOfferNFT.Fill) &D3SKOfferNFT.Collection>(D3SKOfferNFT.CollectionStoragePath)
                      let proxy <- D3SKFillProxy.createProxy(cap: fillCap)
                      signer.storage.save(<-proxy, to: D3SKFillProxy.ProxyStoragePath)

                      signer.capabilities.unpublish(D3SKFillProxy.ProxyPublicPath)
                      let proxyCap = signer.capabilities.storage.issue<&D3SKFillProxy.Proxy>(D3SKFillProxy.ProxyStoragePath)
                      signer.capabilities.publish(proxyCap, at: D3SKFillProxy.ProxyPublicPath)
                  }

                  // Ensure maker has ask token vault (so taker can pay them on fill)
                  if signer.storage.borrow<&{FungibleToken.Receiver}>(from: ${askTokenConfig.storagePath}) == nil {
                      let emptyVault <- ${askTokenConfig.contractName}.createEmptyVault(vaultType: Type<@${askTokenConfig.vaultType}>())
                      signer.storage.save(<-emptyVault, to: ${askTokenConfig.storagePath})
                      let receiverCap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(${askTokenConfig.storagePath})
                      signer.capabilities.publish(receiverCap, at: ${askTokenConfig.receiverPath})
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

        // Build imports — avoid duplicates if payment and receive are same contract
        const receiveImport = (receiveTokenConfig.contractName !== paymentTokenConfig.contractName ||
                               receiveTokenConfig.contractAddress !== paymentTokenConfig.contractAddress)
          ? `import ${receiveTokenConfig.contractName} from ${receiveTokenConfig.contractAddress}`
          : ''

        const cadenceCode = `
          import FungibleToken from ${config.fungibleToken}
          import ${paymentTokenConfig.contractName} from ${paymentTokenConfig.contractAddress}
          ${receiveImport}
          import D3SKOfferNFT from ${config.d3skOfferNFT}
          import D3SKFillProxy from ${config.d3skOfferNFT}

          transaction(holderAddress: Address, offerID: UInt64, paymentAmount: UFix64) {
              prepare(signer: auth(BorrowValue, SaveValue, IssueStorageCapabilityController, PublishCapability) &Account) {
                  // Ensure taker has receive token vault (to receive the sell tokens)
                  if signer.storage.borrow<&{FungibleToken.Receiver}>(from: ${receiveTokenConfig.storagePath}) == nil {
                      let emptyVault <- ${receiveTokenConfig.contractName}.createEmptyVault(vaultType: Type<@${receiveTokenConfig.vaultType}>())
                      signer.storage.save(<-emptyVault, to: ${receiveTokenConfig.storagePath})
                      let receiverCap = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(${receiveTokenConfig.storagePath})
                      signer.capabilities.publish(receiverCap, at: ${receiveTokenConfig.receiverPath})
                  }

                  // Borrow the holder's FillProxy (non-auth — proxy wraps auth capability internally)
                  let proxyRef = getAccount(holderAddress)
                      .capabilities.borrow<&D3SKFillProxy.Proxy>(
                          D3SKFillProxy.ProxyPublicPath
                      ) ?? panic("Could not borrow holder's fill proxy")

                  // Calculate total payment including protocol fee
                  let feeRate = D3SKOfferNFT.feeRate
                  let feeAmount = paymentAmount * feeRate
                  let totalPayment = paymentAmount + feeAmount

                  let paymentVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &${paymentTokenConfig.vaultType}>(
                      from: ${paymentTokenConfig.storagePath}
                  ) ?? panic("Could not borrow payment vault")
                  let payment <- paymentVaultRef.withdraw(amount: totalPayment)

                  // Fill via proxy — payment goes to holderAddress, sell tokens returned to taker
                  let askReceiverPath = ${paymentTokenConfig.receiverPath}
                  let receivedTokens <- proxyRef.fillOffer(
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
        let errorMessage = err.message
        // Check for treasury receiver configuration errors
        if (errorMessage && errorMessage.includes('Could not borrow treasury')) {
          errorMessage = 'The D3SK treasury is not set up to collect fees in this token. Please contact the team or try a different trading pair.'
        }
        setError(errorMessage)
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
