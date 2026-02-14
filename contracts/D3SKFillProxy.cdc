// D3SKFillProxy.cdc — Workaround for Cadence entitlement regression
// Wraps an auth(Fill) capability inside a resource with access(all) methods,
// allowing takers to fill offers via a non-auth public capability.
// Deploy once per account. Can be removed after Cadence HCU fixes the issue.

import FungibleToken from "FungibleToken"
import D3SKOfferNFT from "D3SKOfferNFT"

access(all) contract D3SKFillProxy {

    access(all) let ProxyStoragePath: StoragePath
    access(all) let ProxyPublicPath: PublicPath

    access(all) resource Proxy {
        // Stored privately — never exposed on a public path
        access(self) let cap: Capability<auth(D3SKOfferNFT.Fill) &D3SKOfferNFT.Collection>

        // Anyone can call this via a non-auth &Proxy reference
        access(all) fun fillOffer(
            id: UInt64,
            payment: @{FungibleToken.Vault},
            holderAddress: Address,
            takerAddress: Address,
            askReceiverPath: PublicPath,
            askStoragePath: StoragePath
        ): @{FungibleToken.Vault} {
            let collectionRef = self.cap.borrow()
                ?? panic("Cannot borrow collection from stored capability")

            return <-collectionRef.fillOffer(
                id: id,
                payment: <-payment,
                holderAddress: holderAddress,
                takerAddress: takerAddress,
                askReceiverPath: askReceiverPath,
                askStoragePath: askStoragePath
            )
        }

        init(cap: Capability<auth(D3SKOfferNFT.Fill) &D3SKOfferNFT.Collection>) {
            self.cap = cap
        }
    }

    access(all) fun createProxy(
        cap: Capability<auth(D3SKOfferNFT.Fill) &D3SKOfferNFT.Collection>
    ): @Proxy {
        return <-create Proxy(cap: cap)
    }

    init() {
        self.ProxyStoragePath = /storage/D3SKFillProxy
        self.ProxyPublicPath = /public/D3SKFillProxy
    }
}
