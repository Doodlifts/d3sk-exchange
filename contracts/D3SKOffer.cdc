// D3SKOffer.cdc — Core zero-custody offer resource
// Offers live in the MAKER'S account. Settlement is atomic, peer-to-peer.
// Supports optional expiration via Flow's native Scheduled Transactions.
// Protocol fee on fills — configurable by admin, destined for DAO governance.

import FungibleToken from "FungibleToken"
import FlowTransactionScheduler from "FlowTransactionScheduler"
import FlowTransactionSchedulerUtils from "FlowTransactionSchedulerUtils"
import D3SKRegistry from "D3SKRegistry"

access(all) contract D3SKOffer {

    // ── Entitlements ──────────────────────────────────────────────
    access(all) entitlement Fill
    access(all) entitlement Cancel
    access(all) entitlement Admin

    // ── Events ────────────────────────────────────────────────────
    access(all) event OfferCreated(
        id: UInt64,
        maker: Address,
        sellType: String,
        sellAmount: UFix64,
        askType: String,
        askAmount: UFix64,
        expiresAt: UFix64?
    )
    access(all) event OfferFilled(
        id: UInt64,
        maker: Address,
        taker: Address,
        sellType: String,
        sellAmount: UFix64,
        askType: String,
        askAmount: UFix64,
        feeAmount: UFix64
    )
    access(all) event OfferCancelled(
        id: UInt64,
        maker: Address,
        sellType: String,
        sellAmount: UFix64
    )
    access(all) event OfferExpired(
        id: UInt64,
        maker: Address,
        sellType: String,
        sellAmount: UFix64
    )
    access(all) event FeeCollected(
        offerId: UInt64,
        tokenType: String,
        amount: UFix64
    )
    access(all) event FeeRateUpdated(
        oldRate: UFix64,
        newRate: UFix64
    )
    access(all) event TreasuryAddressUpdated(
        oldAddress: Address,
        newAddress: Address
    )
    access(all) event AdminTransferred(
        newAdmin: Address
    )

    // ── State ─────────────────────────────────────────────────────
    access(all) var nextOfferID: UInt64

    // Protocol fee state — admin-configurable, DAO-ready
    access(all) var feeRate: UFix64             // e.g. 0.003 = 0.3%
    access(all) var treasuryAddress: Address     // where fees are sent

    // ── Offer Resource ────────────────────────────────────────────
    // The heart of D3SK. Contains the sell-side vault and specifies the ask.
    // Lives in the maker's account storage.
    access(all) resource Offer {
        access(all) let id: UInt64
        access(all) let maker: Address
        access(all) let sellTokenType: Type
        access(all) let askTokenType: Type
        access(all) let askAmount: UFix64
        access(all) let createdAt: UFix64
        access(all) let expiresAt: UFix64?    // nil = no expiration

        // The sell-side vault — tokens locked here until fill or cancel
        access(self) var sellVault: @{FungibleToken.Vault}?

        init(
            id: UInt64,
            maker: Address,
            sellVault: @{FungibleToken.Vault},
            askTokenType: Type,
            askAmount: UFix64,
            expiresAt: UFix64?
        ) {
            self.id = id
            self.maker = maker
            self.sellTokenType = sellVault.getType()
            self.askTokenType = askTokenType
            self.askAmount = askAmount
            self.createdAt = getCurrentBlock().timestamp
            self.expiresAt = expiresAt
            self.sellVault <- sellVault
        }

        // ── Fill ──────────────────────────────────────────────────
        // Callable by anyone via published capability.
        // Taker sends askAmount + fee. Maker receives askAmount. Fee goes to treasury.
        // askReceiverPath: the public receiver path for the ask token (e.g. /public/flowTokenReceiver).
        // Passed by the transaction so the contract supports ANY FungibleToken without hardcoding paths.
        access(Fill) fun fill(payment: @{FungibleToken.Vault}, takerAddress: Address, askReceiverPath: PublicPath): @{FungibleToken.Vault} {
            pre {
                self.sellVault != nil: "Offer already consumed"
                payment.getType() == self.askTokenType: "Payment token type mismatch"
                self.expiresAt == nil || getCurrentBlock().timestamp <= self.expiresAt!: "Offer has expired"
            }

            // Calculate required payment (askAmount + protocol fee)
            let feeAmount = self.askAmount * D3SKOffer.feeRate
            let totalRequired = self.askAmount + feeAmount

            assert(
                payment.balance >= totalRequired,
                message: "Payment must cover ask amount plus protocol fee (".concat(totalRequired.toString()).concat(" required)")
            )

            // Capture sell amount for the event before moving
            let sellAmount = self.sellVault?.balance ?? 0.0

            // Move the sell vault out
            let sellTokens <- self.sellVault <- nil

            // ── Split payment: askAmount to maker, fee to treasury ──

            // 1. Withdraw maker's portion from the payment
            let makerPayment <- payment.withdraw(amount: self.askAmount)

            // 2. Deposit maker's portion using the provided receiver path
            let makerAccount = getAccount(self.maker)
            let receiverRef = makerAccount.capabilities.borrow<&{FungibleToken.Receiver}>(
                askReceiverPath
            ) ?? panic("Could not borrow maker's receiver for ask token")
            receiverRef.deposit(from: <-makerPayment)

            // 3. Deposit fee to treasury (whatever remains in payment vault)
            let actualFee = payment.balance
            if actualFee > 0.0 {
                let treasuryAccount = getAccount(D3SKOffer.treasuryAddress)
                let treasuryReceiver = treasuryAccount.capabilities.borrow<&{FungibleToken.Receiver}>(
                    askReceiverPath
                ) ?? panic("Could not borrow treasury receiver for fee deposit")

                emit FeeCollected(
                    offerId: self.id,
                    tokenType: self.askTokenType.identifier,
                    amount: actualFee
                )

                treasuryReceiver.deposit(from: <-payment)
            } else {
                // No fee (feeRate is 0) — destroy empty vault
                destroy payment
            }

            emit OfferFilled(
                id: self.id,
                maker: self.maker,
                taker: takerAddress,
                sellType: self.sellTokenType.identifier,
                sellAmount: sellAmount,
                askType: self.askTokenType.identifier,
                askAmount: self.askAmount,
                feeAmount: actualFee
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

        // ── Expire ────────────────────────────────────────────────
        // Returns tokens when an offer has passed its expiration.
        // Callable via Cancel entitlement (maker or scheduled handler).
        access(Cancel) fun expire(): @{FungibleToken.Vault} {
            pre {
                self.sellVault != nil: "Offer already consumed or cancelled"
                self.expiresAt != nil: "Offer has no expiration set"
                getCurrentBlock().timestamp >= self.expiresAt!: "Offer has not expired yet"
            }

            let sellAmount = self.sellVault?.balance!
            let vault <- self.sellVault <- nil

            emit OfferExpired(
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

        access(all) fun isExpired(): Bool {
            if self.expiresAt == nil { return false }
            return getCurrentBlock().timestamp >= self.expiresAt!
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
                expiresAt: self.expiresAt,
                isActive: self.isActive(),
                isExpired: self.isExpired()
            )
        }

        // NOTE: Receiver paths are no longer hardcoded in the contract.
        // The fill() function accepts askReceiverPath as a parameter from the transaction,
        // allowing D3SK to support ANY FungibleToken on Flow without contract updates.
        // The frontend token registry (tokens.js) provides the correct receiver path for each token.
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
        access(all) let expiresAt: UFix64?
        access(all) let isActive: Bool
        access(all) let isExpired: Bool

        init(
            id: UInt64,
            maker: Address,
            sellType: String,
            sellAmount: UFix64,
            askType: String,
            askAmount: UFix64,
            createdAt: UFix64,
            expiresAt: UFix64?,
            isActive: Bool,
            isExpired: Bool
        ) {
            self.id = id
            self.maker = maker
            self.sellType = sellType
            self.sellAmount = sellAmount
            self.askType = askType
            self.askAmount = askAmount
            self.createdAt = createdAt
            self.expiresAt = expiresAt
            self.isActive = isActive
            self.isExpired = isExpired
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
            makerAddress: Address,
            expiresAt: UFix64?
        ): UInt64 {
            pre {
                sellVault.balance > 0.0: "Sell amount must be positive"
                askAmount > 0.0: "Ask amount must be positive"
                expiresAt == nil || expiresAt! > getCurrentBlock().timestamp: "Expiration must be in the future"
            }
            let id = D3SKOffer.nextOfferID
            D3SKOffer.nextOfferID = D3SKOffer.nextOfferID + 1

            let sellType = sellVault.getType().identifier
            let sellAmount = sellVault.balance

            let offer <- create Offer(
                id: id,
                maker: makerAddress,
                sellVault: <-sellVault,
                askTokenType: askTokenType,
                askAmount: askAmount,
                expiresAt: expiresAt
            )

            self.offers[id] <-! offer

            emit OfferCreated(
                id: id,
                maker: makerAddress,
                sellType: sellType,
                sellAmount: sellAmount,
                askType: askTokenType.identifier,
                askAmount: askAmount,
                expiresAt: expiresAt
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

        // Expire an offer and return tokens (for scheduled handler)
        access(Cancel) fun expireOffer(id: UInt64): @{FungibleToken.Vault} {
            let offer <- self.offers.remove(key: id)
                ?? panic("Offer not found")

            let vault <- offer.expire()
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

    // ── Administrator Resource ────────────────────────────────────
    // Controls protocol fee rate and treasury address.
    // Created at contract deploy, stored in deployer's account.
    // Can be transferred to a DAO governance contract later.
    access(all) resource Administrator {

        // Update the protocol fee rate (capped at 5%)
        access(Admin) fun setFeeRate(newRate: UFix64) {
            pre {
                newRate <= 0.05: "Fee rate cannot exceed 5%"
            }

            let oldRate = D3SKOffer.feeRate
            D3SKOffer.feeRate = newRate

            emit FeeRateUpdated(oldRate: oldRate, newRate: newRate)
        }

        // Update the treasury address where fees are collected
        access(Admin) fun setTreasuryAddress(newAddress: Address) {
            let oldAddress = D3SKOffer.treasuryAddress
            D3SKOffer.treasuryAddress = newAddress

            emit TreasuryAddressUpdated(
                oldAddress: oldAddress,
                newAddress: newAddress
            )
        }
    }

    // ── Expiration Handler ────────────────────────────────────────
    // A TransactionHandler resource that auto-cancels an expired offer.
    // Scheduled via FlowTransactionSchedulerUtils at offer creation time.
    access(all) resource OfferExpirationHandler: FlowTransactionScheduler.TransactionHandler {
        access(all) let offerID: UInt64
        access(all) let makerAddress: Address
        access(self) let collectionCapability: Capability<auth(D3SKOffer.Cancel) &D3SKOffer.OfferCollection>
        access(self) let receiverCapability: Capability<&{FungibleToken.Receiver}>

        init(
            offerID: UInt64,
            makerAddress: Address,
            collectionCapability: Capability<auth(D3SKOffer.Cancel) &D3SKOffer.OfferCollection>,
            receiverCapability: Capability<&{FungibleToken.Receiver}>
        ) {
            self.offerID = offerID
            self.makerAddress = makerAddress
            self.collectionCapability = collectionCapability
            self.receiverCapability = receiverCapability
        }

        access(FlowTransactionScheduler.Execute) fun executeTransaction() {
            // Borrow the maker's OfferCollection via stored capability
            let collectionRef = self.collectionCapability.borrow()
            if collectionRef == nil { return }

            // Check if the offer still exists and is expired
            let details = collectionRef!.getOfferDetails(id: self.offerID)
            if details == nil { return }
            if !details!.isActive { return }
            if !details!.isExpired { return }

            // Expire the offer and recover tokens
            let returnedVault <- collectionRef!.expireOffer(id: self.offerID)

            // Deposit returned tokens back to maker's vault via stored capability
            let receiverRef = self.receiverCapability.borrow()
                ?? panic("Cannot borrow receiver to return expired tokens to maker")
            receiverRef.deposit(from: <-returnedVault)

            // Remove from registry
            D3SKRegistry.removeOffer(id: self.offerID, reason: "expired")
        }
    }

    // ── Storage Paths ─────────────────────────────────────────────
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let AdminStoragePath: StoragePath

    // ── Public Functions ──────────────────────────────────────────
    access(all) fun createEmptyCollection(): @OfferCollection {
        return <-create OfferCollection()
    }

    // Create an expiration handler resource for scheduling
    access(all) fun createExpirationHandler(
        offerID: UInt64,
        makerAddress: Address,
        collectionCapability: Capability<auth(D3SKOffer.Cancel) &D3SKOffer.OfferCollection>,
        receiverCapability: Capability<&{FungibleToken.Receiver}>
    ): @OfferExpirationHandler {
        return <-create OfferExpirationHandler(
            offerID: offerID,
            makerAddress: makerAddress,
            collectionCapability: collectionCapability,
            receiverCapability: receiverCapability
        )
    }

    // Fee calculation helpers — callable by anyone
    access(all) fun getRequiredPayment(askAmount: UFix64): UFix64 {
        return askAmount + (askAmount * self.feeRate)
    }

    access(all) fun getFeeAmount(askAmount: UFix64): UFix64 {
        return askAmount * self.feeRate
    }

    // ── Contract Init ─────────────────────────────────────────────
    init() {
        self.nextOfferID = 1
        self.feeRate = 0.003                    // 0.3% protocol fee
        self.treasuryAddress = self.account.address  // deployer is initial treasury

        self.CollectionStoragePath = /storage/D3SKOfferCollection
        self.CollectionPublicPath = /public/D3SKOfferCollection
        self.AdminStoragePath = /storage/D3SKAdmin

        // Create and save the Administrator resource to deployer's account
        let admin <- create Administrator()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
    }
}
