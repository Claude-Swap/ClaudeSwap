import React, { useState, useEffect } from 'react';
import './Docs.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/themes/prism-tomorrow.css';

// CodeBlock component using Prism.js
const CodeBlock: React.FC<{ children: string; language?: string }> = ({ children, language = 'javascript' }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [children]);

  return (
    <div className="code-block">
      <pre className={`language-${language}`}>
        <code className={`language-${language}`}>{children}</code>
      </pre>
    </div>
  );
};

type TabType = 'overview' | 'getting-started' | 'sdk' | 'faq';

interface DocsProps {
  onNavClick?: (page: 'home' | 'docs' | 'dex') => void
}

// Copy button component
const CopyButton: React.FC<{ text: string; onCopy: () => void }> = ({ text, onCopy }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      onCopy()
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button className="copy-button" onClick={handleCopy} title="Copy code">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
      </svg>
    </button>
  )
}

const Docs: React.FC<DocsProps> = ({ onNavClick }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCopyToast, setShowCopyToast] = useState(false)

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'sdk', label: 'SDK & Tools' },
    { id: 'faq', label: 'FAQ' },
  ];

  const sdkPackages = [
    {
      name: 'claude-swap-sdk',
      language: 'JavaScript/TypeScript',
      description: 'Full SDK (~10KB) featuring Jupiter integration, token helper functions, and single-line token exchanges.',
      install: 'npm install claude-swap-sdk',
      example: `import { ClaudeSwapSDK } from 'claude-swap-sdk';

// Initialize SDK
const sdk = new ClaudeSwapSDK();

// One-line MEV-protected swap
const result = await sdk.swap({
  inputToken: 'SOL',
  outputToken: 'USDC',
  amount: 1.5,
  wallet: myWallet
});`,
    },
  ];


  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="docs-tab-content" key="overview">
            <div className="docs-hero">
              <h1>AI-Powered Confidential Infrastructure<br />for Solana Network</h1>
              <p className="docs-hero-subtitle">
                Claude Swap provides secure decentralized exchange services for the Solana blockchain, powered by Claude AI to find the best routes across all DEXs. Built to safeguard users against MEV attacks while maintaining enterprise-level reliability and speed.
              </p>
              <p>
                Our decentralized exchange is fully functional on Solana mainnet. Claude AI continuously analyzes liquidity pools and routing options to find the most beneficial paths for your swaps. Execute trades with built-in MEV safeguards—ready to use immediately.
              </p>
            </div>

            <div className="docs-features-grid">
              <div className="docs-feature-card">
                <div className="feature-icon-large">
                  <img src="/thunder.png" alt="Lightning" width="64" height="64" />
                </div>
                <h3>Lightning Fast</h3>
                <p>Sub-second swaps with instant confirmation. No waiting! Under 100ms response time with 99.9% availability.</p>
              </div>
              <div className="docs-feature-card">
                <div className="feature-icon-large">
                  <img src="/lock.png" alt="Lock" width="64" height="64" />
                </div>
                <h3>MEV Protected</h3>
                <p>Professional-level safeguards protect your transactions against sandwich attacks, frontrunning attempts, and value extraction schemes.</p>
              </div>
              <div className="docs-feature-card">
                <div className="feature-icon-large">
                  <img src="/money-bag.png" alt="Money Bag" width="64" height="64" />
                </div>
                <h3>Zero Extra Fees</h3>
                <p>No markup, no hidden costs. You get the best market price, always. We aggregate liquidity from all leading exchanges.</p>
              </div>
              <div className="docs-feature-card">
                <h3>Claude AI Routing</h3>
                <p>Powered by Claude AI intelligence that continuously analyzes and finds the most beneficial routes across all DEXs. Our AI searches for optimal paths to maximize your swap value and minimize slippage.</p>
              </div>
            </div>

            <div className="docs-status-section">
              <h2>Current Status</h2>
              <div className="status-cards">
                <div className="status-card">
                  <div className="status-badge complete">
                    LIVE<span className="live-dot"></span>
                  </div>
                  <h3>Claude Swap DEX</h3>
                  <p>Our exchange platform is fully functional on Solana mainnet. Exchange tokens with built-in MEV safeguards immediately—no delays, no registration needed.</p>
                </div>
              </div>
            </div>

            <div className="docs-vision-section">
              <h2>Our Vision</h2>
              <p className="vision-quote"><strong>Confidentiality should come standard, not be optional.</strong></p>
              <p>
                Currently, every blockchain transaction is exposed to automated systems that siphon value from everyday users. We're transforming this reality. Claude Swap delivers MEV safeguards to all participants—from individual traders to enterprise platforms—via infrastructure that combines robust capabilities with intuitive usability.
              </p>
            </div>

            <div className="docs-vision-section">
              <h2>Claude AI Route Optimization</h2>
              <p>
                At the heart of Claude Swap is Claude AI, an intelligent routing system that continuously searches for the most beneficial swap routes across the entire Solana ecosystem. Unlike simple aggregators, Claude AI:
              </p>
              <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                <li>Analyzes real-time liquidity across all major DEXs</li>
                <li>Evaluates multiple routing paths simultaneously</li>
                <li>Finds optimal split routes to maximize output</li>
                <li>Minimizes slippage by identifying deep liquidity pools</li>
                <li>Considers fees and gas costs to ensure best net value</li>
                <li>Adapts to market conditions in real-time</li>
              </ul>
              <p style={{ marginTop: '1rem' }}>
                Every swap benefits from Claude AI's intelligent route discovery, ensuring you always get the best possible exchange rate available in the market.
              </p>
            </div>
          </div>
        );

      case 'getting-started':
        return (
          <div className="docs-tab-content" key="getting-started">
            <h1>Getting Started</h1>
            <p className="docs-intro">
              Start using Claude Swap in minutes. Choose the integration method that works best for your project.
            </p>

            <div className="getting-started-card">
              <div className="step-item">
                <div className="step-number-large">1</div>
                <div className="step-content-large">
                  <h3>Connect Your Wallet</h3>
                  <p>Connect your Solana wallet (Phantom, Solflare, or any compatible wallet) to the Claude Swap DEX interface.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number-large">2</div>
                <div className="step-content-large">
                  <h3>Select Tokens</h3>
                  <p>Choose the tokens you want to swap. Claude Swap supports all Solana SPL tokens and aggregates liquidity from multiple DEXs.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number-large">3</div>
                <div className="step-content-large">
                  <h3>Execute Swap</h3>
                  <p>Review the quote and execute your swap. Your transaction is automatically routed through MEV-protected infrastructure.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number-large">4</div>
                <div className="step-content-large">
                  <h3>Confirm & Done</h3>
                  <p>Confirm the transaction in your wallet. Your swap completes instantly with full MEV protection—no sandwich attacks, no frontrunning.</p>
                </div>
              </div>
            </div>

            <div className="integration-options">
              <h2>Ready to Trade?</h2>
              <div className="integration-grid">
                <div className="integration-card">
                  <h3>Start Trading Now</h3>
                  <p>Use the Claude Swap DEX directly in your browser. No integration needed—just connect your wallet and start trading with MEV protection.</p>
                  <button 
                    className="docs-action-button"
                    onClick={() => onNavClick?.('dex')}
                  >
                    Launch DEX →
                  </button>
                </div>
                <div className="integration-card">
                  <h3>For Developers</h3>
                  <p>Integrate Claude Swap into your application using our SDK packages. Build MEV-protected swaps directly into your dApp.</p>
                  <button 
                    className="docs-action-button"
                    onClick={() => setActiveTab('sdk')}
                  >
                    View SDK Docs →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );


      case 'sdk':
        return (
          <div className="docs-tab-content" key="sdk">
            <h1>SDK & Tools</h1>
            <p className="docs-intro">
              Claude Swap is available for multiple languages. Choose the SDK that fits your development stack.
            </p>

            {sdkPackages.map((pkg, idx) => (
              <div className="sdk-package-card" key={idx}>
                <div className="sdk-header">
                  <div>
                    <h3>{pkg.name}</h3>
                    <span className="sdk-language">{pkg.language}</span>
                  </div>
                </div>
                <p className="sdk-description">{pkg.description}</p>
                <div className="sdk-install-wrapper">
                  <div className="sdk-install">
                    <strong>Install:</strong>
                    <code className="install-code">{pkg.install}</code>
                    <CopyButton text={pkg.install} onCopy={handleCopy} />
                  </div>
                </div>
                <div className="code-block-wrapper">
                  <CodeBlock>{pkg.example}</CodeBlock>
                  <CopyButton text={pkg.example} onCopy={handleCopy} />
                </div>
              </div>
            ))}

            <div className="sdk-resources">
              <h2>Additional Resources</h2>
              <div className="resources-grid">
                <div className="resource-card">
                  <h4>Documentation</h4>
                  <p>Complete API reference and integration guides</p>
                </div>
                <div className="resource-card">
                  <h4>Examples</h4>
                  <p>Code samples and use cases for common scenarios</p>
                </div>
                <div className="resource-card">
                  <h4>Support</h4>
                  <p>Get help from our developer community</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="docs-tab-content" key="faq">
            <h1>Frequently Asked Questions</h1>
            <div className="faq-list">
              <div className="faq-item">
                <h3>Can I use Claude Swap right now?</h3>
                <p>
                  Yes! Claude Swap DEX is operational and active. Traders can utilize our DEX for MEV-safeguarded exchanges immediately—no registration needed.
                </p>
              </div>
              <div className="faq-item">
                <h3>What makes Claude Swap different?</h3>
                <p>
                  We're a Solana DEX provider constructing confidentiality-first from the foundation. While others incorporate MEV safeguards as an addition, it's fundamental to our entire approach. Claude AI powers our routing system, continuously finding the best routes and ensuring optimal execution across all DEXs. We've delivered a fully operational DEX that safeguards users today.
                </p>
              </div>
              <div className="faq-item">
                <h3>Are there any fees?</h3>
                <p>
                  Claude Swap has zero extra fees. No markup, no hidden costs. Claude AI finds the best routes and ensures optimal execution, so you get the best market price available, always. We only charge standard Solana network fees for transactions.
                </p>
              </div>
              <div className="faq-item">
                <h3>How does MEV protection work?</h3>
                <p>
                  Claude Swap employs sophisticated routing and transaction bundling methods to safeguard your transactions from MEV exploitation. Claude AI finds the best routes while ensuring your transactions travel through our MEV-safeguarded infrastructure, undetectable to automated systems. This combination of AI-powered routing and MEV protection ensures both optimal execution and maximum security.
                </p>
              </div>
              <div className="faq-item">
                <h3>How does Claude AI find the best routes?</h3>
                <p>
                  Claude AI continuously analyzes liquidity pools across all major Solana DEXs in real-time. It evaluates multiple routing paths, compares prices, calculates slippage, and identifies the most beneficial routes for your swaps. The AI considers factors like pool depth, fees, and optimal path splitting to ensure you get the best possible exchange rate. By finding the best routes and ensuring optimal execution, Claude AI maximizes your swap value while minimizing slippage and transaction costs.
                </p>
              </div>
              <div className="faq-item">
                <h3>Which tokens are supported?</h3>
                <p>
                  All Solana SPL tokens are supported. Claude AI consolidates liquidity from multiple exchanges, finds the best routes, and ensures optimal execution for optimal pricing across all supported tokens.
                </p>
              </div>
              <div className="faq-item">
                <h3>How fast are swaps?</h3>
                <p>
                  Exchanges complete in sub-second timeframes with immediate confirmation on Solana. Claude AI finds the best routes and ensures optimal execution in under 100ms response time with 99.9% availability, providing both speed and the best possible rates.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleCopy = () => {
    setShowCopyToast(true)
    setTimeout(() => setShowCopyToast(false), 2000)
  }

  return (
    <div className="docs-page">
      {showCopyToast && (
        <div className="copy-toast">
          Code copied
        </div>
      )}
      <div className="docs-container">
        <div className="docs-header-section">
          <h1 className="docs-main-title">Claude Swap Documentation</h1>
          <p className="docs-main-subtitle">Confidential Infrastructure for Solana Network</p>
        </div>

        <div className="docs-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`docs-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="docs-content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Docs;
