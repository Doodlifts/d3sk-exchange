import React, { useState, useRef, useEffect, useMemo } from 'react'
import { TOKEN_REGISTRY, getAvailableTokenKeys } from '../config/tokens'
import { FLOW_NETWORK } from '../config/fcl'

export default function TokenSelect({ value, onChange, excludeToken }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)

  const availableTokenKeys = useMemo(() => getAvailableTokenKeys(FLOW_NETWORK), [])

  const filteredTokens = useMemo(() => {
    if (!search.trim()) return availableTokenKeys
    const q = search.toLowerCase()
    return availableTokenKeys.filter((key) => {
      const token = TOKEN_REGISTRY[key]
      return (
        key.toLowerCase().includes(q) ||
        token.label.toLowerCase().includes(q) ||
        token.contractName.toLowerCase().includes(q) ||
        (token.description || '').toLowerCase().includes(q)
      )
    })
  }, [search, availableTokenKeys])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isOpen])

  const selectedToken = TOKEN_REGISTRY[value]

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Token Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input-field w-full bg-d3sk-surface text-d3sk-text border-2 border-d3sk-border text-left flex items-center justify-between px-3 py-2.5 hover:border-d3sk-accent transition-colors font-retro text-retro-base"
      >
        <span>
          {selectedToken ? `${selectedToken.icon} ${selectedToken.label}` : value}
        </span>
        <span className="text-d3sk-muted ml-2">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-d3sk-surface border-2 border-d3sk-accent shadow-pixel max-h-80 overflow-hidden flex flex-col"
             style={{ minWidth: '220px' }}>
          {/* Search Input */}
          <div className="p-2 border-b border-d3sk-border">
            <input
              ref={searchRef}
              type="text"
              placeholder="SEARCH TOKEN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-d3sk-bg text-d3sk-text border border-d3sk-border px-3 py-2 outline-none focus:border-d3sk-cyan font-retro text-retro-sm"
            />
          </div>

          {/* Token List */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: '280px' }}>
            {filteredTokens.length === 0 ? (
              <div className="p-3 text-d3sk-muted text-center font-retro text-retro-sm">
                NO TOKENS FOUND
              </div>
            ) : (
              filteredTokens.map((key) => {
                const token = TOKEN_REGISTRY[key]
                const isSelected = key === value
                const isExcluded = key === excludeToken
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isExcluded}
                    onClick={() => {
                      onChange(key)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between transition-colors font-retro text-retro-sm ${
                      isExcluded
                        ? 'text-d3sk-muted/40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-d3sk-accent/20 text-d3sk-accent'
                        : 'text-d3sk-text hover:bg-d3sk-bg hover:text-d3sk-cyan cursor-pointer'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-retro-base">{token.icon}</span>
                      <span>{token.label}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {token.isStablecoin && (
                        <span className="text-d3sk-green/60">$</span>
                      )}
                      {token.description && (
                        <span className="text-d3sk-muted/60 text-retro-sm hidden sm:inline" style={{ fontSize: '14px' }}>
                          {token.description}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
