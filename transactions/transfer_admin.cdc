import D3SKOffer from "D3SKOffer"

/// Admin transaction: Transfer the Administrator resource to a new account
/// Requires BOTH the current admin AND the new admin to sign.
/// This is the "DAO handoff" — once transferred, the original deployer
/// loses all admin privileges.
transaction() {
    prepare(
        currentAdmin: auth(LoadValue) &Account,
        newAdmin: auth(SaveValue) &Account
    ) {
        // Load the Administrator resource from the current holder
        let admin <- currentAdmin.storage.load<@D3SKOffer.Administrator>(
            from: D3SKOffer.AdminStoragePath
        ) ?? panic("No Administrator resource found — are you the admin?")

        // Save to the new admin's account (they co-signed, so this is authorized)
        newAdmin.storage.save(<-admin, to: D3SKOffer.AdminStoragePath)

        emit D3SKOffer.AdminTransferred(newAdmin: newAdmin.address)
    }
}
