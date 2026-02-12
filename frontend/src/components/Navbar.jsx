import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletButton from './WalletButton';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'TRADE', path: '/' },
    { label: 'CREATE', path: '/create' },
    { label: 'OFFERS', path: '/my-offers' },
    { label: 'GUIDE', path: '/how-it-works' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed top-[32px] left-0 right-0 z-50 bg-d3sk-surface border-b-3 border-d3sk-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo section - retro pixel style */}
          <Link
            to="/"
            className="flex items-center gap-3 group hover:drop-shadow-lg transition-all duration-200"
            style={{ textDecoration: 'none' }}
          >
            <div className="flex flex-col gap-0">
              {/* D3SK logo in pixel font with CRT glow */}
              <div
                className="font-pixel text-2xl font-bold text-d3sk-accent leading-none"
                style={{
                  textShadow: '0 0 10px rgba(0, 255, 65, 0.6), 0 0 20px rgba(0, 255, 65, 0.2)',
                  letterSpacing: '2px'
                }}
              >
                D3SK
              </div>
              {/* Tagline in retro font */}
              <p className="font-retro text-pixel-xs text-d3sk-accent leading-none">
                ZERO<span className="text-d3sk-text">.</span>CUSTODY
              </p>
            </div>
          </Link>

          {/* Desktop navigation - hidden on mobile */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  font-retro text-retro-base font-medium transition-all duration-200
                  relative px-2 py-1 border-2
                  ${
                    isActive(link.path)
                      ? 'text-d3sk-bg bg-d3sk-accent border-d3sk-accent shadow-pixel'
                      : 'text-d3sk-text border-d3sk-border hover:border-d3sk-accent hover:text-d3sk-accent'
                  }
                `}
                style={{
                  boxShadow: isActive(link.path) ? '4px 4px 0px #000' : 'none',
                  textDecoration: 'none'
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Desktop wallet button */}
            <div className="hidden md:block">
              <WalletButton />
            </div>

            {/* Mobile menu button - retro pixel style */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 font-pixel text-pixel-xs text-d3sk-accent border-2 border-d3sk-accent hover:bg-d3sk-accent hover:text-d3sk-bg transition-all duration-200"
              style={{ boxShadow: '2px 2px 0px #000' }}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? '✕' : '≡'}
            </button>
          </div>
        </div>

        {/* Mobile navigation - retro style */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t-3 border-d3sk-border bg-d3sk-surface">
            <div className="px-4 pt-4 pb-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    block px-3 py-2 font-retro text-retro-base font-medium
                    border-2 transition-all duration-200
                    ${
                      isActive(link.path)
                        ? 'bg-d3sk-accent text-d3sk-bg border-d3sk-accent'
                        : 'text-d3sk-text border-d3sk-border hover:border-d3sk-accent'
                    }
                  `}
                  style={{
                    textDecoration: 'none',
                    boxShadow: isActive(link.path) ? '2px 2px 0px #000' : 'none'
                  }}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile wallet button */}
              <div className="pt-2 border-t-2 border-d3sk-border mt-2">
                <WalletButton isMobile={true} />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
