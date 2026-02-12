import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { fcl, config } from '../config/fcl'
import { useWallet } from '../hooks/useWallet'
import { useOffers } from '../hooks/useOffers'
import { useTransactions } from '../hooks/useTransactions'
import { getTokenName, getTokenKeyFromType, getTokenConfig, TOKEN_REGISTRY, fetchAllTokenPrices } from '../config/tokens'
import { FLOW_NETWORK } from '../config/fcl'

function truncateAddress(addr) {
  if (!addr) return ''
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

export default function FillOffer() {
  const { offerId } = useParams()
  const navigate = useNavigate()
  const { user, connect } = useWallet()
  const { offers, loading: offersLoading } = useOffers()
  const { fillOffer, txStatus, txId, error: txError, resetTx } = useTransactions()

  const [offer, setOffer] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [usdPrices, setUsdPrices] = useState({})
  const [feeRate, setFeeRate] = useState(null) // null = loading

  useEffect(() => {
    if (offers.length > 0) {
      const found = offers.find((o) => String(o.id) === String(offerId))
      setOffer(found || null)
    }
  }, [offers, offerId])

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

  // Fetch protocol fee rate
  useEffect(() => {
    async function fetchFeeRate() {
      try {
        const rate = await fcl.query({
          cadence: `
            import D3SKOfferNFT from ${config.d3skOfferNFT}
            access(all) fun main(): UFix64 {
              return D3SKOfferNFT.feeRate
            }
          `,
        });
        setFeeRate(parseFloat(rate) || 0.003);
      } catch (err) {
        console.warn('Could not fetch fee rate, using default:', err);
        setFeeRate(0.003); // fallback
      }
    }
    fetchFeeRate();
  }, []);

  useEffect(() => {
    if (txStatus === 'sealed') {
      toast.success('Trade completed successfully!')
      setIsProcessing(false)
      setShowConfirm(false)
      setTimeout(() => {
        resetTx()
        navigate('/')
      }, 2000)
    } else if (txStatus === 'error') {
      toast.error(txError || 'Transaction failed')
      setIsProcessing(false)
    } else if (txStatus === 'pending') {
      setIsProcessing(true)
    }
  }, [txStatus, txError, resetTx, navigate])

  const handleFillOffer = async () => {
    if (!user || !offer) return

    try {
      setShowConfirm(false)
      const askType = offer.ask_type || offer.ask_token_type
      const sellType = offer.sell_type || offer.sell_token_type
      // In the NFT model, the holder is whoever currently owns the offer NFT.
      // Initially this is the maker. If the NFT was transferred, the registry
      // would need updating — for now, maker = holder.
      const holderAddr = offer.maker || offer.maker_address

      const paymentTokenKey = getTokenKeyFromType(askType)
      const receiveTokenKey = getTokenKeyFromType(sellType)
      const network = FLOW_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

      await fillOffer(holderAddr, parseInt(offerId), offer.ask_amount, paymentTokenKey, receiveTokenKey)
    } catch (err) {
      toast.error(err.message || 'Failed to fill offer')
      setIsProcessing(false)
    }
  }

  if (offersLoading) {
    return (
      <div className="min-h-screen bg-d3sk-bg flex items-center justify-center">
        <div className="text-center">
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel">
            <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">LOADING</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-6 text-center">
              <div className="w-8 h-8 border-2 border-d3sk-green border-t-d3sk-yellow rounded-full animate-spin mx-auto mb-3"></div>
              <p className="terminal-text text-d3sk-muted" style={{ fontSize: '12px' }}>LOADING OFFER DETAILS...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-d3sk-bg px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link to="/" className="text-d3sk-green hover:text-d3sk-yellow transition mb-6 block font-pixel text-pixel-xs">
            &lt; BACK
          </Link>
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel text-center">
            <div className="pixel-window-title bg-d3sk-red text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">NOT FOUND</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-8">
              <p className="terminal-text text-d3sk-muted mb-4" style={{ fontSize: '12px' }}>OFFER NOT FOUND</p>
              <Link
                to="/"
                className="inline-block btn-primary px-6 py-2 shadow-pixel font-pixel text-pixel-xs"
              >
                RETURN
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const askType = offer.ask_type || offer.ask_token_type
  const sellType = offer.sell_type || offer.sell_token_type
  const makerAddr = offer.maker || offer.maker_address

  const askTokenName = getTokenName(askType)
  const sellTokenName = getTokenName(sellType)
  const price = (parseFloat(offer.sell_amount) / parseFloat(offer.ask_amount)).toFixed(6)

  const askUsdPrice = usdPrices[askTokenName] || 0
  const sellUsdPrice = usdPrices[sellTokenName] || 0
  const payUsdValue = (parseFloat(offer.ask_amount) * askUsdPrice).toFixed(2)
  const receiveUsdValue = (parseFloat(offer.sell_amount) * sellUsdPrice).toFixed(2)

  return (
    <div className="min-h-screen bg-d3sk-bg px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-d3sk-green hover:text-d3sk-yellow transition mb-6 block font-pixel text-pixel-xs">
          &lt; BACK TO ORDERBOOK
        </Link>

        {/* Offer Details - Pixel Window */}
        <div className="pixel-window border-3 border-d3sk-cyan shadow-pixel mb-6">
          <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg">
            <span className="text-pixel-xs font-pixel">FILL ORDER #{offer.id}</span>
          </div>

          {/* Trade Pair - Monitor Panels */}
          <div className="pixel-window-body bg-d3sk-bg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {/* You Pay */}
              <div className="monitor-panel bg-d3sk-surface border-2 border-d3sk-red p-3">
                <div className="pixel-window-title bg-d3sk-red text-d3sk-bg mb-2">
                  <span className="text-pixel-xs font-pixel">YOU PAY</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-pixel text-d3sk-text" style={{ fontSize: '14px' }}>
                      {parseFloat(offer.ask_amount).toFixed(6)}
                    </span>
                  </div>
                  <p className="text-pixel-xs font-pixel text-d3sk-red">{askTokenName}</p>
                  <p className="text-pixel-xs text-d3sk-muted">(${payUsdValue})</p>
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-end justify-center pb-2">
                <span className="font-pixel text-d3sk-green" style={{ fontSize: '20px' }}>→</span>
              </div>

              {/* You Receive */}
              <div className="monitor-panel bg-d3sk-surface border-2 border-d3sk-green p-3">
                <div className="pixel-window-title bg-d3sk-green text-d3sk-bg mb-2">
                  <span className="text-pixel-xs font-pixel">YOU GET</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-pixel text-d3sk-text" style={{ fontSize: '14px' }}>
                      {parseFloat(offer.sell_amount).toFixed(6)}
                    </span>
                  </div>
                  <p className="text-pixel-xs font-pixel text-d3sk-green">{sellTokenName}</p>
                  <p className="text-pixel-xs text-d3sk-muted">(${receiveUsdValue})</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-d3sk-border mb-4"></div>

            {/* Details Grid - Terminal Style */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-pixel-xs">
              <div className="bg-d3sk-surface border border-d3sk-border p-2">
                <p className="text-d3sk-muted mb-0.5">PRICE</p>
                <p className="font-mono text-d3sk-text">
                  {price}
                </p>
              </div>
              <div className="bg-d3sk-surface border border-d3sk-border p-2">
                <p className="text-d3sk-muted mb-0.5">MAKER</p>
                <p className="font-mono text-d3sk-accent">{truncateAddress(makerAddr)}</p>
              </div>
              {offer.expires_at && (
                <div className="bg-d3sk-surface border border-d3sk-border p-2">
                  <p className="text-d3sk-muted mb-0.5">EXPIRES</p>
                  <p className={`font-mono ${
                    Date.now() / 1000 > offer.expires_at ? 'text-d3sk-red' : 'text-d3sk-yellow'
                  }`}>
                    {Date.now() / 1000 > offer.expires_at
                      ? 'EXPIRED'
                      : new Date(offer.expires_at * 1000).toLocaleString()
                    }
                  </p>
                </div>
              )}
              <div className="bg-d3sk-surface border border-d3sk-border p-2">
                <p className="text-d3sk-muted mb-0.5">FEE</p>
                <p className="font-mono text-d3sk-text">
                  {feeRate === null ? (
                    <span className="text-d3sk-muted">LOADING...</span>
                  ) : (
                    <>{(feeRate * 100).toFixed(1)}%</>
                  )}
                </p>
              </div>
            </div>

            {/* Fee Breakdown Window */}
            <div className="pixel-window border-2 border-d3sk-yellow shadow-pixel mb-4">
              <div className="pixel-window-title bg-d3sk-yellow text-d3sk-bg">
                <span className="text-pixel-xs font-pixel">FEE BREAKDOWN</span>
              </div>
              <div className="pixel-window-body bg-d3sk-bg p-3 text-pixel-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-d3sk-muted">ASK:</span>
                  <span className="font-mono text-d3sk-text">{parseFloat(offer.ask_amount).toFixed(6)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-d3sk-muted">FEE:</span>
                  <span className="font-mono text-d3sk-yellow">
                    {feeRate === null ? (
                      <span className="text-d3sk-muted">CALC...</span>
                    ) : (
                      <>{(parseFloat(offer.ask_amount) * feeRate).toFixed(6)}</>
                    )}
                  </span>
                </div>
                <div className="border-t border-d3sk-border pt-1 flex justify-between items-center font-pixel">
                  <span className="text-d3sk-green">TOTAL:</span>
                  <span className="font-mono text-d3sk-green">
                    {feeRate === null ? (
                      <span className="text-d3sk-muted">CALC...</span>
                    ) : (
                      <>{(parseFloat(offer.ask_amount) * (1 + feeRate)).toFixed(6)}</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zero-Custody Explanation */}
        <div className="pixel-window border-2 border-d3sk-green shadow-pixel mb-6">
          <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
            <span className="text-pixel-xs font-pixel">ATOMIC SETTLEMENT</span>
          </div>
          <div className="pixel-window-body bg-d3sk-bg p-3">
            <ul className="text-pixel-xs text-d3sk-text space-y-1">
              <li>• ONE TRANSACTION</li>
              <li>• NO DEPOSITS REQUIRED</li>
              <li>• NO INTERMEDIARY</li>
              <li>• PEER-TO-PEER ON FLOW</li>
            </ul>
          </div>
        </div>

        {/* Action Area */}
        <div className="pixel-window border-3 border-d3sk-accent shadow-pixel">
          <div className="pixel-window-title bg-d3sk-accent text-d3sk-bg">
            <span className="text-pixel-xs font-pixel">EXECUTE TRADE</span>
          </div>
          <div className="pixel-window-body bg-d3sk-bg p-4">
            {!user ? (
              <button
                onClick={connect}
                className="w-full btn-primary px-6 py-3 font-pixel text-pixel-sm shadow-pixel transition-all"
              >
                CONNECT WALLET
              </button>
            ) : (
              <>
                {offer.expires_at && Date.now() / 1000 > offer.expires_at && (
                  <div className="bg-d3sk-red/20 border-2 border-d3sk-red p-3 mb-4">
                    <p className="text-pixel-xs text-d3sk-red font-pixel">
                      EXPIRED - CANNOT FILL
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={isProcessing || feeRate === null || (offer.expires_at && Date.now() / 1000 > offer.expires_at)}
                  className="w-full btn-primary px-6 py-3 font-pixel text-pixel-sm shadow-pixel transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'EXECUTING...' : 'FILL THIS OFFER'}
                </button>

                {/* Confirmation Modal - Pixel Window */}
                {showConfirm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="pixel-window border-3 border-d3sk-border shadow-pixel max-w-sm w-full">
                      <div className="pixel-window-title bg-d3sk-yellow text-d3sk-bg">
                        <span className="text-pixel-xs font-pixel">CONFIRM TRADE</span>
                      </div>
                      <div className="pixel-window-body bg-d3sk-bg p-4">
                        <p className="terminal-text text-d3sk-muted mb-4 text-pixel-xs">
                          PAY <span className="font-mono font-pixel text-d3sk-yellow">{parseFloat(offer.ask_amount).toFixed(6)}</span>{' '}
                          <span className="text-d3sk-red">{askTokenName}</span> FOR{' '}
                          <span className="font-mono font-pixel text-d3sk-green">{parseFloat(offer.sell_amount).toFixed(6)}</span>{' '}
                          <span className="text-d3sk-green">{sellTokenName}</span>?
                        </p>
                        <div className="bg-d3sk-surface/50 border border-d3sk-border/50 p-2 mb-4">
                          <div className="flex justify-between items-center text-pixel-xs text-d3sk-muted mb-1">
                            <span>ASK:</span>
                            <span className="font-mono">{parseFloat(offer.ask_amount).toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between items-center text-pixel-xs text-d3sk-muted mb-1">
                            <span>FEE:</span>
                            <span className="font-mono">{(parseFloat(offer.ask_amount) * feeRate).toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between items-center text-pixel-xs font-pixel text-d3sk-green border-t border-d3sk-border/50 pt-1">
                            <span>TOTAL:</span>
                            <span className="font-mono">{(parseFloat(offer.ask_amount) * (1 + feeRate)).toFixed(6)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 btn-secondary px-4 py-2 font-pixel text-pixel-xs shadow-pixel"
                          >
                            CANCEL
                          </button>
                          <button
                            onClick={handleFillOffer}
                            className="flex-1 btn-primary px-4 py-2 font-pixel text-pixel-xs shadow-pixel"
                          >
                            CONFIRM
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction Status */}
                {isProcessing && (
                  <div className="mt-4 p-3 bg-d3sk-surface border-2 border-d3sk-border">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-d3sk-green border-t-d3sk-yellow rounded-full animate-spin"></div>
                      <div className="text-pixel-xs">
                        <p className="font-pixel text-d3sk-text">TRANSACTION IN PROGRESS</p>
                        {txId && (
                          <p className="text-d3sk-muted font-mono">{truncateAddress(txId)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {txStatus === 'sealed' && txId && (
                  <div className="mt-4 p-3 bg-d3sk-surface border-2 border-d3sk-green">
                    <div className="flex items-start gap-2">
                      <span className="text-d3sk-green font-pixel">✓</span>
                      <div>
                        <p className="font-pixel text-d3sk-green text-pixel-xs">TRADE COMPLETE!</p>
                        <a
                          href={`https://flowscan.org/transaction/${txId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-pixel-xs text-d3sk-cyan hover:text-d3sk-green transition mt-1 block"
                        >
                          VIEW ON FLOWSCAN →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
