import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import D3SKOffer from "D3SKOffer"
import D3SKRegistry from "D3SKRegistry"
import FlowTransactionScheduler from "FlowTransactionScheduler"
import FlowTransactionSchedulerUtils from "FlowTransactionSchedulerUtils"

/// Transaction: Create a new offer on the D3SK exchange
///
/// The maker withdraws tokens from their vault, wraps them in a new Offer,
/// registers the offer with the onchain index, and optionally schedules
/// an expiration handler via Flow's native Scheduled Transactions.
///
/// Parameters:
/// - sellAmount: The amount of tokens the maker is selling
/// - askTokenTypeIdentifier: The fully qualified type identifier of the token being asked for
/// - askAmount: The amount of ask tokens the maker wants in exchange
/// - duration: Optional duration in seconds (0.0 = no expiration). If set, a scheduled
///             transaction will auto-cancel the offer after this period.
transaction(sellAmount: UFix64, askTokenTypeIdentifier: String, askAmount: UFix64, duration: UFix64) {
    let offerID: UInt64
    let expiresAt: UFix64?

    prepare(signer: auth(BorrowValue, SaveValue, LoadValue, IssueStorageCapabilityController, PublishCapability) &Account) {
        // Calculate expiration timestamp (0.0 duration = no expiration)
        if duration > 0.0 {
            self.expiresAt = getCurrentBlock().timestamp + duration
        } else {
            self.expiresAt = nil
        }

        // Setup: Ensure maker has an OfferCollection in storage
        if signer.storage.borrow<&D3SKOffer.OfferCollection>(from: D3SKOffer.CollectionStoragePath) == nil {
            let collection <- D3SKOffer.createEmptyCollection()
            signer.storage.save(<-collection, to: D3SKOffer.CollectionStoragePath)

            // Issue a capability with Fill entitlement for takers to use when filling this offer
            let cap = signer.capabilities.storage.issue<auth(D3SKOffer.Fill) &D3SKOffer.OfferCollection>(
                D3SKOffer.CollectionStoragePath
            )
            // Publish the capability at the public path so takers can discover and use it
            signer.capabilities.publish(cap, at: D3SKOffer.CollectionPublicPath)
        }

        // Withdraw the sell tokens from maker's FlowToken vault
        let flowVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault from signer storage")

        let sellVault <- flowVaultRef.withdraw(amount: sellAmount)

        // Parse the ask token type from the provided identifier string
        let askType = CompositeType(askTokenTypeIdentifier)
            ?? panic("Invalid ask token type identifier: ".concat(askTokenTypeIdentifier))

        // Borrow the maker's OfferCollection to create the offer
        let collectionRef = signer.storage.borrow<&D3SKOffer.OfferCollection>(
            from: D3SKOffer.CollectionStoragePath
        ) ?? panic("Could not borrow offer collection from storage")

        // Create the offer and get back its ID
        self.offerID = collectionRef.createOffer(
            sellVault: <-sellVault,
            askTokenType: askType,
            askAmount: askAmount,
            makerAddress: signer.address,
            expiresAt: self.expiresAt
        )

        // Register the offer with the D3SKRegistry for discovery and indexing
        D3SKRegistry.registerOffer(
            id: self.offerID,
            maker: signer.address,
            sellType: Type<@FlowToken.Vault>().identifier,
            sellAmount: sellAmount,
            askType: askTokenTypeIdentifier,
            askAmount: askAmount,
            expiresAt: self.expiresAt
        )

        // Schedule expiration handler via Flow's native Scheduled Transactions
        if self.expiresAt != nil {
            // Issue Cancel capability for the expiration handler
            let cancelCap = signer.capabilities.storage.issue<
                auth(D3SKOffer.Cancel) &D3SKOffer.OfferCollection
            >(D3SKOffer.CollectionStoragePath)

            // Issue receiver capability for returning tokens
            let receiverCap = signer.capabilities.storage.issue<
                &{FungibleToken.Receiver}
            >(/storage/flowTokenVault)

            // Create expiration handler resource with stored capabilities
            let handler <- D3SKOffer.createExpirationHandler(
                offerID: self.offerID,
                makerAddress: signer.address,
                collectionCapability: cancelCap,
                receiverCapability: receiverCap
            )

            // Save handler to unique storage path
            let handlerPath = StoragePath(identifier: "D3SKExpire_".concat(self.offerID.toString()))!
            signer.storage.save(<-handler, to: handlerPath)

            // Issue capability and schedule execution at expiration time
            let scheduleCap = signer.capabilities.storage.issue<
                auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}
            >(handlerPath)

            FlowTransactionSchedulerUtils.Manager.schedule(
                handlerCapability: scheduleCap,
                executeAfter: self.expiresAt!
            )
        }
    }

    post {
        self.offerID > 0: "Offer ID must be valid (greater than 0)"
    }
}
