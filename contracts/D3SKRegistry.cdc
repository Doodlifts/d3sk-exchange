// D3SKRegistry.cdc — Onchain offer index for discoverability
// Holds NO funds. Purely an index of active offers.

access(all) contract D3SKRegistry {

    // ── Events ────────────────────────────────────────────────────
    access(all) event OfferRegistered(
        id: UInt64,
        maker: Address,
        sellType: String,
        sellAmount: UFix64,
        askType: String,
        askAmount: UFix64
    )
    access(all) event OfferRemoved(id: UInt64, reason: String)

    // ── Offer Listing Struct ─────────────────────────────────────
    access(all) struct OfferListing {
        access(all) let id: UInt64
        access(all) let maker: Address
        access(all) let sellType: String
        access(all) let sellAmount: UFix64
        access(all) let askType: String
        access(all) let askAmount: UFix64
        access(all) let price: UFix64        // askAmount / sellAmount
        access(all) let createdAt: UFix64
        access(all) let expiresAt: UFix64?   // nil = no expiration

        init(
            id: UInt64,
            maker: Address,
            sellType: String,
            sellAmount: UFix64,
            askType: String,
            askAmount: UFix64,
            createdAt: UFix64,
            expiresAt: UFix64?
        ) {
            self.id = id
            self.maker = maker
            self.sellType = sellType
            self.sellAmount = sellAmount
            self.askType = askType
            self.askAmount = askAmount
            // Calculate price as ask per unit of sell
            if sellAmount > 0.0 {
                self.price = askAmount / sellAmount
            } else {
                self.price = 0.0
            }
            self.createdAt = createdAt
            self.expiresAt = expiresAt
        }
    }

    // ── State ─────────────────────────────────────────────────────
    // All active offer listings indexed by ID
    access(self) var listings: {UInt64: OfferListing}
    // Index: maker address -> set of offer IDs
    access(self) var makerOffers: {Address: [UInt64]}
    // Index: pair key (sellType-askType) -> set of offer IDs
    access(self) var pairOffers: {String: [UInt64]}
    // Track known pairs
    access(all) var knownPairs: [String]

    // ── Registration ──────────────────────────────────────────────
    access(all) fun registerOffer(
        id: UInt64,
        maker: Address,
        sellType: String,
        sellAmount: UFix64,
        askType: String,
        askAmount: UFix64,
        expiresAt: UFix64?
    ) {
        let listing = OfferListing(
            id: id,
            maker: maker,
            sellType: sellType,
            sellAmount: sellAmount,
            askType: askType,
            askAmount: askAmount,
            createdAt: getCurrentBlock().timestamp,
            expiresAt: expiresAt
        )

        self.listings[id] = listing

        // Update maker index
        if self.makerOffers[maker] == nil {
            self.makerOffers[maker] = []
        }
        self.makerOffers[maker]!.append(id)

        // Update pair index
        let pairKey = self.getPairKey(sellType: sellType, askType: askType)
        if self.pairOffers[pairKey] == nil {
            self.pairOffers[pairKey] = []
            self.knownPairs.append(pairKey)
        }
        self.pairOffers[pairKey]!.append(id)

        emit OfferRegistered(
            id: id,
            maker: maker,
            sellType: sellType,
            sellAmount: sellAmount,
            askType: askType,
            askAmount: askAmount
        )
    }

    // ── Removal ───────────────────────────────────────────────────
    access(all) fun removeOffer(id: UInt64, reason: String) {
        if let listing = self.listings[id] {
            // Remove from maker index
            if var makerList = self.makerOffers[listing.maker] {
                var i = 0
                while i < makerList.length {
                    if makerList[i] == id {
                        makerList.remove(at: i)
                        break
                    }
                    i = i + 1
                }
                self.makerOffers[listing.maker] = makerList
                if makerList.length == 0 {
                    self.makerOffers.remove(key: listing.maker)
                }
            }

            // Remove from pair index
            let pairKey = self.getPairKey(sellType: listing.sellType, askType: listing.askType)
            if var pairList = self.pairOffers[pairKey] {
                var i = 0
                while i < pairList.length {
                    if pairList[i] == id {
                        pairList.remove(at: i)
                        break
                    }
                    i = i + 1
                }
                self.pairOffers[pairKey] = pairList
                if pairList.length == 0 {
                    self.pairOffers.remove(key: pairKey)
                    // Also remove from knownPairs
                    var pairIdx = 0
                    while pairIdx < self.knownPairs.length {
                        if self.knownPairs[pairIdx] == pairKey {
                            self.knownPairs.remove(at: pairIdx)
                            break
                        }
                        pairIdx = pairIdx + 1
                    }
                }
            }

            // Remove from main listings
            self.listings.remove(key: id)

            emit OfferRemoved(id: id, reason: reason)
        }
    }

    // ── Queries ───────────────────────────────────────────────────

    // Get all active listings
    access(all) fun getAllListings(): [OfferListing] {
        return self.listings.values
    }

    // Get listing by ID
    access(all) fun getListing(id: UInt64): OfferListing? {
        return self.listings[id]
    }

    // Get all listings for a maker
    access(all) fun getListingsByMaker(maker: Address): [OfferListing] {
        let result: [OfferListing] = []
        if let ids = self.makerOffers[maker] {
            for id in ids {
                if let listing = self.listings[id] {
                    result.append(listing)
                }
            }
        }
        return result
    }

    // Get all listings for a trading pair
    access(all) fun getListingsByPair(sellType: String, askType: String): [OfferListing] {
        let result: [OfferListing] = []
        let pairKey = self.getPairKey(sellType: sellType, askType: askType)
        if let ids = self.pairOffers[pairKey] {
            for id in ids {
                if let listing = self.listings[id] {
                    result.append(listing)
                }
            }
        }
        return result
    }

    // Get all known trading pairs
    access(all) fun getPairs(): [String] {
        return self.knownPairs
    }

    // Get total number of active offers
    access(all) fun getTotalOffers(): Int {
        return self.listings.keys.length
    }

    // ── Helpers ───────────────────────────────────────────────────
    access(all) fun getPairKey(sellType: String, askType: String): String {
        return sellType.concat("-").concat(askType)
    }

    // ── Contract Init ─────────────────────────────────────────────
    init() {
        self.listings = {}
        self.makerOffers = {}
        self.pairOffers = {}
        self.knownPairs = []
    }
}
