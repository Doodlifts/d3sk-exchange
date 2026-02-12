import D3SKOffer from "D3SKOffer"

/// Admin transaction: Update the treasury address where protocol fees are sent
/// Only callable by the account holding the Administrator resource.
///
/// Parameters:
/// - newAddress: The new treasury address (could be a DAO vault, multisig, etc.)
transaction(newAddress: Address) {
    prepare(signer: auth(BorrowValue) &Account) {
        let adminRef = signer.storage.borrow<auth(D3SKOffer.Admin) &D3SKOffer.Administrator>(
            from: D3SKOffer.AdminStoragePath
        ) ?? panic("Only the admin can change the treasury address")

        adminRef.setTreasuryAddress(newAddress: newAddress)
    }
}
