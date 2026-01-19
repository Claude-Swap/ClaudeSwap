import type { VercelRequest, VercelResponse } from '@vercel/node'

const SOLANA_RPC_URL = process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { commitment = 'confirmed' } = req.body || {}

    const rpcRequest = {
      jsonrpc: '2.0',
      id: Math.random().toString(36).substring(7),
      method: 'getLatestBlockhash',
      params: [{ commitment }],
    }

    const response = await fetch(SOLANA_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpcRequest),
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message || 'RPC request failed')
    }

    return res.status(200).json({
      success: true,
      result: data.result,
    })
  } catch (error) {
    console.error('Error getting blockhash:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get blockhash',
    })
  }
}

