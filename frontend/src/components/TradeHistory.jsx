import React, { useEffect, useState } from 'react';

// Helper function to truncate addresses
const truncateAddress = (address, length = 6) => {
  if (!address) return 'Unknown';
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

// Helper function to get token name from token string
const getTokenName = (tokenString) => {
  if (!tokenString) return 'Unknown';
  // Extract token name from path like "A.0x123.TokenName"
  const parts = tokenString.split('.');
  return parts[parts.length - 1] || 'Unknown';
};

// Helper function to format price
const formatPrice = (amount, decimals = 4) => {
  if (!amount) return '0';
  const num = parseFloat(amount);
  return num.toFixed(decimals);
};

// Helper function to format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const TradeHistory = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/trades?limit=20');

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setTrades(data.trades || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch trades:', err);
        setError('Trade history unavailable');
        setTrades([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTrades, 30000);

    return () => clearInterval(interval);
  }, []);

  // Desktop Table View
  const DesktopTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-z3ro-border">
            <th className="text-left py-3 px-4 font-bold text-z3ro-accent text-sm">Trade ID</th>
            <th className="text-left py-3 px-4 font-bold text-z3ro-accent text-sm">Pair</th>
            <th className="text-right py-3 px-4 font-bold text-z3ro-accent text-sm">Price</th>
            <th className="text-right py-3 px-4 font-bold text-z3ro-accent text-sm">Amount</th>
            <th className="text-left py-3 px-4 font-bold text-z3ro-accent text-sm">Maker → Taker</th>
            <th className="text-left py-3 px-4 font-bold text-z3ro-accent text-sm">Time</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, index) => (
            <tr
              key={trade.id || index}
              className="border-b border-z3ro-border hover:bg-z3ro-surface transition-colors duration-200"
            >
              <td className="py-3 px-4 font-mono text-xs text-z3ro-muted">
                {truncateAddress(trade.id || trade.offer_id, 5)}
              </td>
              <td className="py-3 px-4 text-sm font-bold text-z3ro-text">
                {getTokenName(trade.sell_type)} / {getTokenName(trade.ask_type)}
              </td>
              <td className="py-3 px-4 font-mono text-sm text-z3ro-green text-right">
                {formatPrice(trade.price)}
              </td>
              <td className="py-3 px-4 font-mono text-sm text-z3ro-text text-right">
                {formatPrice(trade.sell_amount)}
              </td>
              <td className="py-3 px-4 text-xs text-z3ro-muted font-mono">
                <span className="text-z3ro-accent">{truncateAddress(trade.maker, 4)}</span>
                <span className="text-z3ro-border"> → </span>
                <span className="text-z3ro-green">{truncateAddress(trade.taker, 4)}</span>
              </td>
              <td className="py-3 px-4 text-sm text-z3ro-muted">
                {formatTime(trade.timestamp)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Mobile Card View
  const MobileCards = () => (
    <div className="space-y-4">
      {trades.map((trade, index) => (
        <div
          key={trade.id || index}
          className="glass-panel p-4 rounded-lg border border-z3ro-border"
        >
          <div className="space-y-3">
            {/* Header with ID and Time */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-z3ro-muted font-mono mb-1">Trade ID</p>
                <p className="font-mono text-sm text-z3ro-muted">
                  {truncateAddress(trade.id || trade.offer_id, 5)}
                </p>
              </div>
              <p className="text-sm text-z3ro-muted text-right">
                {formatTime(trade.timestamp)}
              </p>
            </div>

            {/* Pair and Price */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-z3ro-muted mb-1">Pair</p>
                <p className="font-bold text-z3ro-text">
                  {getTokenName(trade.sell_type)} / {getTokenName(trade.ask_type)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-z3ro-muted mb-1">Price</p>
                <p className="font-mono text-lg text-z3ro-green font-bold">
                  {formatPrice(trade.price)}
                </p>
              </div>
            </div>

            {/* Amount */}
            <div>
              <p className="text-xs text-z3ro-muted mb-1">Amount</p>
              <p className="font-mono text-sm text-z3ro-text">
                {formatPrice(trade.sell_amount)}
              </p>
            </div>

            {/* Parties */}
            <div className="bg-z3ro-surface rounded px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-z3ro-muted text-xs flex-shrink-0">From:</span>
                <span className="font-mono text-xs text-z3ro-accent truncate">
                  {truncateAddress(trade.maker, 4)}
                </span>
              </div>
              <span className="text-z3ro-border mx-2 flex-shrink-0">→</span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-z3ro-muted text-xs flex-shrink-0">To:</span>
                <span className="font-mono text-xs text-z3ro-green truncate">
                  {truncateAddress(trade.taker, 4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-z3ro-accent">Recent Trades</h2>
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-z3ro-green rounded-full animate-pulse"></div>
            <span className="text-sm text-z3ro-muted">Updating...</span>
          </div>
        )}
      </div>

      {/* Content */}
      {error ? (
        // Error State
        <div className="glass-panel p-12 rounded-lg text-center border border-z3ro-border glow-border">
          <div className="mb-4 text-4xl opacity-50">⚠️</div>
          <p className="text-z3ro-muted text-lg">{error}</p>
          <p className="text-z3ro-muted text-sm mt-2">Unable to connect to trade API</p>
        </div>
      ) : loading ? (
        // Loading State
        <div className="glass-panel p-12 rounded-lg text-center border border-z3ro-border">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-4 border-z3ro-border rounded-full border-t-z3ro-accent animate-spin"></div>
          </div>
          <p className="text-z3ro-muted">Loading trades...</p>
        </div>
      ) : trades.length === 0 ? (
        // Empty State
        <div className="glass-panel p-12 rounded-lg text-center border border-z3ro-border glow-border">
          <div className="mb-4 text-4xl opacity-50">📊</div>
          <p className="text-z3ro-muted text-lg">No trades yet</p>
          <p className="text-z3ro-muted text-sm mt-2">Create an offer to get started</p>
        </div>
      ) : (
        // Data States
        <>
          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden md:block glass-panel rounded-lg border border-z3ro-border overflow-hidden">
            <DesktopTable />
          </div>

          {/* Mobile Cards - Shown only on mobile */}
          <div className="md:hidden">
            <MobileCards />
          </div>

          {/* Footer Info */}
          <div className="mt-4 text-center text-sm text-z3ro-muted">
            Showing {trades.length} recent trades
          </div>
        </>
      )}
    </div>
  );
};

export default TradeHistory;
