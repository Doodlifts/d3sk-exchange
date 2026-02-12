import React, { useState } from 'react'

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      number: '1',
      title: 'CREATE OFFER',
      description: 'Lock tokens in an Offer resource in YOUR account. Specify what token you want and how much.',
      icon: 'lock'
    },
    {
      number: '2',
      title: 'PUBLISH CAPABILITY',
      description: 'A fill capability is published so anyone can trigger the swap. They can execute but never steal.',
      icon: 'share'
    },
    {
      number: '3',
      title: 'TAKER FILLS',
      description: 'A counterparty sends payment. The Offer verifies the exact amount and type, deposits payment to you, and releases your tokens to the taker.',
      icon: 'exchange'
    },
    {
      number: '4',
      title: 'ATOMIC SETTLEMENT',
      description: 'Everything happens in one transaction. If any condition fails, the entire trade reverts. No partial fills. No stuck funds.',
      icon: 'check'
    }
  ]

  const whyOnlyCadence = [
    {
      title: 'RESOURCES CANNOT BE COPIED',
      description: 'Cadence resources are linear types. The Offer is a physical object in storage, not just a mapping entry.'
    },
    {
      title: 'CAPABILITIES GRANT EXECUTE-ONLY ACCESS',
      description: 'Counterparties can fill but never steal. There\'s no approve() pattern.'
    },
    {
      title: 'POST-CONDITIONS ARE COMPILER-ENFORCED',
      description: 'Settlement guarantees aren\'t just trust-the-code, they\'re language-level invariants.'
    },
    {
      title: 'NO CUSTODY TRANSFER NEEDED',
      description: 'In Solidity, approve() + DEX = custody. Cadence has no equivalent because it doesn\'t need one.'
    }
  ]

  const comparison = [
    { feature: 'TOKEN LOCATION', traditional: "Contract's vault", d3sk: 'Your wallet' },
    { feature: 'SETTLEMENT', traditional: 'Contract intermediary', d3sk: 'Peer-to-peer atomic' },
    { feature: 'EXPLOIT RISK', traditional: 'TVL can be drained', d3sk: 'No TVL to drain' },
    { feature: 'APPROVAL PATTERN', traditional: 'approve() required', d3sk: 'No approvals' },
    { feature: 'PARTIAL FILLS', traditional: 'Common', d3sk: 'None (V1)' }
  ]

  return (
    <div className="min-h-screen bg-d3sk-bg text-d3sk-text">
      {/* Hero Section - Large Pixel Title */}
      <section className="relative px-4 sm:px-6 md:px-12 py-12 md:py-20 overflow-hidden">
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="pixel-window border-4 border-d3sk-green shadow-pixel mb-8 inline-block">
            <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
              <span className="pixel-heading text-pixel-sm" style={{ fontSize: '14px' }}>D3SK PROTOCOL MANUAL</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-4">
              <h1 className="pixel-heading text-d3sk-green crt-glow" style={{ fontSize: '24px' }}>
                HOW D3SK WORKS
              </h1>
              <p className="terminal-text text-d3sk-cyan max-w-2xl mx-auto mt-3" style={{ fontSize: '12px' }}>
                THE FIRST ZERO-CUSTODY EXCHANGE. BUILT ON FLOW'S RESOURCE-ORIENTED ARCHITECTURE.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="px-4 sm:px-6 md:px-12 py-12 max-w-5xl mx-auto">
        <div className="pixel-window border-3 border-d3sk-red shadow-pixel mb-6">
          <div className="pixel-window-title bg-d3sk-red text-d3sk-bg">
            <span className="text-pixel-xs font-pixel">THE PROBLEM</span>
          </div>
          <div className="pixel-window-body bg-d3sk-bg p-6">
            <p className="terminal-text text-d3sk-text mb-4" style={{ fontSize: '12px', lineHeight: '1.6' }}>
              EVERY DECENTRALIZED EXCHANGE TODAY — AMM OR ORDER BOOK — REQUIRES DEPOSITING YOUR TOKENS INTO A SMART CONTRACT BEFORE TRADING. YOUR ASSETS SIT IN SOMEONE ELSE'S CODE. WHEN EXPLOITS HAPPEN, USER FUNDS ARE DRAINED BECAUSE THE FUNDS ARE THERE TO DRAIN.
            </p>

            {/* Simple Diagram */}
            <div className="bg-d3sk-surface border-2 border-d3sk-border rounded p-4 mt-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
                <div className="flex-1">
                  <div className="bg-d3sk-green/20 border border-d3sk-green p-3">
                    <p className="font-mono text-pixel-xs text-d3sk-green font-bold">USER</p>
                  </div>
                </div>
                <div className="text-d3sk-muted text-pixel-xs font-pixel">→</div>
                <div className="flex-1">
                  <div className="bg-d3sk-yellow/20 border border-d3sk-yellow p-3">
                    <p className="font-mono text-pixel-xs text-d3sk-yellow font-bold">DEPOSIT</p>
                  </div>
                </div>
                <div className="text-d3sk-muted text-pixel-xs font-pixel">→</div>
                <div className="flex-1">
                  <div className="bg-d3sk-red/20 border border-d3sk-red p-3">
                    <p className="font-mono text-pixel-xs text-d3sk-red font-bold">POOL</p>
                  </div>
                </div>
                <div className="text-d3sk-muted text-pixel-xs font-pixel">→</div>
                <div className="flex-1">
                  <div className="bg-d3sk-red/30 border border-d3sk-red p-3">
                    <p className="font-mono text-pixel-xs text-d3sk-red font-bold">RISK!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="px-4 sm:px-6 md:px-12 py-12 max-w-5xl mx-auto">
        <div className="pixel-window border-3 border-d3sk-green shadow-pixel mb-6">
          <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
            <span className="text-pixel-xs font-pixel">THE SOLUTION</span>
          </div>
          <div className="pixel-window-body bg-d3sk-bg p-6">
            <p className="terminal-text text-d3sk-text mb-4" style={{ fontSize: '12px', lineHeight: '1.6' }}>
              D3SK NEVER HOLDS YOUR TOKENS. EVER. WHEN YOU CREATE AN OFFER, YOUR TOKENS ARE LOCKED IN AN OFFER RESOURCE THAT LIVES IN YOUR ACCOUNT STORAGE. THE EXCHANGE IS JUST A BULLETIN BOARD — A MATCHMAKING LAYER THAT CONNECTS MAKERS AND TAKERS.
            </p>

            {/* Solution Diagram */}
            <div className="bg-d3sk-surface border-2 border-d3sk-border rounded p-4 mt-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
                <div className="flex-1">
                  <div className="bg-d3sk-green/20 border border-d3sk-green p-3">
                    <p className="font-mono text-pixel-xs text-d3sk-green font-bold">MAKER</p>
                  </div>
                </div>
                <div className="text-d3sk-muted text-pixel-xs font-pixel">→</div>
                <div className="flex-1">
                  <div className="bg-d3sk-cyan/20 border border-d3sk-cyan p-3">
                    <p className="font-mono text-pixel-xs text-d3sk-cyan font-bold">OFFER</p>
                    <p className="text-pixel-xs text-d3sk-muted mt-1">(IN WALLET)</p>
                  </div>
                </div>
                <div className="text-d3sk-muted text-pixel-xs font-pixel">→</div>
                <div className="flex-1">
                  <div className="bg-d3sk-yellow/20 border border-d3sk-yellow p-3">
                    <p className="font-mono text-pixel-xs text-d3sk-yellow font-bold">TAKER</p>
                  </div>
                </div>
                <div className="text-d3sk-muted text-pixel-xs font-pixel">→</div>
                <div className="flex-1">
                  <div className="bg-d3sk-green/20 border border-d3sk-green p-3">
                    <p className="font-mono text-pixel-xs text-d3sk-green font-bold">SWAP!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Step by Step */}
      <section className="px-4 sm:px-6 md:px-12 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="pixel-window border-3 border-d3sk-cyan shadow-pixel inline-block">
            <div className="pixel-window-title bg-d3sk-cyan text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">STEP BY STEP</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-3">
              <h2 className="pixel-heading text-d3sk-cyan" style={{ fontSize: '16px' }}>HOW IT WORKS</h2>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              onClick={() => setActiveStep(index)}
              className="pixel-window border-3 shadow-pixel cursor-pointer transition-all"
              style={{
                borderColor: activeStep === index ? '#00ff41' : '#3d3d5c',
                backgroundColor: activeStep === index ? 'rgba(0, 255, 65, 0.05)' : '#1a1a2e'
              }}
            >
              <div className="pixel-window-title" style={{
                backgroundColor: activeStep === index ? '#00ff41' : '#3d3d5c',
                color: activeStep === index ? '#0f0e17' : '#e8e8e8'
              }}>
                <span className="text-pixel-xs font-pixel">{step.number}. {step.title}</span>
              </div>
              <div className="pixel-window-body bg-d3sk-bg p-4">
                <p className="terminal-text text-d3sk-text" style={{ fontSize: '12px' }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Only Cadence Section */}
      <section className="px-4 sm:px-6 md:px-12 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="pixel-window border-3 border-d3sk-red shadow-pixel inline-block">
            <div className="pixel-window-title bg-d3sk-red text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">WHY CADENCE?</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-3">
              <h2 className="pixel-heading text-d3sk-red" style={{ fontSize: '16px' }}>WHY NOT ETHEREUM?</h2>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {whyOnlyCadence.map((item, index) => (
            <div key={index} className="pixel-window border-2 border-d3sk-accent shadow-pixel">
              <div className="pixel-window-title bg-d3sk-accent text-d3sk-bg">
                <span className="text-pixel-xs font-pixel">{item.title}</span>
              </div>
              <div className="pixel-window-body bg-d3sk-bg p-3">
                <p className="terminal-text text-d3sk-text" style={{ fontSize: '11px' }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 sm:px-6 md:px-12 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="pixel-window border-3 border-d3sk-yellow shadow-pixel inline-block">
            <div className="pixel-window-title bg-d3sk-yellow text-d3sk-bg">
              <span className="text-pixel-xs font-pixel">COMPARISON</span>
            </div>
            <div className="pixel-window-body bg-d3sk-bg p-3">
              <h2 className="pixel-heading text-d3sk-yellow" style={{ fontSize: '16px' }}>DEX VS D3SK</h2>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse pixel-table">
            <thead>
              <tr className="border-b-2 border-d3sk-border bg-d3sk-surface">
                <th className="text-left py-2 px-3 font-pixel text-pixel-xs text-d3sk-green">FEATURE</th>
                <th className="text-left py-2 px-3 font-pixel text-pixel-xs text-d3sk-muted">TRADITIONAL DEX</th>
                <th className="text-left py-2 px-3 font-pixel text-pixel-xs text-d3sk-green">D3SK</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-d3sk-border hover:bg-d3sk-surface/50 transition-colors"
                >
                  <td className="py-2 px-3 font-pixel text-pixel-xs text-d3sk-text">{row.feature}</td>
                  <td className="py-2 px-3 terminal-text text-pixel-xs text-d3sk-muted">{row.traditional}</td>
                  <td className="py-2 px-3 terminal-text text-pixel-xs text-d3sk-green">{row.d3sk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 md:px-12 py-12 max-w-4xl mx-auto text-center">
        <div className="pixel-window border-4 border-d3sk-green shadow-pixel">
          <div className="pixel-window-title bg-d3sk-green text-d3sk-bg">
            <span className="text-pixel-xs font-pixel">READY TO TRADE?</span>
          </div>
          <div className="pixel-window-body bg-d3sk-bg p-6">
            <p className="pixel-heading text-d3sk-green mb-4 crt-glow" style={{ fontSize: '16px' }}>START NOW</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="btn-primary px-6 py-2 font-pixel text-pixel-xs shadow-pixel hover:translate-y-0.5 transition-all">
                CREATE OFFER
              </button>
              <button className="btn-secondary px-6 py-2 font-pixel text-pixel-xs shadow-pixel hover:translate-y-0.5 transition-all">
                VIEW ORDERBOOK
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer spacing */}
      <div className="h-12"></div>
    </div>
  )
}

export default HowItWorks
