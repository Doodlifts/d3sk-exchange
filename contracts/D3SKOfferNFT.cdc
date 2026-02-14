// D3SKOfferNFT.cdc — NFT-based zero-custody offer positions
// Each offer is minted as a transferable NFT with on-chain SVG certificate.
// Settlement is atomic. Payout goes to the current NFT holder, not the original maker.
// Supports optional expiration via Flow's native Scheduled Transactions.
// Protocol fee on fills — configurable by admin, destined for DAO governance.

import FungibleToken from "FungibleToken"
import NonFungibleToken from "NonFungibleToken"
import MetadataViews from "MetadataViews"
import ViewResolver from "ViewResolver"
import FlowTransactionScheduler from "FlowTransactionScheduler"
import D3SKRegistry from "D3SKRegistry"

access(all) contract D3SKOfferNFT: NonFungibleToken {

    // ── Entitlements ──────────────────────────────────────────────
    access(all) entitlement Fill
    access(all) entitlement Cancel
    access(all) entitlement Admin

    // ── Events ────────────────────────────────────────────────────
    access(all) event OfferMinted(
        id: UInt64,
        serialNumber: UInt64,
        maker: Address,
        sellType: String,
        sellAmount: UFix64,
        askType: String,
        askAmount: UFix64,
        expiresAt: UFix64?
    )
    access(all) event OfferFilled(
        id: UInt64,
        holder: Address,
        taker: Address,
        sellType: String,
        sellAmount: UFix64,
        askType: String,
        askAmount: UFix64,
        feeAmount: UFix64
    )
    access(all) event OfferCancelled(
        id: UInt64,
        holder: Address,
        sellType: String,
        sellAmount: UFix64
    )
    access(all) event OfferExpired(
        id: UInt64,
        holder: Address,
        sellType: String,
        sellAmount: UFix64
    )
    access(all) event FeeCollected(
        offerId: UInt64,
        tokenType: String,
        amount: UFix64
    )
    access(all) event FeeRateUpdated(oldRate: UFix64, newRate: UFix64)
    access(all) event TreasuryAddressUpdated(oldAddress: Address, newAddress: Address)

    // ── State ─────────────────────────────────────────────────────
    access(all) var totalSupply: UInt64
    access(all) var feeRate: UFix64
    access(all) var treasuryAddress: Address

    // ── Storage Paths ─────────────────────────────────────────────
    access(all) let CollectionStoragePath: StoragePath
    access(all) let CollectionPublicPath: PublicPath
    access(all) let AdminStoragePath: StoragePath

    // ── Custom Metadata: Certificate SVG ──────────────────────────
    access(all) struct CertificateSVG {
        access(all) let svg: String
        init(svg: String) {
            self.svg = svg
        }
    }

    // ── Offer Details Struct ──────────────────────────────────────
    access(all) struct OfferDetails {
        access(all) let id: UInt64
        access(all) let serialNumber: UInt64
        access(all) let maker: Address
        access(all) let sellType: String
        access(all) let sellAmount: UFix64
        access(all) let askType: String
        access(all) let askAmount: UFix64
        access(all) let createdAt: UFix64
        access(all) let expiresAt: UFix64?
        access(all) let status: UInt8
        access(all) let isActive: Bool
        access(all) let isExpired: Bool

        init(
            id: UInt64, serialNumber: UInt64, maker: Address,
            sellType: String, sellAmount: UFix64,
            askType: String, askAmount: UFix64,
            createdAt: UFix64, expiresAt: UFix64?,
            status: UInt8, isActive: Bool, isExpired: Bool
        ) {
            self.id = id
            self.serialNumber = serialNumber
            self.maker = maker
            self.sellType = sellType
            self.sellAmount = sellAmount
            self.askType = askType
            self.askAmount = askAmount
            self.createdAt = createdAt
            self.expiresAt = expiresAt
            self.status = status
            self.isActive = isActive
            self.isExpired = isExpired
        }
    }

    // ── Helper: Extract token name from type identifier ───────────
    // e.g. "A.1654653399040a61.FlowToken.Vault" → "FlowToken"
    access(all) view fun extractTokenName(typeId: String): String {
        let parts = typeId.split(separator: ".")
        // Type identifiers: A.{addr}.{ContractName}.Vault → parts[2] is the contract name
        if parts.length >= 3 {
            return parts[2]
        }
        return typeId
    }

    // ── Numeric → String helpers (view-safe, from StreamVest patterns) ──

    /// Convert a UFix64 to an integer string (truncates decimals).
    access(all) view fun ufix64ToIntString(_ value: UFix64): String {
        let str = value.toString()
        let parts = str.split(separator: ".")
        if parts.length > 0 {
            return parts[0]
        }
        return "0"
    }

    /// Convert a UFix64 to a decimal string with up to `places` decimals.
    access(all) view fun ufix64ToDecimalString(_ value: UFix64, _ places: Int): String {
        let str = value.toString()
        let parts = str.split(separator: ".")
        var intPart = "0"
        var decPart = ""

        if parts.length > 0 {
            intPart = parts[0]
        }
        if parts.length > 1 {
            decPart = parts[1]
        }

        if decPart.length > places {
            decPart = decPart.slice(from: 0, upTo: places)
        } else {
            while decPart.length < places {
                decPart = decPart.concat("0")
            }
        }

        if places == 0 {
            return intPart
        }
        return intPart.concat(".").concat(decPart)
    }

    // ══════════════════════════════════════════════════════════════
    //  NFT RESOURCE
    // ══════════════════════════════════════════════════════════════
    access(all) resource NFT: NonFungibleToken.NFT {
        access(all) let id: UInt64
        access(all) let serialNumber: UInt64
        access(all) let maker: Address
        access(all) let sellTokenType: Type
        access(all) let sellTokenName: String
        access(all) let askTokenType: Type
        access(all) let askTokenName: String
        access(all) let askAmount: UFix64
        access(all) let createdAt: UFix64
        access(all) let expiresAt: UFix64?

        // Mutable — updated by Collection methods (same contract)
        access(contract) var status: UInt8   // 0=active, 1=filled, 2=cancelled, 3=expired
        access(contract) var sellVault: @{FungibleToken.Vault}?

        init(
            id: UInt64,
            serialNumber: UInt64,
            maker: Address,
            sellVault: @{FungibleToken.Vault},
            askTokenType: Type,
            askAmount: UFix64,
            expiresAt: UFix64?
        ) {
            self.id = id
            self.serialNumber = serialNumber
            self.maker = maker
            self.sellTokenType = sellVault.getType()
            self.sellTokenName = D3SKOfferNFT.extractTokenName(typeId: sellVault.getType().identifier)
            self.askTokenType = askTokenType
            self.askTokenName = D3SKOfferNFT.extractTokenName(typeId: askTokenType.identifier)
            self.askAmount = askAmount
            self.createdAt = getCurrentBlock().timestamp
            self.expiresAt = expiresAt
            self.status = 0
            self.sellVault <- sellVault
        }

        // ── Fill (contract-internal, called by Collection) ────────
        access(contract) fun fill(
            payment: @{FungibleToken.Vault},
            holderAddress: Address,
            takerAddress: Address,
            askReceiverPath: PublicPath,
            askStoragePath: StoragePath
        ): @{FungibleToken.Vault} {
            pre {
                self.status == 0: "Offer is not active"
                self.sellVault != nil: "Offer already consumed"
                payment.getType() == self.askTokenType: "Payment token type mismatch"
                self.expiresAt == nil || getCurrentBlock().timestamp <= self.expiresAt!: "Offer has expired"
            }

            let feeAmount = self.askAmount * D3SKOfferNFT.feeRate
            let totalRequired = self.askAmount + feeAmount
            assert(
                payment.balance >= totalRequired,
                message: "Payment must cover ask + fee (".concat(totalRequired.toString()).concat(" required)")
            )

            let sellAmount = self.sellVault?.balance ?? 0.0
            let sellTokens <- self.sellVault <- nil

            // ── Pay the HOLDER (not maker) ──
            let holderPayment <- payment.withdraw(amount: self.askAmount)
            let holderAccount = getAccount(holderAddress)
            let receiverRef = holderAccount.capabilities.borrow<&{FungibleToken.Receiver}>(
                askReceiverPath
            ) ?? panic("Could not borrow holder's receiver for ask token")
            receiverRef.deposit(from: <-holderPayment)

            // ── Fee to treasury (auto-initializes vault if needed) ──
            let actualFee = payment.balance
            if actualFee > 0.0 {
                // Auto-initialize treasury vault for this token if it doesn't exist yet.
                // This works because the contract lives on the treasury account and has
                // self.account access to its own storage.
                if D3SKOfferNFT.account.storage.borrow<&{FungibleToken.Receiver}>(from: askStoragePath) == nil {
                    let emptyVault <- payment.createEmptyVault()
                    D3SKOfferNFT.account.storage.save(<-emptyVault, to: askStoragePath)
                    let cap = D3SKOfferNFT.account.capabilities.storage.issue<&{FungibleToken.Receiver}>(askStoragePath)
                    D3SKOfferNFT.account.capabilities.publish(cap, at: askReceiverPath)
                }

                let treasuryReceiver = getAccount(D3SKOfferNFT.treasuryAddress)
                    .capabilities.borrow<&{FungibleToken.Receiver}>(askReceiverPath)
                    ?? panic("Could not borrow treasury receiver")

                emit FeeCollected(offerId: self.id, tokenType: self.askTokenType.identifier, amount: actualFee)
                treasuryReceiver.deposit(from: <-payment)
            } else {
                destroy payment
            }

            self.status = 1  // filled

            emit OfferFilled(
                id: self.id, holder: holderAddress, taker: takerAddress,
                sellType: self.sellTokenType.identifier, sellAmount: sellAmount,
                askType: self.askTokenType.identifier, askAmount: self.askAmount,
                feeAmount: actualFee
            )
            D3SKRegistry.removeOffer(id: self.id, reason: "filled")

            return <-sellTokens!
        }

        // ── Cancel (contract-internal, called by Collection) ──────
        access(contract) fun cancel(): @{FungibleToken.Vault} {
            pre {
                self.status == 0: "Offer is not active"
                self.sellVault != nil: "Offer already consumed"
            }
            let sellAmount = self.sellVault?.balance!
            let vault <- self.sellVault <- nil
            self.status = 2  // cancelled

            emit OfferCancelled(
                id: self.id, holder: self.maker,
                sellType: self.sellTokenType.identifier, sellAmount: sellAmount
            )
            D3SKRegistry.removeOffer(id: self.id, reason: "cancelled")
            return <-vault!
        }

        // ── Expire (contract-internal, called by Collection) ──────
        access(contract) fun expire(): @{FungibleToken.Vault} {
            pre {
                self.status == 0: "Offer is not active"
                self.sellVault != nil: "Offer already consumed"
                self.expiresAt != nil: "Offer has no expiration"
                getCurrentBlock().timestamp >= self.expiresAt!: "Not expired yet"
            }
            let sellAmount = self.sellVault?.balance!
            let vault <- self.sellVault <- nil
            self.status = 3  // expired

            emit OfferExpired(
                id: self.id, holder: self.maker,
                sellType: self.sellTokenType.identifier, sellAmount: sellAmount
            )
            D3SKRegistry.removeOffer(id: self.id, reason: "expired")
            return <-vault!
        }

        // ── Getters ───────────────────────────────────────────────
        access(all) view fun getSellAmount(): UFix64 {
            return self.sellVault?.balance ?? 0.0
        }

        access(all) view fun isActive(): Bool {
            return self.status == 0 && self.sellVault != nil
        }

        access(all) view fun isExpiredCheck(): Bool {
            if self.expiresAt == nil { return false }
            return getCurrentBlock().timestamp >= self.expiresAt!
        }

        access(all) fun getDetails(): OfferDetails {
            return OfferDetails(
                id: self.id, serialNumber: self.serialNumber, maker: self.maker,
                sellType: self.sellTokenType.identifier,
                sellAmount: self.getSellAmount(),
                askType: self.askTokenType.identifier,
                askAmount: self.askAmount,
                createdAt: self.createdAt, expiresAt: self.expiresAt,
                status: self.status,
                isActive: self.isActive(),
                isExpired: self.isExpiredCheck()
            )
        }

        // ── MetadataViews ─────────────────────────────────────────
        access(all) view fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Serial>(),
                Type<MetadataViews.Traits>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>(),
                Type<D3SKOfferNFT.CertificateSVG>()
            ]
        }

        access(all) fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    // Generate SVG and embed as data URI (proven pattern from StreamVest)
                    let svg = self.generateCertificateSVG()
                    let dataURI = "data:image/svg+xml;utf8,".concat(svg)
                    var statusText = "ACTIVE"
                    if self.status == 1 { statusText = "FILLED" }
                    else if self.status == 2 { statusText = "CANCELLED" }
                    else if self.status == 3 { statusText = "EXPIRED" }
                    return MetadataViews.Display(
                        name: "D3SK Offer #".concat(self.serialNumber.toString()),
                        description: self.sellTokenName.concat(" -> ").concat(self.askTokenName)
                            .concat(" | ").concat(D3SKOfferNFT.ufix64ToDecimalString(self.askAmount, 4))
                            .concat(" ").concat(self.askTokenName)
                            .concat(" | ").concat(statusText),
                        thumbnail: MetadataViews.HTTPFile(url: dataURI)
                    )
                case Type<MetadataViews.Serial>():
                    return MetadataViews.Serial(self.serialNumber)
                case Type<MetadataViews.Traits>():
                    let traits: [MetadataViews.Trait] = [
                        MetadataViews.Trait(name: "sellToken", value: self.sellTokenName, displayType: nil, rarity: nil),
                        MetadataViews.Trait(name: "askToken", value: self.askTokenName, displayType: nil, rarity: nil),
                        MetadataViews.Trait(name: "sellAmount", value: self.getSellAmount(), displayType: nil, rarity: nil),
                        MetadataViews.Trait(name: "askAmount", value: self.askAmount, displayType: nil, rarity: nil),
                        MetadataViews.Trait(name: "status", value: self.status, displayType: nil, rarity: nil),
                        MetadataViews.Trait(name: "maker", value: self.maker, displayType: nil, rarity: nil)
                    ]
                    return MetadataViews.Traits(traits)
                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL("https://d3sk.exchange")
                case Type<MetadataViews.NFTCollectionData>():
                    return D3SKOfferNFT.resolveContractView(
                        resourceType: Type<@D3SKOfferNFT.NFT>(),
                        viewType: Type<MetadataViews.NFTCollectionData>()
                    )
                case Type<MetadataViews.NFTCollectionDisplay>():
                    return D3SKOfferNFT.resolveContractView(
                        resourceType: Type<@D3SKOfferNFT.NFT>(),
                        viewType: Type<MetadataViews.NFTCollectionDisplay>()
                    )
                case Type<D3SKOfferNFT.CertificateSVG>():
                    return D3SKOfferNFT.CertificateSVG(svg: self.generateCertificateSVG())
            }
            return nil
        }

        // ── On-Chain SVG Certificate Generation ───────────────────
        // Generates a fully on-chain 8-bit stock certificate SVG.
        // Uses rgb() colors (no # chars) for safe data URI embedding.
        // Number formatting via contract-level helpers (StreamVest pattern).
        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- D3SKOfferNFT.createEmptyCollection(nftType: Type<@D3SKOfferNFT.NFT>())
        }

        access(all) view fun generateCertificateSVG(): String {
            let sellAmount = self.getSellAmount()

            // Status display
            var statusText = "ACTIVE"
            var statusFill = "rgb(0,40,0)"
            var statusStroke = "rgb(0,255,65)"
            if self.status == 1 {
                statusText = "FILLED"
                statusFill = "rgb(40,35,0)"
                statusStroke = "rgb(255,215,0)"
            } else if self.status == 2 {
                statusText = "CANCELLED"
                statusFill = "rgb(40,0,0)"
                statusStroke = "rgb(255,0,85)"
            } else if self.status == 3 {
                statusText = "EXPIRED"
                statusFill = "rgb(30,30,30)"
                statusStroke = "rgb(128,128,128)"
            }

            // Price ratio (formatted with 4 decimals)
            var priceDisplay = "N/A"
            if sellAmount > 0.0 {
                priceDisplay = D3SKOfferNFT.ufix64ToDecimalString(self.askAmount / sellAmount, 4)
            }

            // Formatted amounts (clean, no trailing zeros spam)
            let sellAmountStr = D3SKOfferNFT.ufix64ToDecimalString(sellAmount, 4)
            let askAmountStr = D3SKOfferNFT.ufix64ToDecimalString(self.askAmount, 4)

            // Truncated maker address
            let addr = self.maker.toString()
            var addrShort = addr
            if addr.length > 10 {
                addrShort = addr.slice(from: 0, upTo: 6).concat("..").concat(
                    addr.slice(from: addr.length - 4, upTo: addr.length)
                )
            }

            // Formatted timestamps
            let createdStr = D3SKOfferNFT.ufix64ToIntString(self.createdAt)

            // ── Build SVG ──
            var s = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 560' shape-rendering='crispEdges'>"

            // Background
            s = s.concat("<rect width='400' height='560' fill='rgb(15,14,23)'/>")

            // Outer border (gold)
            s = s.concat("<rect x='8' y='8' width='384' height='544' fill='none' stroke='rgb(255,215,0)' stroke-width='4'/>")

            // Inner border (muted)
            s = s.concat("<rect x='16' y='16' width='368' height='528' fill='none' stroke='rgb(61,61,92)' stroke-width='2'/>")

            // Corner decorations
            s = s.concat("<rect x='10' y='10' width='8' height='8' fill='rgb(255,215,0)'/>")
            s = s.concat("<rect x='382' y='10' width='8' height='8' fill='rgb(255,215,0)'/>")
            s = s.concat("<rect x='10' y='542' width='8' height='8' fill='rgb(255,215,0)'/>")
            s = s.concat("<rect x='382' y='542' width='8' height='8' fill='rgb(255,215,0)'/>")

            // Header: D3SK EXCHANGE
            s = s.concat("<text x='200' y='56' font-family='monospace' font-size='20' font-weight='bold' fill='rgb(255,215,0)' text-anchor='middle'>D3SK EXCHANGE</text>")

            // Decorative lines
            s = s.concat("<rect x='40' y='68' width='320' height='2' fill='rgb(255,215,0)'/>")
            s = s.concat("<rect x='40' y='72' width='320' height='1' fill='rgb(61,61,92)'/>")

            // OFFER CERTIFICATE #serial
            s = s.concat("<text x='200' y='100' font-family='monospace' font-size='12' fill='rgb(0,229,255)' text-anchor='middle'>OFFER CERTIFICATE</text>")
            s = s.concat("<text x='200' y='124' font-family='monospace' font-size='22' font-weight='bold' fill='rgb(255,215,0)' text-anchor='middle'>")
            s = s.concat("#").concat(self.serialNumber.toString())
            s = s.concat("</text>")

            // Divider
            s = s.concat("<rect x='60' y='140' width='280' height='1' fill='rgb(61,61,92)'/>")

            // Token pair: SELL -> ASK
            s = s.concat("<text x='200' y='174' font-family='monospace' font-size='18' font-weight='bold' fill='rgb(0,255,65)' text-anchor='middle'>")
            s = s.concat(self.sellTokenName)
            s = s.concat("</text>")
            s = s.concat("<text x='200' y='198' font-family='monospace' font-size='14' fill='rgb(0,229,255)' text-anchor='middle'>")
            s = s.concat("---&gt; ").concat(self.askTokenName)
            s = s.concat("</text>")

            // Selling amount (formatted)
            s = s.concat("<text x='40' y='240' font-family='monospace' font-size='11' fill='rgb(128,128,128)'>SELLING</text>")
            s = s.concat("<text x='40' y='260' font-family='monospace' font-size='16' fill='rgb(0,255,65)'>")
            s = s.concat(sellAmountStr).concat(" ").concat(self.sellTokenName)
            s = s.concat("</text>")

            // Asking amount (formatted)
            s = s.concat("<text x='40' y='296' font-family='monospace' font-size='11' fill='rgb(128,128,128)'>ASKING</text>")
            s = s.concat("<text x='40' y='316' font-family='monospace' font-size='16' fill='rgb(0,229,255)'>")
            s = s.concat(askAmountStr).concat(" ").concat(self.askTokenName)
            s = s.concat("</text>")

            // Price ratio (formatted)
            s = s.concat("<text x='40' y='352' font-family='monospace' font-size='11' fill='rgb(128,128,128)'>PRICE</text>")
            s = s.concat("<text x='40' y='372' font-family='monospace' font-size='14' fill='rgb(255,215,0)'>")
            s = s.concat(priceDisplay).concat(" ").concat(self.askTokenName).concat("/").concat(self.sellTokenName)
            s = s.concat("</text>")

            // Divider
            s = s.concat("<rect x='60' y='390' width='280' height='1' fill='rgb(61,61,92)'/>")

            // Status badge
            s = s.concat("<rect x='140' y='406' width='120' height='32' rx='2' fill='").concat(statusFill).concat("' stroke='").concat(statusStroke).concat("' stroke-width='2'/>")
            s = s.concat("<text x='200' y='427' font-family='monospace' font-size='14' font-weight='bold' fill='").concat(statusStroke).concat("' text-anchor='middle'>")
            s = s.concat(statusText)
            s = s.concat("</text>")

            // Dates (integer timestamps, no decimal noise)
            s = s.concat("<text x='40' y='468' font-family='monospace' font-size='10' fill='rgb(128,128,128)'>CREATED: ").concat(createdStr).concat("</text>")
            if self.expiresAt != nil {
                s = s.concat("<text x='40' y='484' font-family='monospace' font-size='10' fill='rgb(128,128,128)'>EXPIRES: ").concat(D3SKOfferNFT.ufix64ToIntString(self.expiresAt!)).concat("</text>")
            } else {
                s = s.concat("<text x='40' y='484' font-family='monospace' font-size='10' fill='rgb(128,128,128)'>EXPIRES: NEVER</text>")
            }

            // Maker address
            s = s.concat("<text x='40' y='508' font-family='monospace' font-size='10' fill='rgb(128,128,128)'>MAKER: ").concat(addrShort).concat("</text>")

            // Decorative seal (bottom-right pixel rosette)
            s = s.concat("<rect x='320' y='480' width='40' height='40' rx='20' fill='none' stroke='rgb(255,215,0)' stroke-width='2'/>")
            s = s.concat("<text x='340' y='505' font-family='monospace' font-size='10' font-weight='bold' fill='rgb(255,215,0)' text-anchor='middle'>D3SK</text>")

            // Pixel noise decoration (top corners)
            s = s.concat("<rect x='28' y='28' width='4' height='4' fill='rgb(0,255,65)' opacity='0.3'/>")
            s = s.concat("<rect x='36' y='32' width='4' height='4' fill='rgb(0,229,255)' opacity='0.2'/>")
            s = s.concat("<rect x='364' y='28' width='4' height='4' fill='rgb(255,0,85)' opacity='0.3'/>")
            s = s.concat("<rect x='356' y='32' width='4' height='4' fill='rgb(255,215,0)' opacity='0.2'/>")

            s = s.concat("</svg>")
            return s
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  OFFER COLLECTION PUBLIC INTERFACE
    // ══════════════════════════════════════════════════════════════
    access(all) resource interface OfferCollectionPublic {
        access(all) fun getOfferIDs(): [UInt64]
        access(all) fun getOfferDetails(id: UInt64): OfferDetails?
        access(Fill) fun fillOffer(
            id: UInt64,
            payment: @{FungibleToken.Vault},
            holderAddress: Address,
            takerAddress: Address,
            askReceiverPath: PublicPath
        ): @{FungibleToken.Vault}
    }

    // ══════════════════════════════════════════════════════════════
    //  COLLECTION RESOURCE
    // ══════════════════════════════════════════════════════════════
    access(all) resource Collection: NonFungibleToken.Collection, OfferCollectionPublic {
        access(all) var ownedNFTs: @{UInt64: {NonFungibleToken.NFT}}

        init() {
            self.ownedNFTs <- {}
        }

        // ── Standard NFT Collection Methods ───────────────────────

        access(all) view fun getSupportedNFTTypes(): {Type: Bool} {
            return { Type<@D3SKOfferNFT.NFT>(): true }
        }

        access(all) view fun isSupportedNFTType(type: Type): Bool {
            return type == Type<@D3SKOfferNFT.NFT>()
        }

        access(NonFungibleToken.Withdraw) fun withdraw(withdrawID: UInt64): @{NonFungibleToken.NFT} {
            let nft <- self.ownedNFTs.remove(key: withdrawID)
                ?? panic("NFT not found in collection")
            return <-nft
        }

        access(all) fun deposit(token: @{NonFungibleToken.NFT}) {
            let nft <- token as! @D3SKOfferNFT.NFT
            let id = nft.id
            let oldNFT <- self.ownedNFTs[id] <- nft
            destroy oldNFT
        }

        access(all) view fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        access(all) view fun getLength(): Int {
            return self.ownedNFTs.length
        }

        access(all) view fun borrowNFT(_ id: UInt64): &{NonFungibleToken.NFT}? {
            return &self.ownedNFTs[id]
        }

        access(all) fun createEmptyCollection(): @{NonFungibleToken.Collection} {
            return <- D3SKOfferNFT.createEmptyCollection(nftType: Type<@D3SKOfferNFT.NFT>())
        }

        // ── Custom: Borrow typed reference ────────────────────────
        access(all) fun borrowD3SKOfferNFT(id: UInt64): &D3SKOfferNFT.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = (&self.ownedNFTs[id] as &{NonFungibleToken.NFT}?)!
                return ref as! &D3SKOfferNFT.NFT
            }
            return nil
        }

        // ── Offer-specific: Get IDs (alias for getIDs) ───────────
        access(all) fun getOfferIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        // ── Offer-specific: Get details ───────────────────────────
        access(all) fun getOfferDetails(id: UInt64): OfferDetails? {
            if let nftRef = self.borrowD3SKOfferNFT(id: id) {
                return nftRef.getDetails()
            }
            return nil
        }

        // ── Fill an offer (requires Fill entitlement) ──
        // Payment always routes to offer maker (prevents redirect attacks)
        access(Fill) fun fillOffer(
            id: UInt64,
            payment: @{FungibleToken.Vault},
            holderAddress: Address,
            takerAddress: Address,
            askReceiverPath: PublicPath,
            askStoragePath: StoragePath
        ): @{FungibleToken.Vault} {
            // Remove NFT to get ownership (needed to call contract-internal methods)
            let nft <- self.ownedNFTs.remove(key: id)
                ?? panic("Offer not found")
            let offerNFT <- nft as! @D3SKOfferNFT.NFT

            // V1 security: enforce payment goes to the offer maker, not arbitrary address
            assert(holderAddress == offerNFT.maker, message: "Payment must route to offer maker")

            // Execute fill — pays the holder, returns sell tokens to taker
            let sellTokens <- offerNFT.fill(
                payment: <-payment,
                holderAddress: offerNFT.maker,
                takerAddress: takerAddress,
                askReceiverPath: askReceiverPath,
                askStoragePath: askStoragePath
            )

            // Put NFT back (now status=filled, sellVault=nil, acts as receipt)
            let old <- self.ownedNFTs[offerNFT.id] <- offerNFT
            destroy old

            return <-sellTokens
        }

        // ── Public fill wrapper (no entitlement needed) ──────────────
        // Callable via non-auth &Collection capability.
        // Delegates to access(Fill) fillOffer via self (which has all entitlements).
        access(all) fun fillOfferPublic(
            id: UInt64,
            payment: @{FungibleToken.Vault},
            holderAddress: Address,
            takerAddress: Address,
            askReceiverPath: PublicPath,
            askStoragePath: StoragePath
        ): @{FungibleToken.Vault} {
            return <-self.fillOffer(
                id: id,
                payment: <-payment,
                holderAddress: holderAddress,
                takerAddress: takerAddress,
                askReceiverPath: askReceiverPath,
                askStoragePath: askStoragePath
            )
        }

        // ── Cancel an offer (holder only via Cancel entitlement) ──
        access(Cancel) fun cancelOffer(id: UInt64): @{FungibleToken.Vault} {
            let nft <- self.ownedNFTs.remove(key: id)
                ?? panic("Offer not found")
            let offerNFT <- nft as! @D3SKOfferNFT.NFT

            let vault <- offerNFT.cancel()

            // Put NFT back as cancelled receipt
            let old <- self.ownedNFTs[offerNFT.id] <- offerNFT
            destroy old

            return <-vault
        }

        // ── Expire an offer (for scheduled handler) ───────────────
        access(Cancel) fun expireOffer(id: UInt64): @{FungibleToken.Vault} {
            let nft <- self.ownedNFTs.remove(key: id)
                ?? panic("Offer not found")
            let offerNFT <- nft as! @D3SKOfferNFT.NFT

            let vault <- offerNFT.expire()

            // Put NFT back as expired receipt
            let old <- self.ownedNFTs[offerNFT.id] <- offerNFT
            destroy old

            return <-vault
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  ADMINISTRATOR
    // ══════════════════════════════════════════════════════════════
    access(all) resource Administrator {
        access(Admin) fun setFeeRate(newRate: UFix64) {
            pre { newRate <= 0.05: "Fee rate cannot exceed 5%" }
            let oldRate = D3SKOfferNFT.feeRate
            D3SKOfferNFT.feeRate = newRate
            emit FeeRateUpdated(oldRate: oldRate, newRate: newRate)
        }

        access(Admin) fun setTreasuryAddress(newAddress: Address) {
            let oldAddress = D3SKOfferNFT.treasuryAddress
            D3SKOfferNFT.treasuryAddress = newAddress
            emit TreasuryAddressUpdated(oldAddress: oldAddress, newAddress: newAddress)
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  EXPIRATION HANDLER
    // ══════════════════════════════════════════════════════════════
    access(all) resource OfferExpirationHandler: FlowTransactionScheduler.TransactionHandler {
        access(all) let offerID: UInt64
        access(all) let holderAddress: Address
        access(self) let collectionCapability: Capability<auth(D3SKOfferNFT.Cancel) &D3SKOfferNFT.Collection>
        access(self) let receiverCapability: Capability<&{FungibleToken.Receiver}>

        init(
            offerID: UInt64,
            holderAddress: Address,
            collectionCapability: Capability<auth(D3SKOfferNFT.Cancel) &D3SKOfferNFT.Collection>,
            receiverCapability: Capability<&{FungibleToken.Receiver}>
        ) {
            self.offerID = offerID
            self.holderAddress = holderAddress
            self.collectionCapability = collectionCapability
            self.receiverCapability = receiverCapability
        }

        access(FlowTransactionScheduler.Execute) fun executeTransaction(id: UInt64, data: AnyStruct?) {
            let collectionRef = self.collectionCapability.borrow()
            if collectionRef == nil { return }

            let details = collectionRef!.getOfferDetails(id: self.offerID)
            if details == nil { return }
            if !details!.isActive { return }
            if !details!.isExpired { return }

            let returnedVault <- collectionRef!.expireOffer(id: self.offerID)

            let receiverRef = self.receiverCapability.borrow()
                ?? panic("Cannot borrow receiver to return expired tokens")
            receiverRef.deposit(from: <-returnedVault)
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  CONTRACT-LEVEL FUNCTIONS
    // ══════════════════════════════════════════════════════════════

    // Mint a new offer NFT
    access(all) fun mintOffer(
        sellVault: @{FungibleToken.Vault},
        askTokenType: Type,
        askAmount: UFix64,
        makerAddress: Address,
        expiresAt: UFix64?
    ): @NFT {
        pre {
            sellVault.balance > 0.0: "Sell amount must be positive"
            askAmount > 0.0: "Ask amount must be positive"
            expiresAt == nil || expiresAt! > getCurrentBlock().timestamp: "Expiration must be in the future"
        }

        let id = self.totalSupply
        self.totalSupply = self.totalSupply + 1

        let sellType = sellVault.getType().identifier
        let sellAmount = sellVault.balance

        let nft <- create NFT(
            id: id,
            serialNumber: id,
            maker: makerAddress,
            sellVault: <-sellVault,
            askTokenType: askTokenType,
            askAmount: askAmount,
            expiresAt: expiresAt
        )

        // Register in the discovery index
        D3SKRegistry.registerOffer(
            id: id,
            maker: makerAddress,
            sellType: sellType,
            sellAmount: sellAmount,
            askType: askTokenType.identifier,
            askAmount: askAmount,
            expiresAt: expiresAt
        )

        emit OfferMinted(
            id: id, serialNumber: id, maker: makerAddress,
            sellType: sellType, sellAmount: sellAmount,
            askType: askTokenType.identifier, askAmount: askAmount,
            expiresAt: expiresAt
        )

        return <-nft
    }

    // Create empty collection (required by NonFungibleToken)
    access(all) fun createEmptyCollection(nftType: Type): @{NonFungibleToken.Collection} {
        return <- create Collection()
    }

    // Create expiration handler for scheduling
    access(all) fun createExpirationHandler(
        offerID: UInt64,
        holderAddress: Address,
        collectionCapability: Capability<auth(D3SKOfferNFT.Cancel) &D3SKOfferNFT.Collection>,
        receiverCapability: Capability<&{FungibleToken.Receiver}>
    ): @OfferExpirationHandler {
        return <-create OfferExpirationHandler(
            offerID: offerID,
            holderAddress: holderAddress,
            collectionCapability: collectionCapability,
            receiverCapability: receiverCapability
        )
    }

    // Fee helpers
    access(all) fun getRequiredPayment(askAmount: UFix64): UFix64 {
        return askAmount + (askAmount * self.feeRate)
    }

    access(all) fun getFeeAmount(askAmount: UFix64): UFix64 {
        return askAmount * self.feeRate
    }

    // Contract-level views (required by NonFungibleToken / ViewResolver)
    access(all) view fun getContractViews(resourceType: Type?): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        ]
    }

    access(all) fun resolveContractView(resourceType: Type?, viewType: Type): AnyStruct? {
        switch viewType {
            case Type<MetadataViews.NFTCollectionData>():
                return MetadataViews.NFTCollectionData(
                    storagePath: self.CollectionStoragePath,
                    publicPath: self.CollectionPublicPath,
                    publicCollection: Type<&D3SKOfferNFT.Collection>(),
                    publicLinkedType: Type<&D3SKOfferNFT.Collection>(),
                    createEmptyCollectionFunction: fun(): @{NonFungibleToken.Collection} {
                        return <- D3SKOfferNFT.createEmptyCollection(nftType: Type<@D3SKOfferNFT.NFT>())
                    }
                )
            case Type<MetadataViews.NFTCollectionDisplay>():
                return MetadataViews.NFTCollectionDisplay(
                    name: "D3SK Offer Positions",
                    description: "Zero-custody P2P limit order NFTs with fully on-chain SVG certificates. Trade any token pair on Flow.",
                    externalURL: MetadataViews.ExternalURL("https://d3sk.exchange"),
                    squareImage: MetadataViews.Media(
                        file: MetadataViews.HTTPFile(url: "https://d3sk.exchange/d3sk-square.png"),
                        mediaType: "image/png"
                    ),
                    bannerImage: MetadataViews.Media(
                        file: MetadataViews.HTTPFile(url: "https://d3sk.exchange/d3sk-banner.png"),
                        mediaType: "image/png"
                    ),
                    socials: {}
                )
        }
        return nil
    }

    // ── Contract Init ─────────────────────────────────────────────
    init() {
        self.totalSupply = 0
        self.feeRate = 0.003                    // 0.3% protocol fee
        self.treasuryAddress = self.account.address

        self.CollectionStoragePath = /storage/D3SKOfferCollection
        self.CollectionPublicPath = /public/D3SKOfferCollection
        self.AdminStoragePath = /storage/D3SKAdmin

        let admin <- create Administrator()
        self.account.storage.save(<-admin, to: self.AdminStoragePath)
    }
}
