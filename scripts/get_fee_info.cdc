import D3SKOffer from "D3SKOffer"

/// Script: Get protocol fee information
/// Returns the current fee rate and treasury address
///
/// Returns: {UFix64, Address, UFix64}
///   - feeRate: current fee rate (e.g. 0.003)
///   - treasuryAddress: where fees go
///   - feeRatePercent: human-readable percentage (e.g. 0.3)
access(all) fun main(): {String: AnyStruct} {
    return {
        "feeRate": D3SKOffer.feeRate,
        "treasuryAddress": D3SKOffer.treasuryAddress,
        "feeRatePercent": D3SKOffer.feeRate * 100.0
    }
}
