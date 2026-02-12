/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        d3sk: {
          bg: '#0f0e17',
          surface: '#1a1a2e',
          surfaceLight: '#232342',
          border: '#3d3d5c',
          borderLight: '#5a5a7a',
          accent: '#00ff41',
          accentDark: '#00cc33',
          cyan: '#00e5ff',
          red: '#ff0055',
          yellow: '#ffd700',
          purple: '#b24dff',
          orange: '#ff6b35',
          text: '#e8e8e8',
          muted: '#7a7a9e',
          green: '#00ff41',
        },
        // Keep z3ro aliases for backward compat during transition
        z3ro: {
          bg: '#0f0e17',
          surface: '#1a1a2e',
          border: '#3d3d5c',
          accent: '#00ff41',
          accentDark: '#00cc33',
          green: '#00ff41',
          red: '#ff0055',
          yellow: '#ffd700',
          purple: '#b24dff',
          text: '#e8e8e8',
          muted: '#7a7a9e',
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        retro: ['"VT323"', '"Courier New"', 'monospace'],
        mono: ['"VT323"', '"Courier New"', 'monospace'],
      },
      fontSize: {
        'pixel-xs': ['8px', { lineHeight: '16px' }],
        'pixel-sm': ['10px', { lineHeight: '16px' }],
        'pixel-base': ['12px', { lineHeight: '20px' }],
        'pixel-lg': ['14px', { lineHeight: '24px' }],
        'pixel-xl': ['16px', { lineHeight: '28px' }],
        'pixel-2xl': ['20px', { lineHeight: '32px' }],
        'pixel-3xl': ['24px', { lineHeight: '36px' }],
        'retro-sm': ['16px', { lineHeight: '20px' }],
        'retro-base': ['20px', { lineHeight: '28px' }],
        'retro-lg': ['24px', { lineHeight: '32px' }],
        'retro-xl': ['28px', { lineHeight: '36px' }],
        'retro-2xl': ['32px', { lineHeight: '40px' }],
        'retro-3xl': ['40px', { lineHeight: '48px' }],
      },
      spacing: {
        'px-2': '2px',
        'px-4': '4px',
        'px-8': '8px',
        'px-16': '16px',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      boxShadow: {
        'pixel': '4px 4px 0px #000000',
        'pixel-sm': '2px 2px 0px #000000',
        'pixel-accent': '4px 4px 0px #00cc33',
        'pixel-cyan': '4px 4px 0px #00b8cc',
        'pixel-inset': 'inset 2px 2px 0px rgba(255,255,255,0.1), inset -2px -2px 0px rgba(0,0,0,0.3)',
        'crt': '0 0 10px rgba(0,255,65,0.15), 0 0 40px rgba(0,255,65,0.05)',
        'crt-cyan': '0 0 10px rgba(0,229,255,0.15), 0 0 40px rgba(0,229,255,0.05)',
        'monitor': 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 2px rgba(0,255,65,0.2)',
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'pixel-bounce': 'pixelBounce 0.5s steps(4) infinite',
        'crt-on': 'crtOn 0.4s ease-out forwards',
        'typing': 'typing 2s steps(20) forwards',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%': { opacity: '0.97' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.98' },
        },
        pixelBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        crtOn: {
          '0%': { opacity: '0', transform: 'scaleY(0.01)' },
          '50%': { opacity: '0.5', transform: 'scaleY(0.5)' },
          '100%': { opacity: '1', transform: 'scaleY(1)' },
        },
        typing: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
      backgroundImage: {
        'pixel-grid': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'pixel-grid': '8px 8px',
      },
    },
  },
  plugins: [],
}
