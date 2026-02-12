import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useWallet } from '../hooks/useWallet'
import { useTransactions } from '../hooks/useTransactions'
import { FLOW_NETWORK } from '../config/fcl'
import { TOKEN_REGISTRY, ALL_TOKEN_KEYS, getTokenTypeId, getAvailableTokenKeys, fetchAllTokenPrices } from '../config/tokens'
import TokenSelect from './TokenSelect'
import { FLOW_NETWORK as currentNetwork } from '../config/fcl'

export default function CreateOffer() {
  const navigate = useNavigate();
  const { user, connect } = useWallet();
  const { createOffer, txStatus, txId, error, resetTx } = useTransactions();

  const [sellToken, setSellToken] = useState('FLOW');
  const [sellAmount, setSellAmount] = useState('');
  const [askToken, setAskToken] = useState('PYUSD');
  const [askAmount, setAskAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usdPrices, setUsdPrices] = useState({});
  const [expiration, setExpiration] = useState('0');

  const EXPIRATION_OPTIONS = [
    { value: '0', label: 'No Expiration', seconds: '0.0' },
    { value: '3600', label: '1 Hour', seconds: '3600.0' },
    { value: '21600', label: '6 Hours', seconds: '21600.0' },
    { value: '43200', label: '12 Hours', seconds: '43200.0' },
    { value: '86400', label: '1 Day', seconds: '86400.0' },
    { value: '259200', label: '3 Days', seconds: '259200.0' },
    { value: '604800', label: '1 Week', seconds: '604800.0' },
    { value: '2592000', label: '30 Days', seconds: '2592000.0' },
  ];

  // Get available tokens for current network
  const availableTokenKeys = useMemo(() => getAvailableTokenKeys(currentNetwork), []);

  // Fetch USD prices for all tokens
  useEffect(() => {
    async function fetchPrices() {
      const prices = await fetchAllTokenPrices();
      const flatPrices = {};
      for (const [label, data] of Object.entries(prices)) {
        flatPrices[label] = data.usd;
      }
      setUsdPrices(flatPrices);
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate price metrics and USD values
  const priceMetrics = useMemo(() => {
    const sell = parseFloat(sellAmount);
    const ask = parseFloat(askAmount);

    if (!sell || !ask || sell <= 0 || ask <= 0) {
      return null;
    }

    const price = ask / sell;
    const inversePrice = sell / ask;

    // Calculate USD values
    const sellUsd = sell * (usdPrices[sellToken] || 0);
    const askUsd = ask * (usdPrices[askToken] || 0);
    const priceUsd = askUsd / sell; // Price in USD terms per sellToken unit

    return {
      price: price.toFixed(8),
      inversePrice: inversePrice.toFixed(8),
      sellUsd: sellUsd.toFixed(2),
      askUsd: askUsd.toFixed(2),
      priceUsd: priceUsd.toFixed(2),
      isValid: true,
    };
  }, [sellAmount, askAmount, usdPrices, sellToken, askToken]);

  // Validation checks
  const isFormValid = useMemo(() => {
    const sell = parseFloat(sellAmount);
    const ask = parseFloat(askAmount);
    const sameToken = sellToken === askToken;
    return sell > 0 && ask > 0 && !isNaN(sell) && !isNaN(ask) && !sameToken;
  }, [sellAmount, askAmount, sellToken, askToken]);

  const isConnected = user?.loggedIn;
  const canSubmit =
    isConnected &&
    isFormValid &&
    !isSubmitting &&
    txStatus !== 'pending' &&
    txStatus !== 'submitted';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (sellToken === askToken) {
      toast.error('You cannot trade the same token');
      return;
    }

    if (!isFormValid) {
      toast.error('Please enter valid amounts');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    try {
      const askTokenTypeId = getTokenTypeId(askToken, FLOW_NETWORK);
      const selectedExpiration = EXPIRATION_OPTIONS.find(o => o.value === expiration);
      const duration = selectedExpiration ? selectedExpiration.seconds : '0.0';
      await createOffer(sellAmount, askTokenTypeId, askAmount, sellToken, askToken, duration);

      // Show success toast
      toast.success('Offer created successfully!', {
        duration: 5000,
      });

      // Redirect to order book after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Error creating offer:', err);
      toast.error(error || 'Failed to create offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSellAmount('');
    setAskAmount('');
    resetTx();
  };

  // Helper function to get token icon and label
  const getTokenDisplay = (tokenKey) => {
    const token = TOKEN_REGISTRY[tokenKey];
    return token ? `${token.icon} ${token.label}` : tokenKey;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-d3sk-bg p-4 sm:p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="pixel-window border-3 border-d3sk-border shadow-pixel text-center">
            <div className="pixel-window-title bg-d3sk-red text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">NOT CONNECTED</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-6">
              <h1 className="pixel-heading text-d3sk-green mb-3 crt-glow" style={{ fontSize: '20px' }}>CREATE OFFER</h1>
              <p className="terminal-text text-d3sk-text mb-6" style={{ fontSize: '12px' }}>
                YOUR TOKENS STAY IN YOUR WALLET
              </p>

              <div className="bg-d3sk-surface border-2 border-d3sk-border p-6 mb-6">
                <p className="terminal-text text-d3sk-text mb-4" style={{ fontSize: '12px' }}>
                  CONNECT WALLET TO CREATE OFFERS
                </p>
                <button
                  onClick={connect}
                  className="btn-primary px-6 py-3 font-pixel text-pixel-sm shadow-pixel"
                >
                  CONNECT WALLET
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-d3sk-bg p-4 sm:p-6">
      <div className="max-w-2xl mx-auto py-6">
        {/* Header */}
        <div className="pixel-window border-3 border-d3sk-border shadow-pixel mb-6">
          <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
            <span className="text-pixel-xs font-pixel">NEW ORDER TERMINAL</span>
          </div>
          <div className="pixel-window-body bg-d3sk-bg p-4">
            <h1 className="pixel-heading text-d3sk-green mb-2 crt-glow" style={{ fontSize: '20px' }}>CREATE OFFER</h1>
            <p className="terminal-text text-d3sk-text text-pixel-xs" style={{ fontSize: '10px' }}>
              YOUR TOKENS STAY IN YOUR WALLET
            </p>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="pixel-window border-3 border-d3sk-border shadow-pixel mb-6">
            {/* Window Title */}
          <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg mb-4">
            <span className="text-pixel-xs font-pixel">ORDER PARAMETERS</span>
          </div>

          {/* Token Pair Selection */}
          <div className="pixel-window-body bg-d3sk-bg p-4 space-y-4 mb-4">
            {/* Sell Token Section */}
            <div>
              <label className="block text-pixel-xs font-pixel text-d3sk-green mb-2">
                YOU SELL
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <TokenSelect
                    value={sellToken}
                    onChange={setSellToken}
                    excludeToken={askToken}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.00000001"
                    min="0"
                    placeholder="0.00000000"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    className="input-field w-full font-mono bg-d3sk-surface text-d3sk-text border-2 border-d3sk-border text-pixel-xs"
                    style={{ fontFamily: '"VT323"' }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-pixel-xs text-d3sk-muted">
                  {TOKEN_REGISTRY[sellToken]?.label || sellToken}
                </p>
                {priceMetrics && sellAmount && (
                  <p className="text-pixel-xs text-d3sk-yellow font-mono">
                    ${priceMetrics.sellUsd}
                  </p>
                )}
              </div>
            </div>

            {/* Swap Icon */}
            <div className="flex justify-center">
              <button
                type="button"
                className="bg-d3sk-surface border-2 border-d3sk-accent p-2 hover:bg-d3sk-accent hover:text-d3sk-bg transition-colors cursor-pointer shadow-pixel"
                onClick={() => {
                  setSellToken(askToken)
                  setAskToken(sellToken)
                }}
              >
                <span className="pixel-heading text-pixel-xs" style={{ fontSize: '10px' }}>⇅</span>
              </button>
            </div>

            {/* Ask Token Section */}
            <div>
              <label className="block text-pixel-xs font-pixel text-d3sk-cyan mb-2">
                YOU WANT
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <TokenSelect
                    value={askToken}
                    onChange={setAskToken}
                    excludeToken={sellToken}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.00000001"
                    min="0"
                    placeholder="0.00000000"
                    value={askAmount}
                    onChange={(e) => setAskAmount(e.target.value)}
                    className="input-field w-full font-mono bg-d3sk-surface text-d3sk-text border-2 border-d3sk-border text-pixel-xs"
                    style={{ fontFamily: '"VT323"' }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-pixel-xs text-d3sk-muted">
                  {TOKEN_REGISTRY[askToken]?.label || askToken}
                </p>
                {priceMetrics && askAmount && (
                  <p className="text-pixel-xs text-d3sk-yellow font-mono">
                    ${priceMetrics.askUsd}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Expiration Duration */}
          <div className="mb-4">
            <label className="block text-pixel-xs font-pixel text-d3sk-yellow mb-2">
              EXPIRATION
            </label>
            <select
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              className="input-field w-full bg-d3sk-surface text-d3sk-text border-2 border-d3sk-border text-pixel-xs"
              style={{ fontFamily: '"VT323"' }}
            >
              {EXPIRATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-pixel-xs text-d3sk-muted mt-1">
              {expiration === '0'
                ? 'NEVER EXPIRES'
                : 'AUTO DESTROY ON EXPIRATION'}
            </p>
          </div>

          {/* Same Token Warning */}
          {sellToken === askToken && (
            <div className="bg-d3sk-red/20 border-2 border-d3sk-red p-3 mb-4">
              <p className="text-pixel-xs text-d3sk-red font-pixel">
                ERROR: SAME TOKEN
              </p>
            </div>
          )}

          {/* Auto-calculated Price Display - Monitor Panel */}
          {priceMetrics && (
            <div className="monitor-panel bg-d3sk-surface border-2 border-d3sk-cyan p-3 mb-4">
              <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg mb-2">
                <span className="text-pixel-xs font-pixel">PRICE MONITOR</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-pixel-xs text-d3sk-muted">PRICE:</span>
                  <span className="font-mono text-d3sk-text text-pixel-xs">
                    {priceMetrics.price}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-pixel-xs text-d3sk-muted">USD:</span>
                  <span className="font-mono text-d3sk-yellow text-pixel-xs">
                    ${priceMetrics.priceUsd}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-pixel-xs text-d3sk-muted">INVERSE:</span>
                  <span className="font-mono text-d3sk-text text-pixel-xs">
                    {priceMetrics.inversePrice}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Summary Panel */}
          {isFormValid && (
            <div className="space-y-3 mb-4">
              {/* Offer Summary */}
              <div className="bg-d3sk-surface border-2 border-d3sk-green p-3">
                <p className="text-pixel-xs text-d3sk-muted mb-1">OFFER SUMMARY</p>
                <p className="terminal-text text-d3sk-text text-pixel-xs">
                  {sellAmount} {TOKEN_REGISTRY[sellToken]?.label} FOR {askAmount}{' '}
                  {TOKEN_REGISTRY[askToken]?.label}
                </p>
                {priceMetrics && (
                  <p className="text-pixel-xs text-d3sk-muted mt-1">
                    ${priceMetrics.sellUsd} → ${priceMetrics.askUsd}
                  </p>
                )}
                {expiration !== '0' && (
                  <p className="text-pixel-xs text-d3sk-yellow mt-1">
                    EXP: {EXPIRATION_OPTIONS.find(o => o.value === expiration)?.label || 'N/A'}
                  </p>
                )}
              </div>

              {/* Zero-Custody Reminder */}
              <div className="bg-d3sk-green/20 border-2 border-d3sk-green p-3">
                <p className="font-pixel text-d3sk-green text-pixel-xs mb-1">SAFE MODE</p>
                <p className="text-pixel-xs text-d3sk-green/80">
                  TOKENS LOCKED IN YOUR WALLET. NO CONTRACT CUSTODY.
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && txStatus === 'error' && (
            <div className="bg-d3sk-red/20 border-2 border-d3sk-red p-3 mb-4">
              <p className="text-pixel-xs text-d3sk-red mb-2">{error}</p>
              <button
                type="button"
                onClick={handleReset}
                className="text-pixel-xs btn-secondary px-3 py-1 shadow-pixel"
              >
                RETRY
              </button>
            </div>
          )}

          {/* Transaction Status Display */}
          {txStatus && txStatus !== 'error' && (
            <div className="monitor-panel bg-d3sk-surface border-2 border-d3sk-cyan p-3 mb-4">
              <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg mb-2">
                <span className="text-pixel-xs font-pixel">TRANSMIT LOG</span>
              </div>
              <div className="space-y-2 text-pixel-xs">
                <div className="flex items-center gap-2">
                  <span className={`${
                    txStatus === 'pending' || txStatus === 'submitted' || txStatus === 'sealed'
                      ? 'text-d3sk-yellow'
                      : 'text-d3sk-green'
                  }`}>●</span>
                  <span className="text-d3sk-text">
                    {txStatus === 'pending' || txStatus === 'submitted' ? 'CREATING...' : 'CREATED'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`${
                    txStatus === 'sealed' ? 'text-d3sk-green' : 'text-d3sk-muted'
                  }`}>●</span>
                  <span className={txStatus === 'sealed' ? 'text-d3sk-green' : 'text-d3sk-muted'}>
                    {txStatus === 'sealed' ? 'CONFIRMED' : 'CONFIRMING...'}
                  </span>
                </div>

                {/* Transaction ID */}
                {txId && (
                  <div className="pt-1 border-t border-d3sk-border">
                    <p className="text-pixel-xs text-d3sk-muted mb-0.5">TX ID:</p>
                    <a
                      href={`https://flowscan.org/transaction/${txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pixel-xs text-d3sk-cyan hover:text-d3sk-green font-mono truncate block"
                    >
                      {txId}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success State */}
          {txStatus === 'sealed' && (
            <div className="bg-d3sk-green/20 border-2 border-d3sk-green p-3 mb-4">
              <p className="font-pixel text-d3sk-green text-pixel-xs mb-2">SUCCESS!</p>
              <p className="text-pixel-xs text-d3sk-green/80 mb-2">
                OFFER IS LIVE ON THE ORDERBOOK
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-pixel-xs btn-secondary px-3 py-1 shadow-pixel"
              >
                VIEW ORDERBOOK
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-2 font-pixel text-pixel-xs transition-all shadow-pixel ${
              canSubmit
                ? 'btn-primary hover:translate-y-0.5'
                : 'bg-d3sk-border text-d3sk-muted cursor-not-allowed'
            }`}
          >
            {!isConnected
              ? 'CONNECT WALLET'
              : isSubmitting || txStatus === 'pending' || txStatus === 'submitted'
              ? txStatus === 'pending'
                ? 'CREATING...'
                : 'CONFIRMING...'
              : txStatus === 'sealed'
              ? 'CREATED!'
              : 'EXECUTE ORDER'}
          </button>
        </form>

        {/* Additional Info */}
        <div className="pixel-window border-2 border-d3sk-border shadow-pixel">
          <div className="pixel-window-title bg-d3sk-yellow text-d3sk-bg">
            <span className="text-pixel-xs font-pixel">README</span>
          </div>
          <div className="pixel-window-body bg-d3sk-bg p-3 text-pixel-xs text-d3sk-text">
            <p className="mb-2 font-pixel">HOW IT WORKS:</p>
            <ul className="space-y-0.5 text-pixel-xs text-d3sk-muted">
              <li>1. TOKENS LOCKED IN WALLET</li>
              <li>2. VISIBLE ON ORDERBOOK</li>
              <li>3. ATOMIC SWAP ON FILL</li>
              <li>4. CANCEL ANYTIME</li>
              <li>5. ANY FLOW TOKEN PAIR</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
