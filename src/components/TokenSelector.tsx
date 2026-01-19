import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './TokenSelector.css'
import type { Token } from './Swap'

interface TokenSelectorProps {
  selectedToken: Token | null
  onSelect: (token: Token) => void
  label: string
}

interface DataApiToken {
  id: string
  name: string
  symbol: string
  icon?: string
  decimals: number
}

// Helper function to get initials
const getInitials = (symbol: string) => {
  if (symbol.length >= 2) {
    return symbol.substring(0, 2).toUpperCase()
  }
  return symbol.charAt(0).toUpperCase()
}

// Helper component for token logo with fallback
const TokenLogoWithFallback = ({ token, size = 'normal' }: { token: Token; size?: 'normal' | 'small' }) => {
  const [imageError, setImageError] = useState(false)
  
  const logoClass = size === 'small' ? 'token-logo-small' : 'token-logo'
  const placeholderClass = size === 'small' ? 'token-logo-placeholder-small' : 'token-logo-placeholder'
  
  if (token.logo && !imageError) {
    return (
      <img 
        src={token.logo} 
        alt={token.symbol} 
        className={logoClass}
        onError={() => setImageError(true)}
      />
    )
  }
  
  return (
    <div className={placeholderClass}>{getInitials(token.symbol)}</div>
  )
}

const TokenSelector = ({ selectedToken, onSelect, label }: TokenSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Token[]>([])
  const [popularTokens, setPopularTokens] = useState<Token[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingPopular, setIsLoadingPopular] = useState(false)
  const [showPopular, setShowPopular] = useState(true)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load tokens when modal opens (using datapi.jup.ag)
  useEffect(() => {
    if (!isOpen) return

    const loadTokens = async () => {
      setIsLoadingPopular(true)
      try {
        // Call datapi.jup.ag with empty query to get tokens
        const response = await fetch('https://datapi.jup.ag/v1/assets/search?query=')
        
        if (!response.ok) {
          throw new Error('Failed to load tokens')
        }

        const data: DataApiToken[] = await response.json()
        
        // Map to Token format and take first 50 tokens
        const tokens: Token[] = data.slice(0, 50).map((token) => ({
          symbol: token.symbol,
          name: token.name,
          address: token.id,
          logo: token.icon,
          decimals: token.decimals,
        }))

        setPopularTokens(tokens)
      } catch (error) {
        console.error('Error loading tokens:', error)
        // Fallback to default tokens
        setPopularTokens([
          { symbol: 'SOL', name: 'Wrapped SOL', address: 'So11111111111111111111111111111111111111112', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', decimals: 9 },
          { symbol: 'USDC', name: 'USD Coin', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png', decimals: 6 },
        ])
      } finally {
        setIsLoadingPopular(false)
      }
    }

    loadTokens()
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setShowPopular(true)
      setSearchResults([])
      return
    }

    setShowPopular(false)
    setIsSearching(true)

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://datapi.jup.ag/v1/assets/search?query=${encodeURIComponent(searchQuery)}`
        )
        
        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data: DataApiToken[] = await response.json()
        
        const tokens: Token[] = data.map((token) => ({
          symbol: token.symbol,
          name: token.name,
          address: token.id,
          logo: token.icon,
          decimals: token.decimals,
        }))

        setSearchResults(tokens)
      } catch (error) {
        console.error('Error searching tokens:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [searchQuery])

  const handleSelect = (token: Token) => {
    onSelect(token)
    setIsOpen(false)
    setSearchQuery('')
    setShowPopular(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setSearchQuery('')
    setShowPopular(true)
    setSearchResults([])
  }

  const displayTokens = showPopular ? popularTokens : searchResults

  const modalContent = isOpen ? (
    <div className="dropdown-overlay" onClick={handleClose}>
      <div className="token-dropdown" onClick={(e) => e.stopPropagation()}>
        <div className="dropdown-header">
          <span>Select Token</span>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="search-container">
          <input
            ref={inputRef}
            type="text"
            className="token-search-input"
            placeholder="Search by name or symbol"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && <div className="search-loading">Searching...</div>}
        </div>

        <div className="token-list">
          {isLoadingPopular && showPopular && (
            <div className="no-results">Loading tokens...</div>
          )}
          
          {displayTokens.length === 0 && !isSearching && !isLoadingPopular && searchQuery.trim().length > 0 && (
            <div className="no-results">No tokens found</div>
          )}
          
          {displayTokens.length === 0 && !isSearching && !isLoadingPopular && searchQuery.trim().length === 0 && (
            <div className="no-results">No tokens available</div>
          )}
          
          {displayTokens.map((token) => (
            <button
              key={token.address}
              className={`token-option ${selectedToken?.address === token.address ? 'selected' : ''}`}
              onClick={() => handleSelect(token)}
              type="button"
            >
              <div className="token-info">
                <TokenLogoWithFallback token={token} size="normal" />
                <div className="token-details">
                  <span className="token-symbol">{token.symbol}</span>
                  <span className="token-name">{token.name}</span>
                  <span className="token-address">
                    {token.address.length > 10 
                      ? `${token.address.slice(0, 4)}...${token.address.slice(-4)}` 
                      : token.address}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  ) : null

  return (
    <div className="token-selector">
      <button
        className="token-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label={selectedToken ? `Selected token: ${selectedToken.symbol}. Click to change token.` : `Click to select ${label}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {selectedToken ? (
          <span className="selected-token">
            <TokenLogoWithFallback token={selectedToken} size="small" />
            <span className="token-symbol">{selectedToken.symbol}</span>
          </span>
        ) : (
          <span className="select-label">{label}</span>
        )}
        <span className="dropdown-arrow" aria-hidden="true">▼</span>
      </button>

      {typeof document !== 'undefined' && createPortal(modalContent, document.body)}
    </div>
  )
}

export default TokenSelector

