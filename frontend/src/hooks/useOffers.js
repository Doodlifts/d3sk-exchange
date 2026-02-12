import { useState, useEffect, useCallback, useRef } from 'react'
import { fcl, config } from '../config/fcl'

const POLL_INTERVAL = 15000 // 15 seconds

export function useOffers() {
  const [offers, setOffers] = useState([])
  const [pairs, setPairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isFirstLoad = useRef(true)

  // Extract unique trading pairs from offers
  const updatePairs = useCallback((offersList) => {
    const uniquePairs = new Set()
    offersList.forEach((offer) => {
      const pair = `${offer.sell_type}/${offer.ask_type}`
      uniquePairs.add(pair)
    })
    setPairs(Array.from(uniquePairs).sort())
  }, [])

  // Fetch offers directly from blockchain via FCL scripts
  const fetchOffers = useCallback(async () => {
    try {
      if (isFirstLoad.current) {
        setLoading(true)
      }
      setError(null)

      const result = await fcl.query({
        cadence: `
          import D3SKRegistry from ${config.d3skRegistry}

          access(all) fun main(): [D3SKRegistry.OfferListing] {
            return D3SKRegistry.getAllListings()
          }
        `,
      })

      // Transform on-chain data to match display format
      const transformedOffers = (result || []).map((offer) => ({
        id: offer.id.toString(),
        maker: offer.maker,
        sell_type: offer.sellType,
        sell_amount: offer.sellAmount,
        ask_type: offer.askType,
        ask_amount: offer.askAmount,
        price: parseFloat(offer.sellAmount) > 0
          ? parseFloat((parseFloat(offer.askAmount) / parseFloat(offer.sellAmount)).toFixed(8))
          : 0,
        status: 'active',
        expires_at: offer.expiresAt,
        created_at: new Date().toISOString(),
      }))

      setOffers(transformedOffers)
      updatePairs(transformedOffers)
    } catch (err) {
      console.error('Error fetching offers:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      isFirstLoad.current = false
    }
  }, [updatePairs])

  // Get offers for a specific trading pair
  const getOffersByPair = useCallback((pair) => {
    const [sellType, askType] = pair.split('/')
    return offers.filter(
      (offer) => offer.sell_type === sellType && offer.ask_type === askType
    )
  }, [offers])

  // Get offers created by a specific maker
  const getOffersByMaker = useCallback((maker) => {
    return offers.filter((offer) => offer.maker === maker)
  }, [offers])

  // Set up polling
  useEffect(() => {
    fetchOffers()
    const pollInterval = setInterval(fetchOffers, POLL_INTERVAL)
    return () => clearInterval(pollInterval)
  }, [fetchOffers])

  return {
    offers,
    loading,
    error,
    fetchOffers,
    pairs,
    getOffersByPair,
    getOffersByMaker,
  }
}
