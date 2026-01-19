import React from 'react'
import PriceChart from './PriceChart'
import TokenSelector from './TokenSelector'
import { Token } from './Swap'
import './DEX.css'

interface DEXProps {
  fromToken: Token | null
  toToken: Token | null
  onFromTokenChange: (token: Token | null) => void
  onToTokenChange: (token: Token | null) => void
}

const DEX: React.FC<DEXProps> = ({ fromToken, toToken, onFromTokenChange, onToTokenChange }) => {
  const handleSwapTokens = () => {
    const tempToken = fromToken
    onFromTokenChange(toToken)
    onToTokenChange(tempToken)
  }

  return (
    <main className="dex-page">
      <div className="container">
        <div className="dex-header">
          <h1 className="dex-title">Token Charts</h1>
          <p className="dex-subtitle">Real-time price data and market analytics</p>
        </div>

        <div className="dex-token-block">
          <div className="dex-token-section">
            <div className="dex-token-label">You pay</div>
            <TokenSelector
              selectedToken={fromToken}
              onSelect={(token) => onFromTokenChange(token)}
              label="Select"
            />
          </div>

          <button className="dex-swap-arrow" onClick={handleSwapTokens}>
            ⇅
          </button>

          <div className="dex-token-section">
            <div className="dex-token-label">You receive</div>
            <TokenSelector
              selectedToken={toToken}
              onSelect={(token) => onToTokenChange(token)}
              label="Select"
            />
          </div>
        </div>

        <div className="charts-grid">
          {fromToken && (
            <PriceChart
              tokenAddress={fromToken.address}
              tokenSymbol={fromToken.symbol}
              tokenName={fromToken.name}
            />
          )}
          {toToken && (
            <PriceChart
              tokenAddress={toToken.address}
              tokenSymbol={toToken.symbol}
              tokenName={toToken.name}
            />
          )}
          {!fromToken && !toToken && (
            <div className="no-charts-message">
              <p>Select tokens above to view their price charts.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default DEX

