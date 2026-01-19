import { useState, useEffect, useRef, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  VersionedTransaction, 
  TransactionMessage, 
  AddressLookupTableAccount,
  PublicKey,
  TransactionInstruction
} from '@solana/web3.js'
import { Buffer } from 'buffer'
import './Swap.css'
import TokenSelector from './TokenSelector'
import SwapHistory, { saveSwapToHistory } from './SwapHistory'

// Make Buffer available globally
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer
}

export interface Token {
  symbol: string
  name: string
  address: string
  logo?: string
  decimals?: number
}

interface SwapProps {
  fromToken: Token | null
  toToken: Token | null
  onFromTokenChange: (token: Token | null) => void
  onToTokenChange: (token: Token | null) => void
  onShowToast?: (message: string) => void
}

const Swap = ({ fromToken, toToken, onFromTokenChange, onToTokenChange, onShowToast }: SwapProps) => {
  const { publicKey, connected, signTransaction } = useWallet()
  const [fromAmount, setFromAmount] = useState<string>('')
  const [toAmount, setToAmount] = useState<string>('0.0')
  const [isSwapping, setIsSwapping] = useState(false)
  const [isGettingQuote, setIsGettingQuote] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quoteResponse, setQuoteResponse] = useState<any>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    // Reset toAmount when user changes input
    if (!value || value === '') {
      setToAmount('0.0')
      setQuoteResponse(null)
      setError(null)
      return
    }
    setError(null)
  }

  const getQuote = useCallback(async () => {
    if (!fromToken || !toToken || !fromAmount) {
      setError('Please select tokens and enter an amount')
      return
    }

    const numAmount = parseFloat(fromAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsGettingQuote(true)
    setError(null)

    try {
      // Convert amount to smallest unit (lamports/microUSDC) based on token decimals
      const amountInSmallestUnit = Math.floor(numAmount * Math.pow(10, fromToken.decimals || 9))
      
      // Use our API which calls Jupiter
      const response = await fetch(
        `/api/getquote?inputMint=${fromToken.address}&outputMint=${toToken.address}&amount=${amountInSmallestUnit}&slippageBps=50&maxAccounts=40&onlyDirectRoutes=true`
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get quote')
      }

      const data = await response.json()
      
      // Convert outAmount from smallest unit to readable format
      const outAmount = parseFloat(data.outAmount)
      const toTokenDecimals = toToken.decimals || 6
      const readableAmount = (outAmount / Math.pow(10, toTokenDecimals)).toFixed(6)
      
      setToAmount(readableAmount)
      // Save the entire quote response for swap-instructions request
      setQuoteResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quote')
      setToAmount('0.0')
      setQuoteResponse(null)
    } finally {
      setIsGettingQuote(false)
    }
  }, [fromToken, toToken, fromAmount])

  // Auto-fetch quote when amount, fromToken, or toToken changes
  useEffect(() => {
    // Clear any pending quote request
    if (quoteTimeoutRef.current) {
      clearTimeout(quoteTimeoutRef.current)
    }

    // Don't fetch if conditions aren't met
    if (!fromToken || !toToken || !fromAmount) {
      return
    }

    const numAmount = parseFloat(fromAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return
    }

    // Debounce: wait 500ms after user stops typing
    quoteTimeoutRef.current = setTimeout(() => {
      getQuote()
    }, 500)

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (quoteTimeoutRef.current) {
        clearTimeout(quoteTimeoutRef.current)
      }
    }
  }, [fromAmount, fromToken, toToken, getQuote])

  const handleSwap = async () => {
    if (!publicKey || !quoteResponse || !signTransaction) {
      setError('Missing required information for swap')
      return
    }

    setIsSwapping(true)
    setError(null)

    // Use relative path /api
    const API_BASE = ''

    try {
      // Get swap-instructions through our API (which calls Jupiter)
      const swapInstructionsResponse = await fetch(`${API_BASE}/api/swap/instructions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: publicKey.toString(),
        }),
      })

      if (!swapInstructionsResponse.ok) {
        const errorData = await swapInstructionsResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to get swap instructions: ${swapInstructionsResponse.statusText}`)
      }

      const swapInstructionsData = await swapInstructionsResponse.json()
      console.log('Swap instructions received:', swapInstructionsData)

      // Use ready transaction (swapTransaction)
      // API returns fully ready transaction that should be used as is
      let transaction: VersionedTransaction

      if (swapInstructionsData.swapTransaction) {
        // Use ready transaction without changes
        // Transaction already contains everything including blockhash
        const transactionBuffer = Buffer.from(swapInstructionsData.swapTransaction, 'base64')
        transaction = VersionedTransaction.deserialize(transactionBuffer)
        console.log('Using ready transaction from Jupiter')
      } else {
        // Get blockhash - either from API response or from RPC
        let blockhash: string

        // Always get current blockhash from RPC
        const blockhashResponse = await fetch(`${API_BASE}/api/rpc/blockhash`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            commitment: 'confirmed',
          }),
        })

        if (!blockhashResponse.ok) {
          const errorData = await blockhashResponse.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to get blockhash: ${blockhashResponse.statusText}`)
        }

        const blockhashData = await blockhashResponse.json()
        blockhash = blockhashData.result?.value?.blockhash

        if (!blockhash) {
          throw new Error('Failed to get blockhash from response')
        }
        console.log('Blockhash received from RPC:', blockhash)

        if (swapInstructionsData.setupInstructions || swapInstructionsData.swapInstruction) {
          // Build transaction from instructions with our blockhash
          transaction = await buildTransactionFromInstructions(
            swapInstructionsData,
            publicKey.toString(),
            blockhash
          )
          console.log('Built transaction from instructions')
        } else {
          throw new Error('No swapTransaction or instructions found in swap instructions')
        }
      }

      // Sign transaction in wallet (user confirmation)
      const signedTransaction = await signTransaction(transaction)
      console.log('Transaction signed by wallet')

      // Serialize signed transaction for sending to RPC
      const signedTransactionBase64 = Buffer.from(signedTransaction.serialize()).toString('base64')

      // Send signed transaction to RPC for sending to blockchain
      const sendResponse = await fetch(`${API_BASE}/api/swap/send-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signedTransaction: signedTransactionBase64,
        }),
      })

      if (!sendResponse.ok) {
        const errorData = await sendResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to send transaction: ${sendResponse.statusText}`)
      }

      const sendData = await sendResponse.json()
      const signature = sendData.signature

      console.log('Transaction sent to blockchain, signature:', signature)

      // Save transaction to history
      if (fromToken && toToken) {
        saveSwapToHistory(
          signature,
          fromToken.symbol,
          toToken.symbol,
          fromAmount,
          toAmount
        )
      }

      // Success!
      setFromAmount('')
      setToAmount('0.0')
      setQuoteResponse(null)
      setError(null)
      
      // Show notification at bottom right through callback
      if (onShowToast) {
        onShowToast(`Swap completed! Signature: ${signature.slice(0, 8)}...${signature.slice(-8)}`)
      }
    } catch (err) {
      console.error('Swap error:', err)
      setError(err instanceof Error ? err.message : 'Failed to execute swap')
    } finally {
      setIsSwapping(false)
    }
  }

  const buildTransactionFromInstructions = async (
    swapInstructions: any,
    userPublicKey: string,
    blockhash: string
  ): Promise<VersionedTransaction> => {
    const publicKey = new PublicKey(userPublicKey)

    // Skip loading lookup tables (removed RPC request)
    const addressLookupTables: AddressLookupTableAccount[] = []

    // Collect all instructions in correct order
    const instructions: TransactionInstruction[] = []

    // 1. Compute Budget instructions must be FIRST
    if (swapInstructions.computeBudgetInstructions && Array.isArray(swapInstructions.computeBudgetInstructions)) {
      for (const computeInstruction of swapInstructions.computeBudgetInstructions) {
        instructions.push(
          new TransactionInstruction({
            keys: (computeInstruction.accounts || computeInstruction.keys || []).map((key: any) => ({
              pubkey: new PublicKey(key.pubkey || key),
              isSigner: key.isSigner || false,
              isWritable: key.isWritable || false,
            })),
            programId: new PublicKey(computeInstruction.programId),
            data: Buffer.from(computeInstruction.data, 'base64'),
          })
        )
      }
    }

    // 2. Setup instructions
    if (swapInstructions.setupInstructions && Array.isArray(swapInstructions.setupInstructions)) {
      for (const setupInstruction of swapInstructions.setupInstructions) {
        instructions.push(
          new TransactionInstruction({
            keys: (setupInstruction.accounts || setupInstruction.keys || []).map((key: any) => ({
              pubkey: new PublicKey(key.pubkey || key),
              isSigner: key.isSigner || false,
              isWritable: key.isWritable || false,
            })),
            programId: new PublicKey(setupInstruction.programId),
            data: Buffer.from(setupInstruction.data, 'base64'),
          })
        )
      }
    }

    // 3. Swap instruction
    if (swapInstructions.swapInstruction) {
      instructions.push(
        new TransactionInstruction({
          keys: (swapInstructions.swapInstruction.accounts || swapInstructions.swapInstruction.keys || []).map((key: any) => ({
            pubkey: new PublicKey(key.pubkey || key),
            isSigner: key.isSigner || false,
            isWritable: key.isWritable || false,
          })),
          programId: new PublicKey(swapInstructions.swapInstruction.programId),
          data: Buffer.from(swapInstructions.swapInstruction.data, 'base64'),
        })
      )
    }

    // 4. Other instructions (if any)
    if (swapInstructions.otherInstructions && Array.isArray(swapInstructions.otherInstructions)) {
      for (const otherInstruction of swapInstructions.otherInstructions) {
        instructions.push(
          new TransactionInstruction({
            keys: (otherInstruction.accounts || otherInstruction.keys || []).map((key: any) => ({
              pubkey: new PublicKey(key.pubkey || key),
              isSigner: key.isSigner || false,
              isWritable: key.isWritable || false,
            })),
            programId: new PublicKey(otherInstruction.programId),
            data: Buffer.from(otherInstruction.data, 'base64'),
          })
        )
      }
    }

    // 5. Token ledger instruction (if any)
    if (swapInstructions.tokenLedgerInstruction) {
      instructions.push(
        new TransactionInstruction({
          keys: (swapInstructions.tokenLedgerInstruction.accounts || swapInstructions.tokenLedgerInstruction.keys || []).map((key: any) => ({
            pubkey: new PublicKey(key.pubkey || key),
            isSigner: key.isSigner || false,
            isWritable: key.isWritable || false,
          })),
          programId: new PublicKey(swapInstructions.tokenLedgerInstruction.programId),
          data: Buffer.from(swapInstructions.tokenLedgerInstruction.data, 'base64'),
        })
      )
    }

    // 6. Cleanup instruction (last)
    if (swapInstructions.cleanupInstruction) {
      instructions.push(
        new TransactionInstruction({
          keys: (swapInstructions.cleanupInstruction.accounts || swapInstructions.cleanupInstruction.keys || []).map((key: any) => ({
            pubkey: new PublicKey(key.pubkey || key),
            isSigner: key.isSigner || false,
            isWritable: key.isWritable || false,
          })),
          programId: new PublicKey(swapInstructions.cleanupInstruction.programId),
          data: Buffer.from(swapInstructions.cleanupInstruction.data, 'base64'),
        })
      )
    }

    // Create VersionedTransaction
    const messageV0 = new TransactionMessage({
      payerKey: publicKey,
      recentBlockhash: blockhash,
      instructions: instructions,
    }).compileToV0Message(addressLookupTables.length > 0 ? addressLookupTables : undefined)

    return new VersionedTransaction(messageV0)
  }

  const handleSwapTokens = () => {
    const tempToken = fromToken
    const tempAmount = fromAmount
    onFromTokenChange(toToken)
    onToTokenChange(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  return (
    <div className="swap-container">
      <div className="swap-box">
        <div className="swap-input-section">
          <div className="input-label">You pay</div>
          <div className="input-group">
            <input
              type="number"
              className="amount-input"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              disabled={!fromToken || isSwapping}
            />
            <TokenSelector
              selectedToken={fromToken}
              onSelect={onFromTokenChange}
              label="Select"
            />
          </div>
        </div>

        <button className="swap-arrow" onClick={handleSwapTokens} disabled={isSwapping}>
          ⇅
        </button>

        <div className="swap-input-section">
          <div className="input-label">You receive</div>
          <div className="input-group">
            <input
              type="text"
              className="amount-input"
              placeholder="0.0"
              value={toAmount}
              readOnly
            />
            <TokenSelector
              selectedToken={toToken}
              onSelect={onToTokenChange}
              label="Select"
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="swap-actions">
          <button
            className="swap-button"
            onClick={handleSwap}
            disabled={isSwapping || !connected || !fromToken || !toToken || !fromAmount || toAmount === '0.0' || !quoteResponse}
          >
            {isSwapping ? 'Swapping...' : connected ? 'Swap' : 'Connect Wallet'}
          </button>
        </div>
        
        {isGettingQuote && (
          <div style={{ textAlign: 'center', marginTop: '0.5rem', color: 'var(--color-secondary)', fontSize: '0.85rem' }}>
            Getting quote...
          </div>
        )}

        <div className="swap-footer">
          <span>Secured by Claude Swap</span>
          <button 
            className="swap-history-button"
            onClick={() => setIsHistoryOpen(true)}
            title="View swap history"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 3C8.03 3 4 7.03 4 12H1L4.96 16.03L9 12H6C6 8.13 9.13 5 13 5C16.87 5 20 8.13 20 12C20 15.87 16.87 19 13 19C11.07 19 9.32 18.21 8.06 16.94L6.64 18.36C8.27 20 10.51 21 13 21C17.97 21 22 16.97 22 12C22 7.03 17.97 3 13 3ZM12 8V13L16.28 15.54L17 14.33L13.5 12.25V8H12Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* History modal */}
      <SwapHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  )
}

export default Swap

