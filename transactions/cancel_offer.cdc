import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import D3SKOffer from "D3SKOffer"
import D3SKRegistry from "D3SKRegistry"

/// Transaction: Cancel an existing offer on the D3SK exchange
///
/// The maker:
/// 1. Borrows their OfferCollection with Cancel entitlement
/// 2. Cancels the specified offer (which returns the escrowed tokens)
/// 3. Deposits the returned tokens back into their vault
/// 4. Removes the offer from the D3SKRegistry
///
/// Only the offer maker can cancel an offer.
///
/// Parameters:
/// - offerID: The unique ID of the offer to cancel
transaction(offerID: UInt64) {

    prepare(signer: auth(BorrowValue) &Account) {
        // Step 1: Borrow the signer's OfferCollection with Cancel entitlement
        // Only the owner of the collection can cancel offers
        let collectionRef = signer.storage.borrow<auth(D3SKOffer.Cancel) &D3SKOffer.OfferCollection>(
            from: D3SKOffer.CollectionStoragePath
        ) ?? panic("Could not borrow offer collection with Cancel entitlement")

        // Step 2: Cancel the offer and receive the escrowed tokens back
        let returnedVault <- collectionRef.cancelOffer(id: offerID)

        // Step 3: Deposit the returned tokens back into the maker's FlowToken vault
        let vaultRef = signer.storage.borrow<&{FungibleToken.Receiver}>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow FlowToken vault receiver")

        vaultRef.deposit(from: <-returnedVault)

        // Step 4: Remove the cancelled offer from the D3SKRegistry
        // This prevents the offer from appearing in discovery/indexing
        D3SKRegistry.removeOffer(id: offerID, reason: "cancelled")
    }
}
