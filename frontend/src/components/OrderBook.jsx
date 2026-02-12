import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOffers } from '../hooks/useOffers'
import { useWallet } from '../hooks/useWallet'
import { getTokenName as getTokenNameFromRegistry, TOKEN_REGISTRY, fetchAllTokenPrices } from '../config/tokens'

// Helper function to extract token name from Flow type identifier
function getTokenName(typeIdentifier) {
  return getTokenNameFromRegistry(typeIdentifier)
}

// Helper function to format relative time
function timeAgo(timestamp) {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// Helper function to format time until expiration
function timeUntil(timestamp) {
  if (!timestamp) return null
  const seconds = Math.floor(timestamp - Date.now() / 1000)
  if (seconds <= 0) return 'Expired'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

// Loading skeleton component
function SkeletonRow() {
  return (
    <tr className="border-b border-z3ro-border hover:bg-z3ro-surface/30 transition-colors">
      <td className="px-6 py-4"><div className="h-4 bg-z3ro-border/30 rounded w-20 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-z3ro-border/30 rounded w-28 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-z3ro-border/30 rounded w-28 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-z3ro-border/30 rounded w-28 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-z3ro-border/30 rounded w-24 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-z3ro-border/30 rounded w-16 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-z3ro-border/30 rounded w-16 animate-pulse" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-z3ro-border/30 rounded w-16 animate-pulse" /></td>
    </tr>
  )
}

// Skeleton card for mobile
function SkeletonCard() {
  return (
    <div className="bg-z3ro-surface border border-z3ro-border rounded-lg p-4 mb-4">
      <div className="h-4 bg-z3ro-border/30 rounded w-20 animate-pulse mb-3" />
      <div className="h-4 bg-z3ro-border/30 rounded w-28 animate-pulse mb-3" />
      <div className="h-4 bg-z3ro-border/30 rounded w-24 animate-pulse" />
    </div>
  )
}

export default function OrderBook() {
  const navigate = useNavigate()
  const { offers, loading, error, fetchOffers, pairs } = useOffers()
  const { user } = useWallet()

  const [selectedPair, setSelectedPair] = useState('all')
  const [selectedTokens, setSelectedTokens] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [usdPrices, setUsdPrices] = useState({})
  const [tickerData, setTickerData] = useState([])

  // Fetch USD prices for ALL tokens from CoinGecko
  useEffect(() => {
    async function fetchPrices() {
      const prices = await fetchAllTokenPrices()
      // Build flat usdPrices map for backward compat (label -> number)
      const flatPrices = {}
      const tickerItems = []
      for (const [label, priceData] of Object.entries(prices)) {
        flatPrices[label] = priceData.usd
        tickerItems.push({
          symbol: label,
          price: priceData.usd,
          change24h: priceData.change24h,
          icon: Object.values(TOKEN_REGISTRY).find(t => t.label === label)?.icon || '?',
        })
      }
      setUsdPrices(flatPrices)
      setTickerData(tickerItems)
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 60000)
    return () => clearInterval(interval)
  }, [])

  // Extract unique tokens from offers
  const uniqueTokens = useMemo(() => {
    const tokenSet = new Set()
    offers.forEach(offer => {
      tokenSet.add(getTokenName(offer.sell_type))
      tokenSet.add(getTokenName(offer.ask_type))
    })
    return Array.from(tokenSet).sort()
  }, [offers])

  // Filter offers by selected pair, tokens, and search query
  const filteredOffers = useMemo(() => {
    let result = offers

    // Apply pair filter
    if (selectedPair !== 'all') {
      result = result.filter(offer => {
        const pairLabel = `${getTokenName(offer.sell_type)}/${getTokenName(offer.ask_type)}`
        return pairLabel === selectedPair
      })
    }

    // Apply token filter (shows offers involving any selected token)
    if (selectedTokens.length > 0) {
      result = result.filter(offer => {
        const sellToken = getTokenName(offer.sell_type)
        const askToken = getTokenName(offer.ask_type)
        return selectedTokens.includes(sellToken) || selectedTokens.includes(askToken)
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(offer => {
        const sellToken = getTokenName(offer.sell_type).toLowerCase()
        const askToken = getTokenName(offer.ask_type).toLowerCase()
        const offerId = offer.id.toLowerCase()
        const maker = offer.maker.toLowerCase()

        return (
          sellToken.includes(query) ||
          askToken.includes(query) ||
          offerId.includes(query) ||
          maker.includes(query)
        )
      })
    }

    return result
  }, [offers, selectedPair, selectedTokens, searchQuery])

  // Sort offers
  const sortedOffers = useMemo(() => {
    const sorted = [...filteredOffers]
    sorted.sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'price':
          aVal = parseFloat(a.price) || 0
          bVal = parseFloat(b.price) || 0
          break
        case 'pair':
          aVal = `${getTokenName(a.sell_type)}/${getTokenName(a.ask_type)}`
          bVal = `${getTokenName(b.sell_type)}/${getTokenName(b.ask_type)}`
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
        case 'sell_amount':
          aVal = parseFloat(a.sell_amount) || 0
          bVal = parseFloat(b.sell_amount) || 0
          break
        case 'ask_amount':
          aVal = parseFloat(a.ask_amount) || 0
          bVal = parseFloat(b.ask_amount) || 0
          break
        case 'usd_value':
          aVal = parseFloat(a.sell_amount) * (usdPrices[getTokenName(a.sell_type)] || 0)
          bVal = parseFloat(b.sell_amount) * (usdPrices[getTokenName(b.sell_type)] || 0)
          break
        case 'created_at':
          aVal = a.created_at || 0
          bVal = b.created_at || 0
          break
        default:
          return 0
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
    return sorted
  }, [filteredOffers, sortBy, sortOrder, usdPrices])

  // Extract unique pairs from offers
  const uniquePairs = useMemo(() => {
    const pairSet = new Set()
    offers.forEach(offer => {
      const sellToken = getTokenName(offer.sell_type)
      const askToken = getTokenName(offer.ask_type)
      const pair = `${sellToken}/${askToken}`
      pairSet.add(pair)
    })
    return Array.from(pairSet).sort()
  }, [offers])

  // Calculate stats
  const stats = useMemo(() => {
    const activeOffers = offers.filter(o => o.status === 'active').length
    const bestPrice = sortedOffers.length > 0 ? sortedOffers[0].price : '-'
    return {
      activeOffers,
      pairCount: uniquePairs.length,
      bestPrice
    }
  }, [offers, sortedOffers, uniquePairs])

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder(sortBy === 'created_at' && column !== 'created_at' ? 'asc' : 'desc')
    }
  }

  const handleFill = (offerId) => {
    navigate(`/fill/${offerId}`)
  }

  const toggleTokenFilter = (token) => {
    setSelectedTokens(prev =>
      prev.includes(token)
        ? prev.filter(t => t !== token)
        : [...prev, token]
    )
  }

  const getSortIndicator = (column) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const calculateUsdValue = (offer) => {
    const sellToken = getTokenName(offer.sell_type)
    const sellAmount = parseFloat(offer.sell_amount) || 0
    const price = usdPrices[sellToken] || 0
    return sellAmount * price
  }

  return (
    <div className="min-h-screen bg-d3sk-bg" style={{ paddingTop: '32px' }}>
      {/* ═══ PERSISTENT SCROLLING TICKER — Fixed at top of viewport ═══ */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {/* Duplicate content for seamless loop */}
          {[0, 1].map(copy => (
            <span key={copy}>
              {tickerData.length > 0 ? (
                tickerData.map((item, i) => (
                  <React.Fragment key={`${copy}-${i}`}>
                    <span className="ticker-item">
                      <span style={{ color: '#ffd700', fontSize: '12px' }}>{item.icon}</span>
                      <span className="ticker-symbol">{item.symbol}</span>
                      <span className="ticker-price">
                        ${item.price >= 1 ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price.toFixed(4)}
                      </span>
                      <span className={`ticker-change ${item.change24h > 0.1 ? 'up' : item.change24h < -0.1 ? 'down' : 'flat'}`}>
                        {item.change24h > 0 ? '▲' : item.change24h < 0 ? '▼' : '═'}
                        {Math.abs(item.change24h).toFixed(1)}%
                      </span>
                    </span>
                    <span className="ticker-divider">·</span>
                  </React.Fragment>
                ))
              ) : (
                // Fallback ticker while loading
                <>
                  <span className="ticker-item"><span className="ticker-symbol" style={{ color: '#00ff41' }}>LOADING PRICES</span></span>
                  <span className="ticker-divider">·</span>
                  <span className="ticker-item"><span className="ticker-symbol" style={{ color: '#00e5ff' }}>ZERO CUSTODY</span></span>
                  <span className="ticker-divider">·</span>
                  <span className="ticker-item"><span className="ticker-symbol" style={{ color: '#ffd700' }}>ATOMIC SETTLEMENT</span></span>
                  <span className="ticker-divider">·</span>
                  <span className="ticker-item"><span className="ticker-symbol" style={{ color: '#9945ff' }}>ANY TOKEN PAIR</span></span>
                  <span className="ticker-divider">·</span>
                </>
              )}
              {/* D3SK branding items in the ticker */}
              <span className="ticker-item"><span className="ticker-symbol" style={{ color: '#00ff41' }}>D3SK</span><span className="ticker-price" style={{ color: '#00ff41' }}>ZERO CUSTODY</span></span>
              <span className="ticker-divider">·</span>
              <span className="ticker-item"><span className="ticker-symbol" style={{ color: '#00e5ff' }}>P2P</span><span className="ticker-price" style={{ color: '#00e5ff' }}>ATOMIC</span></span>
              <span className="ticker-divider">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero Section - Pixel Trading Terminal with Wall Street Floor */}
      <div className="overflow-hidden bg-d3sk-surface border-4 border-d3sk-border">
        {/* Pixel Art Trading Floor Banner - Full opacity, standalone */}
        <div className="w-full" style={{ backgroundColor: '#0a0a14' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 56 960 284" shapeRendering="crispEdges" className="w-full" preserveAspectRatio="xMidYMid meet" style={{ imageRendering: 'pixelated', display: 'block' }}>
            <defs>
              <pattern id="pixelGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5"/>
              </pattern>
              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff41"/>
                <stop offset="100%" stopColor="#00ff41" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="chartGlowRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff0055"/>
                <stop offset="100%" stopColor="#ff0055" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {/* Dark trading floor bg */}
            <rect width="960" height="340" fill="#0a0a14"/>
            <rect width="960" height="340" fill="url(#pixelGrid)"/>

            {/* Floor tiles */}
            <g opacity="0.35">
              <rect x="0" y="250" width="960" height="90" fill="#1a1a2e"/>
              <g fill="#141428">
                <rect x="0" y="250" width="48" height="45"/><rect x="96" y="250" width="48" height="45"/><rect x="192" y="250" width="48" height="45"/><rect x="288" y="250" width="48" height="45"/><rect x="384" y="250" width="48" height="45"/><rect x="480" y="250" width="48" height="45"/><rect x="576" y="250" width="48" height="45"/><rect x="672" y="250" width="48" height="45"/><rect x="768" y="250" width="48" height="45"/><rect x="864" y="250" width="48" height="45"/>
                <rect x="48" y="295" width="48" height="45"/><rect x="144" y="295" width="48" height="45"/><rect x="240" y="295" width="48" height="45"/><rect x="336" y="295" width="48" height="45"/><rect x="432" y="295" width="48" height="45"/><rect x="528" y="295" width="48" height="45"/><rect x="624" y="295" width="48" height="45"/><rect x="720" y="295" width="48" height="45"/><rect x="816" y="295" width="48" height="45"/><rect x="912" y="295" width="48" height="45"/>
              </g>
            </g>

            {/* Back wall */}
            <rect x="0" y="0" width="960" height="68" fill="#1a1a2e"/>
            <rect x="0" y="68" width="960" height="4" fill="#3d3d5c"/>

            {/* Big center chart */}
            <rect x="320" y="80" width="320" height="140" fill="#0f0e17" stroke="#232342" strokeWidth="2"/>
            <g stroke="#1a1a2e" strokeWidth="1">
              <line x1="320" y1="115" x2="640" y2="115"/><line x1="320" y1="150" x2="640" y2="150"/><line x1="320" y1="185" x2="640" y2="185"/>
              <line x1="400" y1="80" x2="400" y2="220"/><line x1="480" y1="80" x2="480" y2="220"/><line x1="560" y1="80" x2="560" y2="220"/>
            </g>
            <polyline points="328,208 340,208 348,200 360,200 368,192 380,192 388,184 396,192 404,184 416,176 424,184 432,168 444,168 452,160 460,168 468,152 480,144 492,144 500,136 512,128 520,136 528,120 540,112 548,120 556,104 568,96 576,104 584,96 596,88 608,96 616,88 624,84 632,88" fill="none" stroke="#00ff41" strokeWidth="3"/>
            <polyline points="328,208 340,208 348,200 360,200 368,192 380,192 388,184 396,192 404,184 416,176 424,184 432,168 444,168 452,160 460,168 468,152 480,144 492,144 500,136 512,128 520,136 528,120 540,112 548,120 556,104 568,96 576,104 584,96 596,88 608,96 616,88 624,84 632,88 632,220 328,220" fill="url(#chartGlow)" opacity="0.3"/>
            <text x="328" y="95" fontFamily="monospace" fontSize="8" fill="#00ff41" opacity="0.8">FLOW/USDC</text>
            <text x="590" y="95" fontFamily="monospace" fontSize="8" fill="#00ff41" opacity="0.8">▲ +12.4%</text>

            {/* Small side chart - RED (bearish) */}
            <rect x="16" y="80" width="120" height="70" fill="#0f0e17" stroke="#232342" strokeWidth="2"/>
            <polyline points="24,100 36,98 48,104 60,108 72,106 84,112 96,118 108,116 120,124 128,128" fill="none" stroke="#ff0055" strokeWidth="2"/>
            <polyline points="24,100 36,98 48,104 60,108 72,106 84,112 96,118 108,116 120,124 128,128 128,150 24,150" fill="url(#chartGlowRed)" opacity="0.2"/>
            <text x="24" y="94" fontFamily="monospace" fontSize="7" fill="#ff0055" opacity="0.8">stFLOW/FLOW</text>

            {/* Small side chart - GREEN (right) */}
            <rect x="824" y="80" width="120" height="70" fill="#0f0e17" stroke="#232342" strokeWidth="2"/>
            <polyline points="832,128 844,124 856,120 868,116 880,112 892,108 904,104 916,96 928,92 936,88" fill="none" stroke="#00ff41" strokeWidth="2"/>
            <text x="832" y="94" fontFamily="monospace" fontSize="7" fill="#00ff41" opacity="0.8">WETH/USDC</text>

            {/* === BULL silhouette (left of main chart) === */}
            <g transform="translate(268, 130)" opacity="0.6">
              <rect x="0" y="8" width="36" height="24" fill="#00ff41"/>
              <rect x="32" y="0" width="12" height="16" fill="#00ff41"/>
              <rect x="28" y="-6" width="4" height="8" fill="#00ff41"/>
              <rect x="40" y="-6" width="4" height="8" fill="#00ff41"/>
              <rect x="0" y="32" width="8" height="16" fill="#00ff41"/>
              <rect x="12" y="32" width="8" height="16" fill="#00ff41"/>
              <rect x="24" y="32" width="8" height="12" fill="#00ff41"/>
              <rect x="-4" y="4" width="8" height="4" fill="#00ff41"/>
            </g>

            {/* === BEAR silhouette (right of main chart) === */}
            <g transform="translate(652, 126)" opacity="0.6">
              <rect x="0" y="12" width="36" height="28" fill="#ff0055"/>
              <rect x="-4" y="4" width="16" height="12" fill="#ff0055"/>
              <rect x="-4" y="0" width="6" height="6" fill="#ff0055"/>
              <rect x="8" y="0" width="6" height="6" fill="#ff0055"/>
              <rect x="0" y="40" width="8" height="16" fill="#ff0055"/>
              <rect x="12" y="40" width="8" height="16" fill="#ff0055"/>
              <rect x="24" y="40" width="8" height="12" fill="#ff0055"/>
              <rect x="32" y="32" width="8" height="4" fill="#ff0055"/>
            </g>

            {/* ========== CHARACTER 1: Suit Guy at desk (far left) - bear-suit-sitting ========== */}
            <g transform="translate(24, 168)">
              {/* Desk */}
              <rect x="-8" y="56" width="56" height="8" fill="#3d3d5c"/>
              <rect x="-4" y="64" width="8" height="24" fill="#2a2a44"/><rect x="36" y="64" width="8" height="24" fill="#2a2a44"/>
              {/* Monitor */}
              <rect x="4" y="32" width="32" height="24" fill="#1a1a2e" stroke="#5a5a7a" strokeWidth="2"/>
              <rect x="8" y="36" width="24" height="16" fill="#0f0e17"/>
              <polyline points="10,48 14,44 18,46 22,42 26,44 30,40" fill="none" stroke="#00ff41" strokeWidth="1"/>
              <rect x="16" y="56" width="8" height="4" fill="#5a5a7a"/>
              {/* Head + hair */}
              <rect x="12" y="8" width="16" height="16" fill="#c4956a"/><rect x="12" y="4" width="16" height="8" fill="#3a2820"/>
              <rect x="16" y="16" width="4" height="4" fill="#0f0e17"/><rect x="24" y="16" width="4" height="4" fill="#0f0e17"/>
              {/* Navy suit + red tie */}
              <rect x="8" y="24" width="24" height="20" fill="#16213e"/><rect x="18" y="24" width="4" height="16" fill="#ff0055"/>
              <rect x="0" y="28" width="8" height="16" fill="#16213e"/><rect x="32" y="28" width="8" height="16" fill="#16213e"/>
              <rect x="4" y="44" width="8" height="4" fill="#c4956a"/><rect x="28" y="44" width="8" height="4" fill="#c4956a"/>
            </g>

            {/* ========== CHARACTER 2: Suspenders Vet on phone yelling - bear-suspenders-phonecall ========== */}
            <g transform="translate(110, 145)">
              {/* Head */}
              <rect x="8" y="8" width="16" height="16" fill="#8d5524"/><rect x="8" y="4" width="16" height="8" fill="#888888"/>
              <rect x="12" y="16" width="4" height="4" fill="#0f0e17"/><rect x="20" y="16" width="4" height="4" fill="#0f0e17"/>
              {/* Mouth open (yelling) */}
              <rect x="14" y="22" width="4" height="2" fill="#0f0e17"/>
              {/* White shirt + red suspenders */}
              <rect x="4" y="24" width="24" height="24" fill="#e8e8e8"/>
              <rect x="10" y="24" width="4" height="24" fill="#ff0055"/><rect x="18" y="24" width="4" height="24" fill="#ff0055"/>
              {/* Right arm up holding phone */}
              <rect x="28" y="24" width="8" height="4" fill="#e8e8e8"/><rect x="32" y="8" width="4" height="20" fill="#e8e8e8"/>
              <rect x="32" y="4" width="8" height="12" fill="#3d3d5c"/>
              {/* Left arm waving */}
              <rect x="-8" y="16" width="12" height="4" fill="#e8e8e8"/><rect x="-12" y="12" width="8" height="8" fill="#8d5524"/>
              {/* Legs */}
              <rect x="8" y="48" width="8" height="28" fill="#2d2d44"/><rect x="16" y="48" width="8" height="28" fill="#2d2d44"/>
              <rect x="4" y="72" width="12" height="4" fill="#0f0e17"/><rect x="16" y="72" width="12" height="4" fill="#0f0e17"/>
              {/* Speech bubble: SELL SELL SELL */}
              <rect x="-32" y="-20" width="80" height="20" fill="#e8e8e8" stroke="#3d3d5c" strokeWidth="2"/>
              <text x="-24" y="-6" fontFamily="monospace" fontSize="8" fill="#ff0055" fontWeight="bold">SELL SELL SELL</text>
              {/* Bubble pointer */}
              <rect x="12" y="0" width="6" height="4" fill="#e8e8e8"/><rect x="14" y="4" width="4" height="2" fill="#e8e8e8"/>
            </g>

            {/* ========== CHARACTER 3: Hoodie Coder with laptop on floor - degen-hoodie-sitting ========== */}
            <g transform="translate(190, 192)">
              {/* Head */}
              <rect x="8" y="0" width="16" height="16" fill="#f5d0a9"/><rect x="6" y="-4" width="20" height="10" fill="#2d2d44"/>
              <rect x="12" y="8" width="4" height="4" fill="#0f0e17"/><rect x="18" y="8" width="4" height="4" fill="#0f0e17"/>
              {/* Hoodie body */}
              <rect x="4" y="16" width="24" height="20" fill="#2d2d44"/>
              {/* Arms reaching to laptop */}
              <rect x="-4" y="24" width="12" height="4" fill="#2d2d44"/><rect x="24" y="24" width="12" height="4" fill="#2d2d44"/>
              <rect x="-4" y="28" width="4" height="4" fill="#f5d0a9"/><rect x="32" y="28" width="4" height="4" fill="#f5d0a9"/>
              {/* Sitting legs (crossed) */}
              <rect x="0" y="36" width="32" height="8" fill="#1a1a2e"/>
              <rect x="4" y="44" width="10" height="4" fill="#0f0e17"/><rect x="18" y="44" width="10" height="4" fill="#0f0e17"/>
              {/* Laptop on floor */}
              <rect x="-8" y="32" width="16" height="2" fill="#5a5a7a"/>
              <rect x="-8" y="22" width="16" height="10" fill="#1a1a2e" stroke="#5a5a7a" strokeWidth="1"/>
              <polyline points="-4,28 0,26 4,27 8,25" fill="none" stroke="#00ff41" strokeWidth="1"/>
              {/* Speech bubble: ngmi */}
              <rect x="28" y="-16" width="40" height="16" fill="#e8e8e8" stroke="#3d3d5c" strokeWidth="2"/>
              <text x="34" y="-4" fontFamily="monospace" fontSize="8" fill="#0f0e17" fontWeight="bold">ngmi</text>
              <rect x="28" y="0" width="4" height="4" fill="#e8e8e8"/>
            </g>

            {/* ========== CHARACTER 4: Glasses Trader pointing at chart - whale-vest-pointing ========== */}
            <g transform="translate(296, 160)">
              {/* Head */}
              <rect x="8" y="0" width="16" height="16" fill="#c68642"/><rect x="8" y="-4" width="16" height="8" fill="#1a1a2e"/>
              {/* Glasses */}
              <rect x="6" y="6" width="8" height="6" fill="none" stroke="#5a5a7a" strokeWidth="1"/>
              <rect x="18" y="6" width="8" height="6" fill="none" stroke="#5a5a7a" strokeWidth="1"/>
              <rect x="14" y="8" width="4" height="2" fill="#5a5a7a"/>
              <rect x="10" y="8" width="2" height="2" fill="#0f0e17"/><rect x="20" y="8" width="2" height="2" fill="#0f0e17"/>
              {/* Blue vest over white shirt */}
              <rect x="4" y="16" width="24" height="24" fill="#4a90d9"/>
              <rect x="4" y="16" width="4" height="24" fill="#e8e8e8"/><rect x="24" y="16" width="4" height="24" fill="#e8e8e8"/>
              {/* Right arm pointing at chart */}
              <rect x="28" y="16" width="24" height="6" fill="#4a90d9"/><rect x="52" y="16" width="4" height="4" fill="#c68642"/>
              {/* Left arm at side */}
              <rect x="-4" y="20" width="8" height="16" fill="#4a90d9"/>
              {/* Khaki legs */}
              <rect x="8" y="40" width="8" height="24" fill="#b8a07e"/><rect x="16" y="40" width="8" height="24" fill="#b8a07e"/>
              <rect x="4" y="60" width="12" height="4" fill="#0f0e17"/><rect x="16" y="60" width="12" height="4" fill="#0f0e17"/>
            </g>

            {/* ========== CHARACTER 5: Multi-monitor station guy - neutral-suit-sitting ========== */}
            <g transform="translate(460, 148)">
              {/* Big desk */}
              <rect x="-16" y="64" width="80" height="8" fill="#3d3d5c"/>
              <rect x="-12" y="72" width="8" height="24" fill="#2a2a44"/><rect x="52" y="72" width="8" height="24" fill="#2a2a44"/>
              {/* Left monitor - RED chart */}
              <rect x="-12" y="32" width="28" height="24" fill="#1a1a2e" stroke="#5a5a7a" strokeWidth="2"/>
              <rect x="-8" y="36" width="20" height="16" fill="#0f0e17"/>
              <polyline points="-4,48 0,44 4,46 8,42 12,44" fill="none" stroke="#ff0055" strokeWidth="1"/>
              {/* Center monitor - GREEN chart */}
              <rect x="18" y="28" width="32" height="28" fill="#1a1a2e" stroke="#5a5a7a" strokeWidth="2"/>
              <rect x="22" y="32" width="24" height="20" fill="#0f0e17"/>
              <polyline points="24,48 28,44 32,42 36,38 40,40 44,36" fill="none" stroke="#00ff41" strokeWidth="1.5"/>
              <text x="24" y="40" fontFamily="monospace" fontSize="6" fill="#00e5ff">BUY</text>
              {/* Right monitor - Order book */}
              <rect x="52" y="32" width="28" height="24" fill="#1a1a2e" stroke="#5a5a7a" strokeWidth="2"/>
              <rect x="56" y="36" width="20" height="16" fill="#0f0e17"/>
              <text x="58" y="44" fontFamily="monospace" fontSize="5" fill="#ffd700">ORDERS</text>
              <text x="58" y="50" fontFamily="monospace" fontSize="5" fill="#00ff41">24 LIVE</text>
              {/* Monitor stands */}
              <rect x="0" y="56" width="8" height="8" fill="#5a5a7a"/><rect x="30" y="56" width="8" height="8" fill="#5a5a7a"/><rect x="62" y="56" width="8" height="8" fill="#5a5a7a"/>
              {/* Head + headset */}
              <rect x="20" y="0" width="16" height="16" fill="#c4956a"/><rect x="20" y="-4" width="16" height="8" fill="#5a2a2a"/>
              <rect x="16" y="0" width="4" height="12" fill="#3d3d5c"/><rect x="36" y="0" width="4" height="12" fill="#3d3d5c"/>
              <rect x="16" y="-4" width="24" height="4" fill="#3d3d5c"/>
              <rect x="12" y="8" width="8" height="4" fill="#5a5a7a"/>
              <rect x="24" y="8" width="4" height="4" fill="#0f0e17"/><rect x="32" y="8" width="4" height="4" fill="#0f0e17"/>
              {/* Body - dark hoodie */}
              <rect x="16" y="16" width="24" height="24" fill="#2a2a44"/>
              <rect x="8" y="24" width="8" height="16" fill="#2a2a44"/><rect x="40" y="24" width="8" height="16" fill="#2a2a44"/>
              <rect x="4" y="40" width="12" height="4" fill="#c4956a"/><rect x="40" y="40" width="12" height="4" fill="#c4956a"/>
              {/* Chair */}
              <rect x="8" y="60" width="36" height="4" fill="#232342" stroke="#3d3d5c" strokeWidth="1"/>
            </g>

            {/* ========== CHARACTER 6: Intern with clipboard - wide eyes - intern-polo-standing ========== */}
            <g transform="translate(560, 170)">
              {/* Head */}
              <rect x="8" y="0" width="16" height="16" fill="#f5d0a9"/><rect x="8" y="-4" width="16" height="8" fill="#6b4423"/>
              {/* BIG eyes (wide-eyed newbie) */}
              <rect x="10" y="6" width="6" height="6" fill="#e8e8e8"/><rect x="18" y="6" width="6" height="6" fill="#e8e8e8"/>
              <rect x="12" y="8" width="3" height="3" fill="#0f0e17"/><rect x="20" y="8" width="3" height="3" fill="#0f0e17"/>
              {/* Polo shirt - pink */}
              <rect x="4" y="16" width="24" height="20" fill="#d94a90"/>
              {/* Arms - one holding clipboard */}
              <rect x="-4" y="20" width="8" height="14" fill="#d94a90"/><rect x="28" y="20" width="8" height="14" fill="#d94a90"/>
              <rect x="-4" y="34" width="4" height="4" fill="#f5d0a9"/>
              {/* Clipboard */}
              <rect x="-10" y="28" width="10" height="14" fill="#b8a07e" stroke="#3d3d5c" strokeWidth="1"/>
              <rect x="-8" y="32" width="6" height="2" fill="#3d3d5c"/><rect x="-8" y="36" width="6" height="2" fill="#3d3d5c"/>
              {/* Dark pants */}
              <rect x="8" y="36" width="8" height="24" fill="#2d2d44"/><rect x="16" y="36" width="8" height="24" fill="#2d2d44"/>
              <rect x="4" y="56" width="12" height="4" fill="#0f0e17"/><rect x="16" y="56" width="12" height="4" fill="#0f0e17"/>
            </g>

            {/* ========== CHARACTER 7: D3SK Green Jacket celebrating - d3sk-suit-celebrating ========== */}
            <g transform="translate(640, 148)">
              {/* Head */}
              <rect x="8" y="8" width="16" height="16" fill="#c4956a"/><rect x="8" y="4" width="16" height="8" fill="#1a1a2e"/>
              {/* Happy mouth */}
              <rect x="14" y="20" width="4" height="2" fill="#0f0e17"/>
              {/* Green D3SK jacket */}
              <rect x="4" y="24" width="24" height="20" fill="#0a4a0a"/>
              <text x="8" y="38" fontFamily="monospace" fontSize="6" fill="#00ff41" fontWeight="bold">D3SK</text>
              {/* Arms up celebrating */}
              <rect x="-8" y="4" width="8" height="6" fill="#0a4a0a"/><rect x="-12" y="-4" width="8" height="12" fill="#0a4a0a"/>
              <rect x="-12" y="-8" width="4" height="4" fill="#c4956a"/>
              <rect x="32" y="4" width="8" height="6" fill="#0a4a0a"/><rect x="36" y="-4" width="8" height="12" fill="#0a4a0a"/>
              <rect x="40" y="-8" width="4" height="4" fill="#c4956a"/>
              {/* Legs */}
              <rect x="8" y="44" width="8" height="24" fill="#1a1a2e"/><rect x="16" y="44" width="8" height="24" fill="#1a1a2e"/>
              <rect x="4" y="64" width="12" height="4" fill="#0f0e17"/><rect x="16" y="64" width="12" height="4" fill="#0f0e17"/>
              {/* Speech bubble: LFG! */}
              <rect x="32" y="-24" width="36" height="16" fill="#e8e8e8" stroke="#3d3d5c" strokeWidth="2"/>
              <text x="38" y="-12" fontFamily="monospace" fontSize="8" fill="#00ff41" fontWeight="bold">LFG!</text>
              <rect x="32" y="-8" width="4" height="4" fill="#e8e8e8"/>
            </g>

            {/* ========== CHARACTER 8: Running trader in panic - neutral-suit-running ========== */}
            <g transform="translate(720, 165)">
              {/* Head (tilted forward) */}
              <rect x="12" y="0" width="16" height="16" fill="#8d5524"/><rect x="12" y="-4" width="16" height="8" fill="#1a1010"/>
              <rect x="16" y="8" width="4" height="4" fill="#0f0e17"/><rect x="22" y="8" width="4" height="4" fill="#0f0e17"/>
              {/* Open mouth (panicking) */}
              <rect x="18" y="14" width="4" height="2" fill="#0f0e17"/>
              {/* Suit body (tilted 4px forward) */}
              <rect x="8" y="16" width="24" height="20" fill="#16213e"/>
              <rect x="18" y="16" width="4" height="16" fill="#e8e8e8"/>
              {/* Running arms (opposite legs) */}
              <rect x="-4" y="16" width="12" height="6" fill="#16213e"/><rect x="-4" y="22" width="4" height="4" fill="#8d5524"/>
              <rect x="32" y="24" width="12" height="6" fill="#16213e"/><rect x="40" y="30" width="4" height="4" fill="#8d5524"/>
              {/* Running legs */}
              <rect x="4" y="36" width="8" height="24" fill="#16213e" transform="rotate(-15,8,48)"/>
              <rect x="20" y="36" width="8" height="24" fill="#16213e" transform="rotate(15,24,48)"/>
              <rect x="-2" y="56" width="12" height="4" fill="#0f0e17"/><rect x="24" y="56" width="12" height="4" fill="#0f0e17"/>
              {/* Flying papers from this trader */}
              <rect x="-20" y="8" width="8" height="6" fill="#f0f0f0" opacity="0.6" transform="rotate(-25,-16,11)"/>
              <rect x="-28" y="20" width="6" height="5" fill="#f0f0f0" opacity="0.5" transform="rotate(15,-25,23)"/>
              <rect x="-16" y="28" width="7" height="5" fill="#f0f0f0" opacity="0.4" transform="rotate(-10,-13,31)"/>
            </g>

            {/* ========== CHARACTER 9: Coffee-spilling vest bro - whale-vest-standing ========== */}
            <g transform="translate(790, 165)">
              {/* Head */}
              <rect x="8" y="0" width="16" height="16" fill="#c68642"/><rect x="8" y="-4" width="16" height="8" fill="#cc3300"/>
              <rect x="12" y="8" width="4" height="4" fill="#0f0e17"/><rect x="20" y="8" width="4" height="4" fill="#0f0e17"/>
              {/* Blue vest */}
              <rect x="4" y="16" width="24" height="20" fill="#4a90d9"/>
              <rect x="14" y="16" width="4" height="8" fill="#e8e8e8"/>
              {/* Right arm holding tipping coffee */}
              <rect x="28" y="20" width="8" height="12" fill="#4a90d9"/>
              <rect x="32" y="16" width="8" height="10" fill="#b8a07e" stroke="#3d3d5c" strokeWidth="1"/>
              {/* Coffee spilling */}
              <rect x="36" y="26" width="4" height="8" fill="#6b4423" opacity="0.7"/>
              <rect x="34" y="34" width="4" height="4" fill="#6b4423" opacity="0.5"/>
              <rect x="38" y="30" width="4" height="6" fill="#6b4423" opacity="0.6"/>
              {/* Left arm */}
              <rect x="-4" y="20" width="8" height="14" fill="#4a90d9"/>
              {/* Khaki legs */}
              <rect x="8" y="36" width="8" height="24" fill="#b8a07e"/><rect x="16" y="36" width="8" height="24" fill="#b8a07e"/>
              <rect x="4" y="56" width="12" height="4" fill="#0f0e17"/><rect x="16" y="56" width="12" height="4" fill="#0f0e17"/>
              {/* Spilled coffee puddle on floor */}
              <rect x="28" y="58" width="16" height="4" fill="#6b4423" opacity="0.4"/>
              <rect x="32" y="56" width="8" height="2" fill="#6b4423" opacity="0.3"/>
            </g>

            {/* ========== CHARACTER 10: Purple degen with cap - degen-hoodie-standing ========== */}
            <g transform="translate(860, 170)">
              {/* Head */}
              <rect x="8" y="0" width="16" height="16" fill="#4a2c0a"/><rect x="6" y="-2" width="20" height="6" fill="#9945ff"/>
              {/* Cap brim */}
              <rect x="4" y="4" width="8" height="4" fill="#9945ff"/>
              <rect x="12" y="8" width="4" height="4" fill="#e8e8e8"/><rect x="20" y="8" width="4" height="4" fill="#e8e8e8"/>
              <rect x="14" y="10" width="2" height="2" fill="#0f0e17"/><rect x="22" y="10" width="2" height="2" fill="#0f0e17"/>
              {/* Purple hoodie */}
              <rect x="4" y="16" width="24" height="22" fill="#2d2d44"/>
              <rect x="12" y="16" width="8" height="6" fill="#9945ff"/>
              {/* Arms at sides, phone in hand */}
              <rect x="-4" y="20" width="8" height="14" fill="#2d2d44"/>
              <rect x="28" y="20" width="8" height="14" fill="#2d2d44"/>
              <rect x="32" y="26" width="6" height="10" fill="#3d3d5c"/>
              <rect x="33" y="28" width="4" height="6" fill="#0f0e17"/>
              {/* Black joggers */}
              <rect x="8" y="38" width="8" height="24" fill="#1a1a2e"/><rect x="16" y="38" width="8" height="24" fill="#1a1a2e"/>
              <rect x="4" y="58" width="12" height="4" fill="#0f0e17"/><rect x="16" y="58" width="12" height="4" fill="#0f0e17"/>
              {/* Speech bubble: HODL */}
              <rect x="-36" y="-16" width="40" height="16" fill="#e8e8e8" stroke="#3d3d5c" strokeWidth="2"/>
              <text x="-28" y="-4" fontFamily="monospace" fontSize="8" fill="#9945ff" fontWeight="bold">HODL</text>
              <rect x="0" y="0" width="4" height="4" fill="#e8e8e8"/>
            </g>

            {/* ========== CHARACTER 11: Calm Vet sipping coffee - neutral-suspenders-standing ========== */}
            <g transform="translate(156, 170)">
              {/* Head */}
              <rect x="8" y="0" width="16" height="16" fill="#c4956a"/><rect x="8" y="-4" width="16" height="8" fill="#888888"/>
              <rect x="12" y="8" width="4" height="4" fill="#0f0e17"/><rect x="20" y="8" width="4" height="4" fill="#0f0e17"/>
              {/* White shirt + green suspenders */}
              <rect x="4" y="16" width="24" height="22" fill="#e8e8e8"/>
              <rect x="10" y="16" width="4" height="22" fill="#00ff41"/><rect x="18" y="16" width="4" height="22" fill="#00ff41"/>
              {/* Left arm relaxed */}
              <rect x="-4" y="20" width="8" height="14" fill="#e8e8e8"/>
              {/* Right arm holding coffee */}
              <rect x="28" y="20" width="8" height="10" fill="#e8e8e8"/>
              <rect x="32" y="14" width="8" height="10" fill="#b8a07e" stroke="#3d3d5c" strokeWidth="1"/>
              {/* Steam from coffee */}
              <rect x="34" y="8" width="2" height="4" fill="#e8e8e8" opacity="0.4"/>
              <rect x="38" y="6" width="2" height="4" fill="#e8e8e8" opacity="0.3"/>
              {/* Dark pants */}
              <rect x="8" y="38" width="8" height="24" fill="#2d2d44"/><rect x="16" y="38" width="8" height="24" fill="#2d2d44"/>
              <rect x="4" y="58" width="12" height="4" fill="#0f0e17"/><rect x="16" y="58" width="12" height="4" fill="#0f0e17"/>
            </g>

            {/* ========== CHARACTER 12: Standing trader leaning on pillar - whale-suit-leaning ========== */}
            <g transform="translate(940, 164)">
              {/* Head */}
              <rect x="-12" y="0" width="16" height="16" fill="#f5d0a9"/><rect x="-12" y="-4" width="16" height="8" fill="#ffd700"/>
              <rect x="-8" y="8" width="4" height="4" fill="#0f0e17"/><rect x="-2" y="8" width="4" height="4" fill="#0f0e17"/>
              {/* Navy suit */}
              <rect x="-16" y="16" width="24" height="22" fill="#16213e"/>
              <rect x="-6" y="16" width="4" height="16" fill="#4a90d9"/>
              {/* Left arm leaning on edge */}
              <rect x="-24" y="20" width="8" height="12" fill="#16213e"/>
              {/* Right arm relaxed */}
              <rect x="8" y="20" width="8" height="12" fill="#16213e"/>
              {/* Legs */}
              <rect x="-12" y="38" width="8" height="24" fill="#16213e"/><rect x="-4" y="38" width="8" height="24" fill="#16213e"/>
              <rect x="-16" y="58" width="12" height="4" fill="#0f0e17"/><rect x="-4" y="58" width="12" height="4" fill="#0f0e17"/>
            </g>

            {/* Flying papers and confetti (expanded chaos) */}
            <g fill="#f0f0f0" opacity="0.5">
              <rect x="80" y="100" width="10" height="7" transform="rotate(-20,85,104)"/>
              <rect x="200" y="90" width="8" height="6" transform="rotate(25,204,93)"/>
              <rect x="380" y="120" width="10" height="7" transform="rotate(15,385,124)"/>
              <rect x="500" y="85" width="9" height="6" transform="rotate(-12,505,88)"/>
              <rect x="620" y="105" width="11" height="7" transform="rotate(-10,626,109)"/>
              <rect x="750" y="100" width="10" height="7" transform="rotate(25,755,104)"/>
              <rect x="820" y="115" width="8" height="6" transform="rotate(-18,824,118)"/>
              <rect x="340" y="200" width="8" height="6" transform="rotate(30,344,203)"/>
              <rect x="590" y="195" width="9" height="6" transform="rotate(-8,595,198)"/>
              <rect x="900" y="140" width="7" height="5" transform="rotate(20,904,143)"/>
            </g>

            {/* Colorful confetti bits */}
            <g opacity="0.5">
              <rect x="140" y="95" width="4" height="4" fill="#00ff41" transform="rotate(45,142,97)"/>
              <rect x="310" y="115" width="4" height="4" fill="#ff0055" transform="rotate(30,312,117)"/>
              <rect x="530" y="92" width="4" height="4" fill="#ffd700" transform="rotate(-15,532,94)"/>
              <rect x="670" y="108" width="4" height="4" fill="#00e5ff" transform="rotate(20,672,110)"/>
              <rect x="800" y="95" width="4" height="4" fill="#9945ff" transform="rotate(-30,802,97)"/>
              <rect x="420" y="240" width="4" height="4" fill="#00ff41" transform="rotate(10,422,242)"/>
              <rect x="580" y="245" width="4" height="4" fill="#ffd700" transform="rotate(-20,582,247)"/>
            </g>

            {/* Dollar signs and crypto symbols */}
            <text x="60" y="120" fontFamily="monospace" fontSize="12" fill="#ffd700" opacity="0.25" transform="rotate(-10,60,120)">$</text>
            <text x="240" y="100" fontFamily="monospace" fontSize="10" fill="#00e5ff" opacity="0.2">⬡</text>
            <text x="760" y="110" fontFamily="monospace" fontSize="14" fill="#00ff41" opacity="0.25" transform="rotate(8,760,110)">$</text>
            <text x="900" y="105" fontFamily="monospace" fontSize="10" fill="#00e5ff" opacity="0.2">⬡</text>
            <text x="450" y="245" fontFamily="monospace" fontSize="10" fill="#ffd700" opacity="0.15">$</text>
            <text x="700" y="250" fontFamily="monospace" fontSize="8" fill="#00ff41" opacity="0.15">◎</text>

          </svg>
        </div>

        {/* Hero Text Content - Separate section below banner */}
        <div className="border-t-2 border-d3sk-border bg-d3sk-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
            <div className="text-center">
              <h1 className="pixel-heading text-d3sk-green crt-glow mb-4 leading-tight" style={{ fontSize: '32px' }}>
                YOUR TOKENS. YOUR WALLET.
              </h1>
              <h2 className="pixel-heading text-d3sk-cyan crt-glow mb-4" style={{ fontSize: '24px' }}>
                ALWAYS.
              </h2>
              <p className="terminal-text text-d3sk-yellow mb-6" style={{ fontSize: '14px', fontFamily: '"Press Start 2P"', letterSpacing: '2px' }}>
                DON'T NUKE THE CHART
              </p>
              <p className="terminal-text text-d3sk-text max-w-3xl mx-auto mb-8 leading-relaxed" style={{ fontSize: '12px' }}>
                Trade peer-to-peer on Flow. No deposits. No approvals. No custody. Settlement is atomic and instant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/create')}
                  className="btn-primary shadow-pixel hover:translate-y-0.5 hover:shadow-sm font-pixel"
                  style={{ padding: '12px 24px', fontSize: '12px', fontFamily: '"Press Start 2P"' }}
                >
                  CREATE OFFER
                </button>
                <button
                  onClick={() => navigate('/how-it-works')}
                  className="btn-secondary shadow-pixel hover:translate-y-0.5 hover:shadow-sm font-pixel"
                  style={{ padding: '12px 24px', fontSize: '12px', fontFamily: '"Press Start 2P"' }}
                >
                  HOW IT WORKS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar - Pixel Windows */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel">
            <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">ACTIVE OFFERS</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-4">
              <div className="stat-value text-d3sk-green font-pixel" style={{ fontSize: '20px', fontFamily: '"Press Start 2P"' }}>{stats.activeOffers}</div>
            </div>
          </div>
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel">
            <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">TRADING PAIRS</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-4">
              <div className="stat-value text-d3sk-cyan font-pixel" style={{ fontSize: '20px', fontFamily: '"Press Start 2P"' }}>{stats.pairCount}</div>
            </div>
          </div>
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel">
            <div className="pixel-window-title bg-d3sk-yellow text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">BEST PRICE</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-4">
              <div className={`stat-value font-pixel font-mono ${stats.bestPrice === '-' ? 'text-d3sk-muted' : 'text-d3sk-yellow'}`} style={{ fontSize: '16px', fontFamily: '"VT323"' }}>
                {stats.bestPrice === '-' ? '-' : `${parseFloat(stats.bestPrice).toFixed(4)}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pair Selector - Pixel Buttons */}
      {uniquePairs.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b-4 border-d3sk-border">
          <div className="mb-4">
            <h3 className="text-pixel-xs font-pixel text-d3sk-green mb-3">FILTER BY PAIR</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPair('all')}
                className={`px-4 py-2 border-2 font-pixel text-pixel-xs transition-all shadow-pixel ${
                  selectedPair === 'all'
                    ? 'bg-d3sk-green text-d3sk-bg border-d3sk-green'
                    : 'bg-d3sk-surface text-d3sk-text border-d3sk-accent hover:border-d3sk-green'
                }`}
              >
                ALL
              </button>
              {uniquePairs.map(pair => (
                <button
                  key={pair}
                  onClick={() => setSelectedPair(pair)}
                  className={`px-4 py-2 border-2 font-pixel text-pixel-xs transition-all shadow-pixel ${
                    selectedPair === pair
                      ? 'bg-d3sk-green text-d3sk-bg border-d3sk-green'
                      : 'bg-d3sk-surface text-d3sk-text border-d3sk-cyan hover:border-d3sk-green'
                  }`}
                >
                  {pair}
                </button>
              ))}
            </div>
          </div>

          {/* Token Filter */}
          {uniqueTokens.length > 0 && (
            <div>
              <h3 className="text-pixel-xs font-pixel text-d3sk-cyan mb-3">FILTER BY TOKEN</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueTokens.map(token => (
                  <button
                    key={token}
                    onClick={() => toggleTokenFilter(token)}
                    className={`px-3 py-1.5 border-2 font-pixel text-pixel-xs transition-all shadow-pixel ${
                      selectedTokens.includes(token)
                        ? 'bg-d3sk-cyan text-d3sk-bg border-d3sk-cyan'
                        : 'bg-d3sk-surface text-d3sk-text border-d3sk-accent hover:border-d3sk-cyan'
                    }`}
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Order Book */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar - Terminal Style */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-d3sk-green terminal-text font-pixel" style={{ fontSize: '12px' }}>
              &gt;
            </div>
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-8 pr-10 py-3 border-2 bg-d3sk-surface text-d3sk-text terminal-text"
              style={{ fontFamily: '"VT323"', fontSize: '12px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-d3sk-muted hover:text-d3sk-red transition-colors font-pixel"
              >
                [X]
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-d3sk-red/10 border-2 border-d3sk-red text-d3sk-red terminal-text" style={{ fontSize: '12px' }}>
            ERROR: {error}
          </div>
        )}

        {/* Desktop Table View - Pixel Table */}
        <div className="hidden md:block">
          {loading ? (
            <div className="pixel-window border-3 border-d3sk-border shadow-pixel overflow-hidden">
              <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg">
                <span className="text-pixel-xs font-pixel">LOADING OFFERS</span>
              </div>
              <div className="pixel-window-body bg-d3sk-bg p-4">
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-d3sk-border/30 animate-pulse" style={{ maxWidth: '100%' }} />
                  ))}
                </div>
              </div>
            </div>
          ) : sortedOffers.length === 0 ? (
            <div className="pixel-window border-3 border-d3sk-border shadow-pixel text-center">
              <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
                <span className="text-pixel-xs font-pixel">NO OFFERS</span>
              </div>
              <div className="pixel-window-body bg-d3sk-bg p-8">
                <p className="terminal-text text-d3sk-muted mb-4" style={{ fontSize: '12px' }}>NO ACTIVE OFFERS. CREATE ONE?</p>
                <button
                  onClick={() => navigate('/create')}
                  className="btn-primary shadow-pixel font-pixel text-pixel-xs"
                  style={{ padding: '8px 16px' }}
                >
                  CREATE
                </button>
              </div>
            </div>
          ) : (
            <div className="pixel-window border-3 border-d3sk-border shadow-pixel overflow-hidden">
              <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg">
                <span className="text-pixel-xs font-pixel">ORDER BOOK</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full pixel-table">
                  <thead>
                    <tr className="border-b-2 border-d3sk-border bg-d3sk-surface">
                      <th
                        onClick={() => handleSort('pair')}
                        className="px-4 py-2 text-left text-pixel-xs font-pixel text-d3sk-green cursor-pointer hover:bg-d3sk-surface/80 transition-colors"
                      >
                        PAIR {getSortIndicator('pair')}
                      </th>
                      <th
                        onClick={() => handleSort('price')}
                        className="px-4 py-2 text-left text-pixel-xs font-pixel text-d3sk-yellow cursor-pointer hover:bg-d3sk-surface/80 transition-colors"
                      >
                        PRICE {getSortIndicator('price')}
                      </th>
                      <th
                        onClick={() => handleSort('sell_amount')}
                        className="px-4 py-2 text-left text-pixel-xs font-pixel text-d3sk-text cursor-pointer hover:bg-d3sk-surface/80 transition-colors"
                      >
                        SELL {getSortIndicator('sell_amount')}
                      </th>
                      <th
                        onClick={() => handleSort('ask_amount')}
                        className="px-4 py-2 text-left text-pixel-xs font-pixel text-d3sk-text cursor-pointer hover:bg-d3sk-surface/80 transition-colors"
                      >
                        ASK {getSortIndicator('ask_amount')}
                      </th>
                      <th
                        onClick={() => handleSort('usd_value')}
                        className="px-4 py-2 text-left text-pixel-xs font-pixel text-d3sk-cyan cursor-pointer hover:bg-d3sk-surface/80 transition-colors"
                      >
                        USD {getSortIndicator('usd_value')}
                      </th>
                      <th className="px-4 py-2 text-left text-pixel-xs font-pixel text-d3sk-muted">MAKER</th>
                      <th
                        onClick={() => handleSort('created_at')}
                        className="px-4 py-2 text-left text-pixel-xs font-pixel text-d3sk-muted cursor-pointer hover:bg-d3sk-surface/80 transition-colors"
                      >
                        AGE {getSortIndicator('created_at')}
                      </th>
                      <th className="px-4 py-2 text-left text-pixel-xs font-pixel text-d3sk-muted">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOffers.map((offer) => {
                      const sellToken = getTokenName(offer.sell_type)
                      const askToken = getTokenName(offer.ask_type)
                      const pair = `${sellToken} → ${askToken}`
                      const makerTruncated = `${offer.maker.slice(0, 6)}...${offer.maker.slice(-4)}`
                      const timeStr = timeAgo(offer.created_at)
                      const price = parseFloat(offer.price).toFixed(4)
                      const sellAmount = parseFloat(offer.sell_amount).toFixed(2)
                      const askAmount = parseFloat(offer.ask_amount).toFixed(2)
                      const usdValue = calculateUsdValue(offer)

                      return (
                        <tr
                          key={offer.id}
                          className="border-b border-d3sk-border/50 hover:bg-d3sk-surface/50 transition-colors cursor-pointer"
                          onClick={() => handleFill(offer.id)}
                        >
                          <td className="px-4 py-2 font-pixel text-d3sk-green text-pixel-xs">
                            {pair}
                          </td>
                          <td className="px-4 py-2 font-mono text-d3sk-yellow text-pixel-xs">
                            {price}
                          </td>
                          <td className="px-4 py-2 font-mono text-d3sk-text text-pixel-xs">
                            {sellAmount}
                          </td>
                          <td className="px-4 py-2 font-mono text-d3sk-text text-pixel-xs">
                            {askAmount}
                          </td>
                          <td className="px-4 py-2 font-mono text-d3sk-cyan text-pixel-xs">
                            ${usdValue.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-pixel-xs text-d3sk-muted font-mono">
                            {makerTruncated}
                          </td>
                          <td className="px-4 py-2 text-pixel-xs">
                            <span className="text-d3sk-muted">{timeStr}</span>
                            {offer.expires_at && (
                              <span className={`block text-pixel-xs mt-0.5 ${timeUntil(offer.expires_at) === 'Expired' ? 'text-d3sk-red' : 'text-d3sk-yellow'}`}>
                                {timeUntil(offer.expires_at) === 'Expired' ? 'EXP' : `${timeUntil(offer.expires_at)}`}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleFill(offer.id)
                              }}
                              className="btn-primary px-2 py-1 text-pixel-xs font-pixel shadow-pixel transition-all"
                            >
                              FILL
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Card View - Pixel Windows */}
        <div className="md:hidden">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="pixel-window border-2 border-d3sk-border shadow-pixel">
                  <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg">
                    <span className="text-pixel-xs font-pixel">LOADING</span>
                  </div>
                  <div className="pixel-window-body bg-d3sk-bg p-3">
                    <div className="h-3 bg-d3sk-border/30 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedOffers.length === 0 ? (
            <div className="pixel-window border-2 border-d3sk-border shadow-pixel text-center">
              <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
                <span className="text-pixel-xs font-pixel">EMPTY</span>
              </div>
              <div className="pixel-window-body bg-d3sk-bg p-6">
                <p className="terminal-text text-d3sk-muted mb-4" style={{ fontSize: '10px' }}>NO ACTIVE OFFERS</p>
                <button
                  onClick={() => navigate('/create')}
                  className="btn-primary px-4 py-1.5 font-pixel text-pixel-xs shadow-pixel"
                >
                  CREATE
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedOffers.map((offer) => {
                const sellToken = getTokenName(offer.sell_type)
                const askToken = getTokenName(offer.ask_type)
                const pair = `${sellToken} → ${askToken}`
                const makerTruncated = `${offer.maker.slice(0, 6)}...${offer.maker.slice(-4)}`
                const timeStr = timeAgo(offer.created_at)
                const price = parseFloat(offer.price).toFixed(4)
                const sellAmount = parseFloat(offer.sell_amount).toFixed(2)
                const askAmount = parseFloat(offer.ask_amount).toFixed(2)
                const usdValue = calculateUsdValue(offer)

                return (
                  <div
                    key={offer.id}
                    onClick={() => handleFill(offer.id)}
                    className="pixel-window border-2 border-d3sk-accent shadow-pixel cursor-pointer hover:border-d3sk-green transition-colors"
                  >
                    <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
                      <span className="text-pixel-xs font-pixel">{pair}</span>
                    </div>
                    <div className="pixel-window-body bg-d3sk-bg p-3">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-pixel text-d3sk-text text-pixel-xs">{pair}</div>
                          <div className="terminal-text text-d3sk-muted mt-1" style={{ fontSize: '10px' }}>
                            {timeStr}
                            {offer.expires_at && (
                              <span className={`ml-1 ${timeUntil(offer.expires_at) === 'Expired' ? 'text-d3sk-red' : 'text-d3sk-yellow'}`}>
                                ({timeUntil(offer.expires_at) === 'Expired' ? 'EXP' : `${timeUntil(offer.expires_at)}`})
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFill(offer.id)
                          }}
                          className="btn-primary px-2 py-1 text-pixel-xs font-pixel shadow-pixel"
                        >
                          FILL
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="terminal-text text-d3sk-muted text-pixel-xs mb-0.5">PRICE</div>
                          <div className="font-mono text-d3sk-yellow text-pixel-xs">{price}</div>
                        </div>
                        <div>
                          <div className="terminal-text text-d3sk-muted text-pixel-xs mb-0.5">USD</div>
                          <div className="font-mono text-d3sk-cyan text-pixel-xs">${usdValue.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2 text-pixel-xs">
                        <div>
                          <div className="terminal-text text-d3sk-muted text-pixel-xs mb-0.5">SELL</div>
                          <div className="font-mono text-d3sk-text">{sellAmount}</div>
                        </div>
                        <div>
                          <div className="terminal-text text-d3sk-muted text-pixel-xs mb-0.5">ASK</div>
                          <div className="font-mono text-d3sk-text">{askAmount}</div>
                        </div>
                      </div>

                      <div className="border-t border-d3sk-border/50 pt-2 text-pixel-xs">
                        <div className="font-mono text-d3sk-muted">{makerTruncated}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* USD Values Footnote */}
        {sortedOffers.length > 0 && (
          <div className="mt-6 text-pixel-xs text-d3sk-muted text-center terminal-text">
            USD = COINGECKO. FEE = 0.3% TAKER.
          </div>
        )}
      </div>

      {/* Footer spacing */}
      <div className="h-16" />
    </div>
  )
}
