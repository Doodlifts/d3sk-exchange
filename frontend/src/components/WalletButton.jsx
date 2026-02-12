import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';

const WalletButton = ({ isMobile = false }) => {
  const { user, loading, connect, disconnect } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [blinkState, setBlinkState] = useState(true);

  // Blink animation for loading state
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setBlinkState(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleClick = async () => {
    if (user?.loggedIn) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      await connect();
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsDropdownOpen(false);
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return (
      <button
        disabled
        className="px-3 py-2 font-retro text-retro-base border-2 border-d3sk-accent bg-d3sk-surface text-d3sk-accent"
        style={{
          boxShadow: '3px 3px 0px #000',
          opacity: blinkState ? 1 : 0.7,
          transition: 'opacity 0.3s'
        }}
      >
        <span>CONNECTING</span>
        <span style={{ animation: 'blink 1s infinite' }}>...</span>
      </button>
    );
  }

  if (user?.loggedIn) {
    return (
      <div className="relative">
        <button
          onClick={handleClick}
          className="px-3 py-2 font-retro text-retro-base border-2 border-d3sk-accent text-d3sk-text bg-d3sk-surface hover:bg-d3sk-border transition-all duration-200"
          style={{
            boxShadow: '3px 3px 0px #000',
            textDecoration: 'none'
          }}
        >
          <span style={{ marginRight: '6px' }}>▶</span>
          {isMobile ? 'WALLET' : truncateAddress(user.addr)}
          <span style={{ marginLeft: '6px' }}>{isDropdownOpen ? '▼' : '▶'}</span>
        </button>

        {/* Dropdown menu - pixel window style */}
        {isDropdownOpen && (
          <div
            className="absolute top-full right-0 mt-2 w-56 bg-d3sk-surface border-3 border-d3sk-border z-50 overflow-hidden"
            style={{ boxShadow: '4px 4px 0px #000' }}
          >
            {/* Window title bar */}
            <div className="bg-d3sk-accent text-d3sk-bg px-3 py-1 flex items-center justify-between">
              <span className="font-retro text-pixel-xs leading-none">WALLET.SYS</span>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="text-d3sk-bg hover:text-d3sk-border font-pixel text-pixel-xs"
              >
                ✕
              </button>
            </div>

            {/* Address section */}
            <div className="p-3 border-b-2 border-d3sk-border">
              <p className="font-retro text-pixel-xs text-d3sk-muted mb-1 leading-none">
                ADDR:
              </p>
              <p className="font-retro text-retro-base text-d3sk-accent break-all leading-none">
                {user.addr}
              </p>
            </div>

            {/* Copy address button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(user.addr);
                setIsDropdownOpen(false);
              }}
              className="w-full px-3 py-2 text-left font-retro text-retro-base text-d3sk-text border-b-2 border-d3sk-border hover:bg-d3sk-accent hover:text-d3sk-bg transition-all duration-200"
              style={{ textDecoration: 'none' }}
            >
              <span style={{ marginRight: '4px' }}>■</span>COPY
            </button>

            {/* Disconnect button */}
            <button
              onClick={handleDisconnect}
              className="w-full px-3 py-2 text-left font-retro text-retro-base text-d3sk-red hover:bg-d3sk-red hover:text-d3sk-bg transition-all duration-200"
              style={{ textDecoration: 'none' }}
            >
              <span style={{ marginRight: '4px' }}>✕</span>EXIT
            </button>
          </div>
        )}

        {/* Click outside handler */}
        {isDropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </div>
    );
  }

  // Disconnected state
  return (
    <button
      onClick={handleClick}
      className="px-3 py-2 font-pixel text-pixel-xs border-2 border-d3sk-accent bg-d3sk-accent text-d3sk-bg hover:translate-x-0.5 hover:translate-y-0.5 transition-transform duration-100"
      style={{
        boxShadow: '3px 3px 0px #000',
        textDecoration: 'none'
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.boxShadow = '1px 1px 0px #000';
        e.currentTarget.style.transform = 'translate(2px, 2px)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.boxShadow = '3px 3px 0px #000';
        e.currentTarget.style.transform = 'translate(0, 0)';
      }}
    >
      CONNECT
    </button>
  );
};

export default WalletButton;
