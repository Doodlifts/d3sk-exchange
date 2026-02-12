import D3SKOffer from "D3SKOffer"

/// Admin transaction: Update the protocol fee rate
/// Only callable by the account holding the Administrator resource.
///
/// Parameters:
/// - newRate: The new fee rate as a decimal (e.g., 0.003 = 0.3%). Max 5%.
transaction(newRate: UFix64) {
    prepare(signer: auth(BorrowValue) &Account) {
        let adminRef = signer.storage.borrow<auth(D3SKOffer.Admin) &D3SKOffer.Administrator>(
            from: D3SKOffer.AdminStoragePath
        ) ?? panic("Only the admin can change the fee rate")

        adminRef.setFeeRate(newRate: newRate)
    }
}
