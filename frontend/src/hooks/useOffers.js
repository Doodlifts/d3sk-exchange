import { useState, useEffect, useCallback, useRef } from 'react'
import { fcl, config } from '../config/fcl'

const API_URL = 'http://localhost:3001/api'
const POLL_INTERVAL = 10000 // 10 seconds

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

  // Fetch offers from backend API
  const fetchOffers = useCallback(async () => {
    try {
      if (isFirstLoad.current) {
        setLoading(true)
      }
      setError(null)
      const response = await fetch(`${API_URL}/offers`)

      if (!response.ok) {
        throw new Error(`Failed to fetch offers: ${response.statusText}`)
      }

      const data = await response.json()
      setOffers(data)
      updatePairs(data)
    } catch (err) {
      console.error('Error fetching offers:', err)
      setError(err.message)
      // Fallback to on-chain query
      await fetchOffersOnChain()
    } finally {
      setLoading(false)
      isFirstLoad.current = false
    }
  }, [updatePairs])

  // Fallback: fetch offers from blockchain via FCL scripts
  const fetchOffersOnChain = useCallback(async () => {
    try {
      const result = await fcl.query({
        cadence: `
          import D3SKRegistry from ${config.d3skRegistry}

          access(all) fun main(): [D3SKRegistry.OfferListing] {
            return D3SKRegistry.getAllListings()
          }
        `,
      })

      // Transform on-chain data to match API format
      const transformedOffers = result.map((offer, idx) => ({
        id: offer.id.toString(),
        maker: offer.maker,
        sell_type: offer.sellType,
        sell_amount: offer.sellAmount,
        ask_type: offer.askType,
        ask_amount: offer.askAmount,
        price: parseFloat((offer.askAmount / offer.sellAmount).toFixed(8)),
        status: 'active',
        created_at: new Date().toISOString(),
      }))

      setOffers(transformedOffers)
      updatePairs(transformedOffers)
    } catch (err) {
      console.error('Error fetching offers from blockchain:', err)
      setError('Failed to fetch offers from blockchain')
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

  // Set up WebSocket connection for live updates
  useEffect(() => {
    const wsUrl = 'ws://localhost:3001/ws'

    let ws
    let reconnectTimeout
    let reconnectAttempts = 0

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('WebSocket connected')
          reconnectAttempts = 0
          // Clear any pending reconnect timeout
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
          }
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)

            if (message.type === 'offer_created' || message.type === 'offer_updated') {
              // Refresh offers when WebSocket event arrives
              fetchOffers()
            } else if (message.type === 'offer_removed') {
              // Remove offer from state
              setOffers((prev) =>
                prev.filter((offer) => offer.id !== message.offerId)
              )
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected, attempting to reconnect...')
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          reconnectAttempts++
          reconnectTimeout = setTimeout(connect, delay)
        }
      } catch (err) {
        console.error('Error connecting to WebSocket:', err)
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
        reconnectAttempts++
        reconnectTimeout = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (ws) {
        ws.close()
      }
    }
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
