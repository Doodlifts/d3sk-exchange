import React, { useState, useEffect, useRef } from 'react'
import { fetchAllTokenPrices, TOKEN_REGISTRY } from '../config/tokens'

// Curated list of tokens to display (most relevant for D3SK trading)
const TICKER_TOKENS = [
  'FLOW', 'stFLOW', 'PYUSD', 'USDC_BRIDGED', 'USDF',
  'stgWETH', 'WBTC', 'cbBTC', 'stgUSDT', 'USDC_NATIVE',
]

function formatPrice(price) {
  if (price >= 10000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 100) return price.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 3 })
  if (price >= 0.01) return price.toLocaleString('en-US', { maximumFractionDigits: 4 })
  return price.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

function formatChange(change) {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export default function Ticker() {
  const [prices, setPrices] = useState({})
  const scrollRef = useRef(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      const p = await fetchAllTokenPrices()
      if (mounted) setPrices(p)
    }

    load()
    const interval = setInterval(load, 60000) // refresh every 60s
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  // Build ticker items from registry + prices
  const items = TICKER_TOKENS
    .map((key) => {
      const token = TOKEN_REGISTRY[key]
      if (!token) return null
      const priceData = prices[token.label]
      return {
        key,
        label: token.label,
        icon: token.icon || '●',
        price: priceData?.usd ?? null,
        change: priceData?.change24h ?? null,
      }
    })
    .filter(Boolean)

  // Duplicate items for seamless loop
  const loopItems = [...items, ...items, ...items]

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-d3sk-bg border-b border-d3sk-border overflow-hidden"
      style={{ height: 32 }}
    >
      <div
        ref={scrollRef}
        className="ticker-scroll flex items-center h-full whitespace-nowrap"
        style={{
          animation: `ticker-scroll ${items.length * 4}s linear infinite`,
        }}
      >
        {loopItems.map((item, i) => (
          <span key={`${item.key}-${i}`} className="inline-flex items-center gap-1.5 mx-5 shrink-0">
            <span className="font-retro text-retro-sm text-d3sk-muted">{item.icon}</span>
            <span className="font-pixel text-[9px] text-d3sk-text">{item.label}</span>
            {item.price !== null ? (
              <>
                <span className="font-retro text-retro-sm text-d3sk-yellow">
                  ${formatPrice(item.price)}
                </span>
                {item.change !== null && item.change !== 0 && (
                  <span
                    className={`font-retro text-retro-sm ${
                      item.change >= 0 ? 'text-d3sk-green' : 'text-d3sk-red'
                    }`}
                  >
                    {formatChange(item.change)}
                  </span>
                )}
              </>
            ) : (
              <span className="font-retro text-retro-sm text-d3sk-muted">—</span>
            )}
            <span className="text-d3sk-border mx-2">│</span>
          </span>
        ))}
      </div>

      {/* CSS keyframe for the scroll animation */}
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
