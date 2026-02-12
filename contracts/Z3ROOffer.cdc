// Z3ROOffer.cdc — Core zero-custody offer resource
// Offers live in the MAKER'S account. Settlement is atomic, peer-to-peer.

import FungibleToken from "FungibleToken"

access(all) contract Z3ROOffer {

    // ── Entitlements ──────────────────────────────────────────────
    access(all) entitlement Fill
    access(all) entitlement Cancel

    // ── Events ────────────────────────────────────────────────────
    access(all) event OfferCreated(
        id: UInt64,
        maker: Address,
        sellType: String,
        sellAmount: UFix64,
        askType: String,
        askAmount: UFix64
    )
    access(all) event OfferFilled(
        id: UInt64,
        maker: Address,
        taker: Address,
        sellType: String,
        sellAmount: UFix64,
        askType: String,
        askAmount: UFix64
    )
    access(all) event OfferCancelled(
        id: UInt64,
        maker: Address,
        sellType: String,
        sellAmount: UFix64
    )

    // ── State ─────────────────────────────────────────────────────
    access(all) var nextOfferID: UInt64

    // ── Offer Resource ────────────────────────────────────────────
    // The heart of Z3RO. Contains the sell-side vault and specifies the ask.
    // Lives in the maker's account storage.
    access(all) resource Offer {
        access(all) let id: UInt64
        access(all) let maker: Address
        access(all) let sellTokenType: Type
        access(all) let askTokenType: Type
        access(all) let askAmount: UFix64
        access(all) let createdAt: UFix64

        // The sell-side vault — tokens locked here until fill or cancel
        access(self) var sellVault: @{FungibleToken.Vault}?

        init(
            id: UInt64,
            maker: Address,
            sellVault: @{FungibleToken.Vault},
            askTokenType: Type,
            askAmount: UFix64
        ) {
            self.id = id
            self.maker = maker
            self.sellTokenType = sellVault.getType()
            self.askTokenType = askTokenType
            self.askAmount = askAmount
            self.createdAt = getCurrentBlock().timestamp
            self.sellVault <- sellVault
        }

        // ── Fill ──────────────────────────────────────────────────
        // Callable by anyone via published capability.
        // Takes buyer's payment, verifies it, deposits to maker, returns sell vault.
        access(Fill) fun fill(payment: @{FungibleToken.Vault}, takerAddress: Address): @{FungibleToken.Vault} {
            pre {
                self.sellVault != nil: "Offer already consumed"
                payment.getType() == self.askTokenType: "Payment token type mismatch"
                payment.balance == self.askAmount: "Payment amount must equal ask amount exactly"
            }

            // Capture sell amount for the event before moving
            let sellAmount = self.sellVault?.balance!

            // Move the sell vault out
            let sellTokens <- self.sellVault <- nil

            // Deposit payment to maker's receiver capability
            let makerAccount = getAccount(self.maker)

            // Determine the receiver path based on token type
            // We try the standard receiver paths
            let receiverRef = makerAccount.capabilities.borrow<&{FungibleToken.Receiver}>(
                self.getReceiverPath(tokenType: self.askTokenType)
            ) ?? panic("Could not borrow maker's receiver for ask token")

            receiverRef.deposit(from: <-payment)

            emit OfferFilled(
                id: self.id,
                maker: self.maker,
                taker: takerAddress,
                sellType: self.sellTokenType.identifier,
                sellAmount: sellAmount,
                askType: self.askTokenType.identifier,
                askAmount: self.askAmount
            )

            return <-sellTokens!
        }

        // ── Cancel ────────────────────────────────────────────────
        // Only callable by maker via auth entitlement. Returns tokens.
        access(Cancel) fun cancel(): @{FungibleToken.Vault} {
            pre {
                self.sellVault != nil: "Offer already consumed or cancelled"
            }

            let sellAmount = self.sellVault?.balance!
            let vault <- self.sellVault <- nil

            emit OfferCancelled(
                id: self.id,
                maker: self.maker,
                sellType: self.sellTokenType.identifier,
                sellAmount: sellAmount
            )

            return <-vault!
        }

        // ── Getters ───────────────────────────────────────────────
        access(all) fun getSellAmount(): UFix64 {
            return self.sellVault?.balance ?? 0.0
        }

        access(all) fun isActive(): Bool {
            return self.sellVault != nil
        }

        access(all) fun getDetails(): OfferDetails {
            return OfferDetails(
                id: self.id,
                maker: self.maker,
                sellType: self.sellTokenType.identifier,
                sellAmount: self.getSellAmount(),
                askType: self.askTokenType.identifier,
                askAmount: self.askAmount,
                createdAt: self.createdAt,
                isActive: self.isActive()
            )
        }

        // Helper to resolve receiver paths for known token types
        access(self) fun getReceiverPath(tokenType: Type): PublicPath {
            // FlowToken
            if tokenType.identifier == "A.1654653399040a61.FlowToken.Vault"
                || tokenType.identifier == "A.7e60df042a9c0868.FlowToken.Vault"
                || tokenType.identifier == "A.0ae53cb6e3f42a79.FlowToken.Vault" {
                return /public/flowTokenReceiver
            }
            // USDCFlow (mainnet)
            if tokenType.identifier == "A.b19436aae4d94622.FiatToken.Vault" {
                return /public/USDCVaultReceiver
            }
            // Default: try generic fungible token receiver
            return /public/flowTokenReceiver
        }
    }

    // ── Offer Details Struct ──────────────────────────────────────
    access(all) struct OfferDetails {
        access(all) let id: UInt64
        access(all) let maker: Address
        access(all) let sellType: String
        access(all) let sellAmount: UFix64
        access(all) let askType: String
        access(all) let askAmount: UFix64
        access(all) let createdAt: UFix64
        access(all) let isActive: Bool

        init(
            id: UInt64,
            maker: Address,
            sellType: String,
            sellAmount: UFix64,
            askType: String,
            askAmount: UFix64,
            createdAt: UFix64,
            isActive: Bool
        ) {
            self.id = id
            self.maker = maker
            self.sellType = sellType
            self.sellAmount = sellAmount
            self.askType = askType
            self.askAmount = askAmount
            self.createdAt = createdAt
            self.isActive = isActive
        }
    }

    // ── Offer Collection Resource Interface ──────────────────────
    // Published publicly so takers can browse and fill offers
    access(all) resource interface OfferCollectionPublic {
        access(all) fun getOfferIDs(): [UInt64]
        access(all) fun getOfferDetails(id: UInt64): OfferDetails?
        access(Fill) fun borrowOfferForFill(id: UInt64): auth(Fill) &Offer?
    }

    // ── Offer Collection ─────────────────────────────────────────
    // Stores multiple offers in the maker's account
    access(all) resource OfferCollection: OfferCollectionPublic {
        access(self) var offers: @{UInt64: Offer}

        init() {
            self.offers <- {}
        }

        // Create and store a new offer
        access(all) fun createOffer(
            sellVault: @{FungibleToken.Vault},
            askTokenType: Type,
            askAmount: UFix64,
            makerAddress: Address
        ): UInt64 {
            let id = Z3ROOffer.nextOfferID
            Z3ROOffer.nextOfferID = Z3ROOffer.nextOfferID + 1

            let sellType = sellVault.getType().identifier
            let sellAmount = sellVault.balance

            let offer <- create Offer(
                id: id,
                maker: makerAddress,
                sellVault: <-sellVault,
                askTokenType: askTokenType,
                askAmount: askAmount
            )

            self.offers[id] <-! offer

            emit OfferCreated(
                id: id,
                maker: makerAddress,
                sellType: sellType,
                sellAmount: sellAmount,
                askType: askTokenType.identifier,
                askAmount: askAmount
            )

            return id
        }

        // Cancel an offer and return tokens
        access(Cancel) fun cancelOffer(id: UInt64): @{FungibleToken.Vault} {
            let offer <- self.offers.remove(key: id)
                ?? panic("Offer not found")

            let vault <- offer.cancel()
            destroy offer
            return <-vault
        }

        // Get all offer IDs
        access(all) fun getOfferIDs(): [UInt64] {
            return self.offers.keys
        }

        // Get details for a specific offer
        access(all) fun getOfferDetails(id: UInt64): OfferDetails? {
            if let offerRef = &self.offers[id] as &Offer? {
                return offerRef.getDetails()
            }
            return nil
        }

        // Borrow offer for filling (requires Fill entitlement)
        access(Fill) fun borrowOfferForFill(id: UInt64): auth(Fill) &Offer? {
            return &self.offers[id] as auth(Fill) &Offer?
        }

        // Remove consumed offer after fill
        access(all) fun removeOffer(id: UInt64) {
            if let offerRef = &self.offers[id] as &Offer? {
                if !offerRef.isActive() {
                    let offer <- self.offers.remove(key: id)
                    destroy offer
                }
            }
        }
    }

    // ── Storage Paths ─────────────────────────────────────────────
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath

    // ── Public Functions ──────────────────────────────────────────
    access(all) fun createEmptyCollection(): @OfferCollection {
        return <-create OfferCollection()
    }

    // ── Contract Init ─────────────────────────────────────────────
    init() {
        self.nextOfferID = 1
        self.CollectionStoragePath = /storage/Z3ROOfferCollection
        self.CollectionPublicPath = /public/Z3ROOfferCollection
    }
}
