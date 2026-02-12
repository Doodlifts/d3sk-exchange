import D3SKRegistry from "D3SKRegistry"

access(all) fun main(sellType: String, askType: String): [D3SKRegistry.OfferListing] {
    return D3SKRegistry.getListingsByPair(sellType: sellType, askType: askType)
}
