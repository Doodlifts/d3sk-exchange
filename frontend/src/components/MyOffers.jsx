import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useWallet } from '../hooks/useWallet'
import { useOffers } from '../hooks/useOffers'
import { useTransactions } from '../hooks/useTransactions'
import { getTokenName, getTokenKeyFromType, fetchAllTokenPrices } from '../config/tokens'

function truncateAddress(addr) {
  if (!addr) return ''
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

function formatExpiration(expiresAt) {
  if (!expiresAt) return null
  const now = Date.now() / 1000
  if (now > expiresAt) return 'Expired'
  const seconds = Math.floor(expiresAt - now)
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m left`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h left`
  return `${Math.floor(seconds / 86400)}d left`
}

export default function MyOffers() {
  const navigate = useNavigate()
  const { user, connect } = useWallet()
  const { offers, loading: offersLoading, fetchOffers } = useOffers()
  const { cancelOffer, txStatus, error: txError, resetTx } = useTransactions()

  const [cancellingId, setCancellingId] = useState(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [usdPrices, setUsdPrices] = useState({})

  useEffect(() => {
    async function fetchPrices() {
      const prices = await fetchAllTokenPrices()
      const flatPrices = {}
      for (const [label, data] of Object.entries(prices)) {
        flatPrices[label] = data.usd
      }
      setUsdPrices(flatPrices)
    }
    fetchPrices()
  }, [])

  useEffect(() => {
    if (txStatus === 'sealed') {
      toast.success('Offer cancelled successfully')
      setIsProcessing(false)
      setShowCancelConfirm(false)
      setCancellingId(null)
      setTimeout(() => {
        resetTx()
        fetchOffers()
      }, 1000)
    } else if (txStatus === 'error') {
      toast.error(txError || 'Failed to cancel offer')
      setIsProcessing(false)
    } else if (txStatus === 'pending') {
      setIsProcessing(true)
    }
  }, [txStatus, txError, resetTx, fetchOffers])

  const handleCancelOffer = async () => {
    if (!cancellingId) return
    try {
      setShowCancelConfirm(false)
      const cancellingOffer = offers.find((o) => String(o.id) === String(cancellingId))
      if (cancellingOffer) {
        const sellTokenKey = getTokenKeyFromType(cancellingOffer.sell_type || cancellingOffer.sell_token_type)
        await cancelOffer(parseInt(cancellingId), sellTokenKey)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel offer')
      setIsProcessing(false)
    }
  }

  // Filter offers by maker
  const userOffers = user ? offers.filter((o) => o.maker === user.addr) : []
  const activeOffers = userOffers.filter((o) => o.status === 'active')
  const filledOffers = userOffers.filter((o) => o.status === 'filled')

  // Not connected state
  if (!user) {
    return (
      <div className="min-h-screen bg-d3sk-bg px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel mb-6">
            <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">MY ORDERS</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-4">
              <p className="pixel-heading text-d3sk-green mb-2 crt-glow" style={{ fontSize: '16px' }}>MY OFFERS</p>
              <p className="terminal-text text-d3sk-text text-pixel-xs">MANAGE YOUR TRADING OFFERS</p>
            </div>
          </div>

          <div className="pixel-window border-3 border-d3sk-border shadow-pixel text-center">
            <div className="pixel-window-title bg-d3sk-red text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">NOT CONNECTED</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-8">
              <p className="terminal-text text-d3sk-muted mb-4" style={{ fontSize: '12px' }}>CONNECT WALLET TO VIEW OFFERS</p>
              <button
                onClick={connect}
                className="btn-primary px-6 py-2 font-pixel text-pixel-xs shadow-pixel"
              >
                CONNECT WALLET
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (offersLoading) {
    return (
      <div className="min-h-screen bg-d3sk-bg px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel mb-6">
            <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">MY ORDERS</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-4">
              <p className="pixel-heading text-d3sk-green mb-2 crt-glow" style={{ fontSize: '16px' }}>MY OFFERS</p>
              <p className="terminal-text text-d3sk-text text-pixel-xs">MANAGE YOUR TRADING OFFERS</p>
            </div>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-d3sk-green border-t-d3sk-yellow rounded-full animate-spin mx-auto mb-4"></div>
            <p className="terminal-text text-d3sk-muted" style={{ fontSize: '12px' }}>LOADING YOUR OFFERS...</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (userOffers.length === 0) {
    return (
      <div className="min-h-screen bg-d3sk-bg px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel mb-6">
            <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">MY ORDERS</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-4">
              <p className="pixel-heading text-d3sk-green mb-2 crt-glow" style={{ fontSize: '16px' }}>MY OFFERS</p>
              <p className="terminal-text text-d3sk-text text-pixel-xs">MANAGE YOUR TRADING OFFERS</p>
            </div>
          </div>

          <div className="pixel-window border-3 border-d3sk-border shadow-pixel text-center">
            <div className="pixel-window-title bg-d3sk-yellow text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">EMPTY</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-8">
              <p className="terminal-text text-d3sk-muted mb-4" style={{ fontSize: '12px' }}>NO OFFERS CREATED YET</p>
              <button
                onClick={() => navigate('/create')}
                className="btn-primary px-6 py-2 font-pixel text-pixel-xs shadow-pixel"
              >
                CREATE OFFER
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-d3sk-bg px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="pixel-window border-3 border-d3sk-border shadow-pixel mb-6">
          <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
            <span className="text-pixel-xs font-pixel">MY ORDERS</span>
          </div>
          <div className="pixel-window-body bg-d3sk-bg p-4">
            <p className="pixel-heading text-d3sk-green mb-2 crt-glow" style={{ fontSize: '16px' }}>MY OFFERS</p>
            <p className="terminal-text text-d3sk-text text-pixel-xs">MANAGE YOUR TRADING OFFERS</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel">
            <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">TOTAL</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-3">
              <p className="font-pixel text-d3sk-cyan" style={{ fontSize: '18px' }}>{userOffers.length}</p>
            </div>
          </div>
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel">
            <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">ACTIVE</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-3">
              <p className="font-pixel text-d3sk-green" style={{ fontSize: '18px' }}>{activeOffers.length}</p>
            </div>
          </div>
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel">
            <div className="pixel-window-title bg-d3sk-yellow text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">FILLED</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-3">
              <p className="font-pixel text-d3sk-yellow" style={{ fontSize: '18px' }}>{filledOffers.length}</p>
            </div>
          </div>
        </div>

        {/* Offers Table - Desktop */}
        <div className="hidden md:block pixel-window border-3 border-d3sk-border shadow-pixel overflow-hidden">
          <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg">
            <span className="text-pixel-xs font-pixel">ORDER LIST</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full pixel-table">
              <thead>
                <tr className="border-b-2 border-d3sk-border bg-d3sk-surface">
                  <th className="px-3 py-2 text-left text-pixel-xs font-pixel text-d3sk-green">ID</th>
                  <th className="px-3 py-2 text-left text-pixel-xs font-pixel text-d3sk-text">SELL</th>
                  <th className="px-3 py-2 text-left text-pixel-xs font-pixel text-d3sk-text">FOR</th>
                  <th className="px-3 py-2 text-left text-pixel-xs font-pixel text-d3sk-yellow">PRICE</th>
                  <th className="px-3 py-2 text-left text-pixel-xs font-pixel text-d3sk-muted">STATUS</th>
                  <th className="px-3 py-2 text-left text-pixel-xs font-pixel text-d3sk-muted">CREATED</th>
                  <th className="px-3 py-2 text-left text-pixel-xs font-pixel text-d3sk-muted">EXPIRES</th>
                  <th className="px-3 py-2 text-right text-pixel-xs font-pixel text-d3sk-muted">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-d3sk-border">
                {userOffers.map((offer) => {
                  const sellType = offer.sell_type || offer.sell_token_type
                  const askType = offer.ask_type || offer.ask_token_type
                  const sellTokenName = getTokenName(sellType)
                  const askTokenName = getTokenName(askType)
                  const price = (parseFloat(offer.sell_amount) / parseFloat(offer.ask_amount)).toFixed(6)
                  const isActive = offer.status === 'active'
                  const sellUsdPrice = usdPrices[sellTokenName] || 0
                  const sellUsdValue = (parseFloat(offer.sell_amount) * sellUsdPrice).toFixed(2)

                  return (
                    <tr key={offer.id} className="hover:bg-d3sk-surface/50 transition">
                      <td className="px-3 py-2 font-mono text-d3sk-green text-pixel-xs">#{offer.id}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-mono font-pixel text-d3sk-text text-pixel-xs">
                            {parseFloat(offer.sell_amount).toFixed(4)}
                          </span>
                          <span className="text-pixel-xs text-d3sk-text">{sellTokenName}</span>
                          <span className="text-pixel-xs text-d3sk-muted">(${sellUsdValue})</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-mono font-pixel text-d3sk-text text-pixel-xs">
                            {parseFloat(offer.ask_amount).toFixed(4)}
                          </span>
                          <span className="text-pixel-xs text-d3sk-text">{askTokenName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-d3sk-yellow text-pixel-xs">{price}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-2 py-1 text-pixel-xs font-pixel border ${
                            isActive
                              ? 'bg-d3sk-green/20 text-d3sk-green border-d3sk-green'
                              : offer.status === 'filled'
                                ? 'bg-d3sk-cyan/20 text-d3sk-cyan border-d3sk-cyan'
                                : 'bg-d3sk-red/20 text-d3sk-red border-d3sk-red'
                          }`}
                        >
                          {offer.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-d3sk-muted text-pixel-xs">{formatDate(offer.created_at)}</td>
                      <td className="px-3 py-2 text-pixel-xs">
                        {offer.expires_at ? (
                          <span className={`font-mono ${formatExpiration(offer.expires_at) === 'Expired' ? 'text-d3sk-red' : 'text-d3sk-yellow'}`}>
                            {formatExpiration(offer.expires_at)}
                          </span>
                        ) : (
                          <span className="text-d3sk-muted">∞</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {isActive ? (
                          <button
                            onClick={() => {
                              setCancellingId(offer.id)
                              setShowCancelConfirm(true)
                            }}
                            disabled={isProcessing}
                            className="btn-danger px-2 py-1 text-pixel-xs font-pixel shadow-pixel transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            CANCEL
                          </button>
                        ) : (
                          <span className="text-d3sk-muted text-pixel-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Offers Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {userOffers.map((offer) => {
            const sellType = offer.sell_type || offer.sell_token_type
            const askType = offer.ask_type || offer.ask_token_type
            const sellTokenName = getTokenName(sellType)
            const askTokenName = getTokenName(askType)
            const price = (parseFloat(offer.sell_amount) / parseFloat(offer.ask_amount)).toFixed(6)
            const isActive = offer.status === 'active'
            const sellUsdPrice = usdPrices[sellTokenName] || 0
            const sellUsdValue = (parseFloat(offer.sell_amount) * sellUsdPrice).toFixed(2)

            return (
              <div key={offer.id} className="pixel-window border-2 border-d3sk-accent shadow-pixel">
                <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg">
                  <span className="text-pixel-xs font-pixel">OFFER #{offer.id}</span>
                </div>
                <div className="pixel-window-body bg-d3sk-bg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono font-pixel text-d3sk-text text-pixel-xs"># {offer.id}</p>
                      <p className="text-pixel-xs text-d3sk-muted mt-1">{formatDate(offer.created_at)}</p>
                      {offer.expires_at && (
                        <p className={`text-pixel-xs mt-1 ${formatExpiration(offer.expires_at) === 'Expired' ? 'text-d3sk-red' : 'text-d3sk-yellow'}`}>
                          {formatExpiration(offer.expires_at)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-block px-2 py-1 text-pixel-xs font-pixel border ${
                        isActive
                          ? 'bg-d3sk-green/20 text-d3sk-green border-d3sk-green'
                          : offer.status === 'filled'
                            ? 'bg-d3sk-cyan/20 text-d3sk-cyan border-d3sk-cyan'
                            : 'bg-d3sk-red/20 text-d3sk-red border-d3sk-red'
                      }`}
                    >
                      {offer.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-d3sk-muted text-pixel-xs">SELL:</span>
                      <div className="text-right">
                        <p className="font-mono font-pixel text-d3sk-text text-pixel-xs">
                          {parseFloat(offer.sell_amount).toFixed(4)}
                        </p>
                        <p className="text-pixel-xs text-d3sk-text">{sellTokenName}</p>
                        <p className="text-pixel-xs text-d3sk-muted">(${sellUsdValue})</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-d3sk-muted text-pixel-xs">FOR:</span>
                      <div className="text-right">
                        <p className="font-mono font-pixel text-d3sk-text text-pixel-xs">
                          {parseFloat(offer.ask_amount).toFixed(4)}
                        </p>
                        <p className="text-pixel-xs text-d3sk-text">{askTokenName}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-d3sk-border">
                      <div className="flex justify-between items-center">
                        <span className="text-d3sk-muted text-pixel-xs">PRICE:</span>
                        <p className="font-mono text-d3sk-yellow text-pixel-xs">{price}</p>
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <button
                      onClick={() => {
                        setCancellingId(offer.id)
                        setShowCancelConfirm(true)
                      }}
                      disabled={isProcessing}
                      className="w-full btn-danger px-3 py-1 text-pixel-xs font-pixel shadow-pixel transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      CANCEL
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cancel Confirmation Modal - Pixel Window */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel max-w-sm w-full">
            <div className="pixel-window-title bg-d3sk-red text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">CANCEL OFFER</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-4">
              <p className="terminal-text text-d3sk-muted mb-4 text-pixel-xs">
                CANCEL OFFER #{cancellingId}? THIS CANNOT BE UNDONE.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCancelConfirm(false)
                    setCancellingId(null)
                  }}
                  className="flex-1 btn-secondary px-3 py-2 text-pixel-xs font-pixel shadow-pixel"
                >
                  KEEP
                </button>
                <button
                  onClick={handleCancelOffer}
                  className="flex-1 btn-danger px-3 py-2 text-pixel-xs font-pixel shadow-pixel"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel max-w-xs w-full">
            <div className="pixel-window-title bg-d3sk-yellow text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">PROCESSING</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-6 text-center">
              <div className="w-8 h-8 border-2 border-d3sk-green border-t-d3sk-yellow rounded-full animate-spin mx-auto mb-3"></div>
              <p className="font-pixel text-d3sk-text text-pixel-xs">CANCELLING OFFER...</p>
              <p className="terminal-text text-d3sk-muted text-pixel-xs mt-2">PLEASE WAIT FOR CONFIRMATION</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
