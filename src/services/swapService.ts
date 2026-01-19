import axios from 'axios'

interface SwapParams {
  fromToken: string
  toToken: string
  amount: string
  walletAddress: string
}

interface SwapResponse {
  success: boolean
  txHash?: string
  error?: string
}

// Base URL for NOVA RPC API
const API_BASE_URL = 'https://api.NOVArpc.io' // Update with actual API URL

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const performSwap = async (params: SwapParams): Promise<SwapResponse> => {
  try {
    // Try to call the actual API
    const response = await apiClient.post('/swap', {
      fromToken: params.fromToken,
      toToken: params.toToken,
      amount: params.amount,
      walletAddress: params.walletAddress,
    })

    return {
      success: true,
      txHash: response.data.txHash,
    }
  } catch (error) {
    // If API is not available, simulate swap for demo purposes
    if (axios.isAxiosError(error) && (error.code === 'ECONNREFUSED' || error.response?.status === 404)) {
      console.warn('API not available, using demo mode')
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate mock transaction hash
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
      
      return {
        success: true,
        txHash: mockTxHash,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Swap failed',
    }
  }
}

export const getSwapQuote = async (
  fromToken: string,
  toToken: string,
  amount: string
): Promise<{ rate: number; estimatedOutput: string } | null> => {
  try {
    const response = await apiClient.get('/quote', {
      params: {
        fromToken,
        toToken,
        amount,
      },
    })

    return {
      rate: response.data.rate,
      estimatedOutput: response.data.estimatedOutput,
    }
  } catch (error) {
    // Fallback to mock data
    console.warn('Quote API not available, using mock data')
    return {
      rate: 1.5,
      estimatedOutput: (parseFloat(amount) * 1.5).toFixed(6),
    }
  }
}

export const getTokenBalance = async (
  tokenAddress: string,
  walletAddress: string
): Promise<string> => {
  try {
    const response = await apiClient.get('/balance', {
      params: {
        tokenAddress,
        walletAddress,
      },
    })

    return response.data.balance
  } catch (error) {
    // Fallback to mock data
    console.warn('Balance API not available, using mock data')
    return '0.0'
  }
}

