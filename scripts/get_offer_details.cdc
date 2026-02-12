import D3SKRegistry from "D3SKRegistry"

access(all) fun main(offerID: UInt64): D3SKRegistry.OfferListing? {
    return D3SKRegistry.getListing(id: offerID)
}
