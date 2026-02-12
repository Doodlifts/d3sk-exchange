import D3SKRegistry from "D3SKRegistry"

access(all) fun main(maker: Address): [D3SKRegistry.OfferListing] {
    return D3SKRegistry.getListingsByMaker(maker: maker)
}
