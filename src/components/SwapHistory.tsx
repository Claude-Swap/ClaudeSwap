import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './SwapHistory.css'

interface SwapTransaction {
  signature: string
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  timestamp: number
  date: string
}

interface SwapHistoryProps {
  isOpen: boolean
  onClose: () => void
}

const SwapHistory = ({ isOpen, onClose }: SwapHistoryProps) => {
  const [transactions, setTransactions] = useState<SwapTransaction[]>([])

  useEffect(() => {
    if (isOpen) {
      loadTransactions()
    }
  }, [isOpen])

  // Handle Escape key press to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const loadTransactions = () => {
    try {
      const stored = localStorage.getItem('swapHistory')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Sort by date (newest first)
        const sorted = parsed.sort((a: SwapTransaction, b: SwapTransaction) => b.timestamp - a.timestamp)
        setTransactions(sorted)
      } else {
        setTransactions([])
      }
    } catch (error) {
      console.error('Failed to load swap history:', error)
      setTransactions([])
    }
  }

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all transaction history?')) {
      localStorage.removeItem('swapHistory')
      setTransactions([])
    }
  }

  const openOnSolscan = (signature: string) => {
    window.open(`https://solscan.io/tx/${signature}`, '_blank')
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="swap-history-overlay" onClick={onClose}>
      <div className="swap-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="swap-history-header">
          <h2>Swap History</h2>
          <div className="swap-history-actions">
            {transactions.length > 0 && (
              <button className="clear-history-button" onClick={clearHistory}>
                Clear
              </button>
            )}
            <button className="close-history-button" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="swap-history-content">
          {transactions.length === 0 ? (
            <div className="swap-history-empty">
              <div className="empty-icon">📋</div>
              <p>No swap history yet</p>
              <span>Your completed swaps will appear here</span>
            </div>
          ) : (
            <div className="swap-history-list">
              {transactions.map((tx, index) => (
                <div key={index} className="swap-history-item">
                  <div className="swap-history-item-header">
                    <div className="swap-history-tokens">
                      <span className="token-from">{tx.fromAmount} {tx.fromToken}</span>
                      <span className="swap-arrow-history">→</span>
                      <span className="token-to">{tx.toAmount} {tx.toToken}</span>
                    </div>
                    <span className="swap-history-date">{formatDate(tx.timestamp)}</span>
                  </div>
                  <div className="swap-history-item-footer">
                    <button 
                      className="view-transaction-button"
                      onClick={() => openOnSolscan(tx.signature)}
                    >
                      View on Solscan
                    </button>
                    <span className="swap-history-signature">
                      {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}

export default SwapHistory

// Function to save transaction to localStorage
export const saveSwapToHistory = (
  signature: string,
  fromToken: string,
  toToken: string,
  fromAmount: string,
  toAmount: string
) => {
  try {
    const stored = localStorage.getItem('swapHistory')
    const transactions: SwapTransaction[] = stored ? JSON.parse(stored) : []

    const newTransaction: SwapTransaction = {
      signature,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      timestamp: Date.now(),
      date: new Date().toISOString(),
    }

    transactions.push(newTransaction)
    
    // Limit history to last 100 transactions
    const limited = transactions.slice(-100)
    
    localStorage.setItem('swapHistory', JSON.stringify(limited))
  } catch (error) {
    console.error('Failed to save swap to history:', error)
  }
}

