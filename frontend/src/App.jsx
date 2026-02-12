import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import OrderBook from './components/OrderBook'
import CreateOffer from './components/CreateOffer'
import FillOffer from './components/FillOffer'
import MyOffers from './components/MyOffers'
import HowItWorks from './components/HowItWorks'
import { FLOW_NETWORK } from './config/fcl'

export default function App() {
  return (
    <div className="min-h-screen bg-d3sk-bg relative overflow-hidden">
      {/* CRT Scanline overlay - creates retro monitor effect */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-30"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
          mixBlendMode: 'overlay'
        }}
      />

      {/* Pixel grid background - retro computer aesthetic */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '8px 8px'
        }}
      />

      <Navbar />

      <main className="relative z-10 pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<OrderBook />} />
            <Route path="/create" element={<CreateOffer />} />
            <Route path="/fill/:offerId" element={<FillOffer />} />
            <Route path="/my-offers" element={<MyOffers />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
          </Routes>
        </div>
      </main>

      {/* Status Bar - retro OS style footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-d3sk-surface border-t-3 border-d3sk-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-retro text-pixel-xs text-d3sk-muted leading-none">
            NETWORK: <span className="text-d3sk-accent">{FLOW_NETWORK.toUpperCase()}</span>
          </span>
          <span className="text-d3sk-border text-pixel-xs">|</span>
          <span className="font-retro text-pixel-xs text-d3sk-muted leading-none">
            STATUS: <span className="text-d3sk-accent">ONLINE</span>
          </span>
        </div>
        <div className="font-retro text-pixel-xs text-d3sk-muted leading-none">
          D3SK v1.0 <span className="text-d3sk-accent">■</span> ZERO CUSTODY
        </div>
      </footer>

      {/* Retro Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#e8e8e8',
            border: '3px solid #3d3d5c',
            borderRadius: '0px',
            fontFamily: '"VT323", monospace',
            fontSize: '20px',
            boxShadow: '4px 4px 0px #000000',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#00ff41', secondary: '#0f0e17' },
            style: {
              borderColor: '#00ff41',
              boxShadow: '4px 4px 0px #000000, 0 0 8px rgba(0, 255, 65, 0.3)'
            }
          },
          error: {
            iconTheme: { primary: '#ff0055', secondary: '#0f0e17' },
            style: {
              borderColor: '#ff0055',
              boxShadow: '4px 4px 0px #000000, 0 0 8px rgba(255, 0, 85, 0.3)'
            }
          },
          loading: {
            style: {
              borderColor: '#00e5ff',
              boxShadow: '4px 4px 0px #000000, 0 0 8px rgba(0, 229, 255, 0.3)'
            }
          }
        }}
      />
    </div>
  )
}
