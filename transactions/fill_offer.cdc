import FungibleToken from "FungibleToken"
import FlowToken from "FlowToken"
import D3SKOffer from "D3SKOffer"
import D3SKRegistry from "D3SKRegistry"

/// Transaction: Fill an existing offer on the D3SK exchange
///
/// The taker:
/// 1. Borrows the maker's OfferCollection capability (publicly available)
/// 2. Withdraws payment tokens from their own vault
/// 3. Calls fill() on the offer (atomic settlement)
/// 4. Deposits the received tokens back into their vault
/// 5. Removes the consumed offer from the maker's collection
/// 6. Removes the offer from the D3SKRegistry
///
/// Note: In V1, this assumes both sides use FlowToken. For multi-token support,
/// the deposit logic and vault paths would need to be parameterized.
///
/// Parameters:
/// - makerAddress: The Flow account address of the offer maker
/// - offerID: The unique ID of the offer to fill
/// - paymentAmount: The amount of tokens the taker is paying
transaction(makerAddress: Address, offerID: UInt64, paymentAmount: UFix64) {

    prepare(signer: auth(BorrowValue) &Account) {
        // Step 1: Borrow the maker's published OfferCollection capability
        // The Fill entitlement allows the taker to call borrowOfferForFill() and fill offers
        let collectionRef = getAccount(makerAddress)
            .capabilities.borrow<auth(D3SKOffer.Fill) &D3SKOffer.OfferCollection>(
                D3SKOffer.CollectionPublicPath
            ) ?? panic("Could not borrow maker's offer collection capability")

        // Step 2: Borrow the specific offer that the taker wants to fill
        let offerRef = collectionRef.borrowOfferForFill(id: offerID)
            ?? panic("Offer not found or already consumed")

        // Step 3: Withdraw payment tokens from taker's FlowToken vault
        let paymentVaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow taker's FlowToken vault")

        let payment <- paymentVaultRef.withdraw(amount: paymentAmount)

        // Step 4: ATOMIC SETTLEMENT - Execute the fill
        // The maker's offer validates the payment amount and type, then returns the sell tokens
        let receivedTokens <- offerRef.fill(payment: <-payment, takerAddress: signer.address)

        // Step 5: Deposit received tokens into taker's FlowToken vault
        // In V1, the maker is selling FlowToken, so this is safe
        // TODO: For multi-token support, determine the correct deposit path based on actual received token type
        let receiverRef = signer.storage.borrow<&{FungibleToken.Receiver}>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow taker's FlowToken receiver vault")

        receiverRef.deposit(from: <-receivedTokens)

        // Step 6: Clean up: Remove the filled offer from maker's collection
        collectionRef.removeOffer(id: offerID)

        // Step 7: Remove from registry to prevent double-spending/filling
        D3SKRegistry.removeOffer(id: offerID, reason: "filled")
    }
}
