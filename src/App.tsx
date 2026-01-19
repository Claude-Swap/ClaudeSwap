import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import './App.css'
import Swap, { Token } from './components/Swap'
import Header from './components/Header'
import Footer from './components/Footer'
import Toast from './components/Toast'
import Docs from './components/Docs'
import DEX from './components/DEX'

function App() {
  const { publicKey: _publicKey } = useWallet()
  const [toast, setToast] = useState({ message: '', isVisible: false })
  const [currentPage, setCurrentPage] = useState<'home' | 'docs' | 'dex'>('home')
  
  // Update grid height to cover all content up to footer
  useEffect(() => {
    const updateGridHeight = () => {
      const root = document.getElementById('root')
      const footer = document.querySelector('.footer')
      
      if (root) {
        let height: number
        
        if (footer) {
          // Calculate height up to footer
          const footerTop = footer.getBoundingClientRect().top + window.scrollY
          const rootTop = root.getBoundingClientRect().top + window.scrollY
          height = footerTop - rootTop
          
          // Ensure minimum height
          if (height < window.innerHeight) {
            height = window.innerHeight
          }
        } else {
          // Fallback: use full height if footer not found
          height = Math.max(
            root.scrollHeight,
            root.offsetHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight,
            document.body.scrollHeight,
            document.body.offsetHeight
          )
        }
        
        root.style.setProperty('--grid-height', `${height}px`)
      }
    }
    
    // Initial update with delay to ensure footer is rendered
    setTimeout(updateGridHeight, 100)
    
    // Update on resize
    window.addEventListener('resize', updateGridHeight)
    
    // Update on scroll (in case content changes)
    window.addEventListener('scroll', updateGridHeight, { passive: true })
    
    // Observe DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(updateGridHeight, 0)
    })
    const root = document.getElementById('root')
    if (root) {
      observer.observe(root, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        attributeFilter: ['style', 'class']
      })
    }
    
    return () => {
      window.removeEventListener('resize', updateGridHeight)
      window.removeEventListener('scroll', updateGridHeight)
      observer.disconnect()
    }
  }, [currentPage])
  
  // Default tokens: SOL and USDC
  const [fromToken, setFromToken] = useState<Token | null>({
    symbol: 'SOL',
    name: 'Wrapped SOL',
    address: 'So11111111111111111111111111111111111111112',
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    decimals: 9,
  })
  const [toToken, setToToken] = useState<Token | null>({
    symbol: 'USDC',
    name: 'USD Coin',
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    decimals: 6,
  })

  const handleWalletConnect = (_address: string) => {
    // Wallet connection is now handled by wallet adapter
    // This callback is kept for compatibility but may not be needed
  }

  const showToast = (message: string) => {
    setToast({ message, isVisible: true })
  }

  const hideToast = () => {
    setToast({ message: '', isVisible: false })
  }

  const handleNavClick = (page: 'home' | 'docs' | 'dex') => {
    setCurrentPage(page)
    // Scroll to top when switching pages
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'docs':
        return <Docs onNavClick={handleNavClick} key="docs" />
      case 'dex':
        return (
          <DEX 
            key="dex"
            fromToken={fromToken} 
            toToken={toToken}
            onFromTokenChange={setFromToken}
            onToTokenChange={setToToken}
          />
        )
      case 'home':
      default:
        return (
          <main className="main-content page-fade-in" key="home">
            <div className="container">
              <div className="hero-section">
                <div className="system-header">
                  <span className="system-id">SYSTEM_ID: CLAUDE SWAP V2.0 | STATUS: ONLINE</span>
                </div>
                <div className="hero-logo">
                  <img src="/logo.png" alt="Claude Swap" width={96} height={96} />
                </div>
                <h1 className="title">Claude Swap</h1>
                <p className="subtitle">AI-Powered Decentralized Swap Intelligence Platform V2.0</p>
                <div className="hero-features">
                  <span>MEV_PROTECTED</span>
                  <span>•</span>
                  <span>AI_ROUTING</span>
                  <span>•</span>
                  <span>BEST_PRICES</span>
                </div>
              </div>

              <div className="system-status">
                <h2 className="status-title">SYSTEM_STATUS</h2>
                <div className="status-grid">
                  <div className="status-item">
                    <span className="status-label">SWAP_ENGINE</span>
                    <span className="status-value online">ONLINE</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">PRICE_ORACLE</span>
                    <span className="status-value online">ONLINE</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">MEV_SHIELD</span>
                    <span className="status-value online">ONLINE</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">LIQUIDITY_SCAN</span>
                    <span className="status-value online">ONLINE</span>
                  </div>
                </div>
              </div>

              <div className="swap-section" id="swap-section">
                <div className="swap-header">
                  <h2>SWAP_TERMINAL</h2>
                  <span className="module-status">[ACTIVE]</span>
                </div>

                <Swap 
                  fromToken={fromToken}
                  toToken={toToken}
                  onFromTokenChange={setFromToken}
                  onToTokenChange={setToToken}
                  onShowToast={showToast}
                />
              </div>

              <div className="core-directives">
                <h2 className="directives-title">CORE_DIRECTIVES</h2>
                <div className="directives-grid">
                  <div className="directive-item">
                    <div className="directive-number">01 //</div>
                    <h3>MEV PROTECTION</h3>
                    <p>Advanced sandwich attack prevention. All transactions are routed through private mempool, ensuring your trades remain confidential until execution on-chain.</p>
                  </div>
                  <div className="directive-item">
                    <div className="directive-number">02 //</div>
                    <h3>AI ROUTE OPTIMIZATION</h3>
                    <p>Claude AI analyzes liquidity pools across Raydium, Orca, and 50+ Solana DEXs to find the most beneficial routes. Advanced algorithms ensure optimal price execution for every swap.</p>
                  </div>
                  <div className="directive-item">
                    <div className="directive-number">03 //</div>
                    <h3>TOKEN SUPPORT</h3>
                    <p>Universal SPL token compatibility. Swap any Solana token with instant price discovery, automatic routing, and slippage protection.</p>
                  </div>
                  <div className="directive-item">
                    <div className="directive-number">04 //</div>
                    <h3>SECURE ROUTING</h3>
                    <p>Private transaction routing protects from bot frontrunning while maintaining optimal execution speed. Zero-knowledge architecture ensures maximum privacy.</p>
                  </div>
                </div>
              </div>

            <div className="dex-charts-cta">
                <button 
                  className="dex-cta-button"
                  onClick={() => handleNavClick('dex')}
                >
                  MONITOR MARKETS →
                </button>
              </div>
            </div>
          </main>
        )
    }
  }

  return (
    <div className="app">
      <Header 
        onWalletConnect={handleWalletConnect} 
        onShowToast={showToast}
        onNavClick={handleNavClick}
        onGoSwap={() => {
          setCurrentPage('home')
          setTimeout(() => {
            document.getElementById('swap-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 50)
        }}
        currentPage={currentPage}
      />
      
      {renderPage()}
      
      <Footer onShowToast={showToast} />
      
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={hideToast} 
      />
    </div>
  )
}

export default App

