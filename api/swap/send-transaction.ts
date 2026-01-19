import type { VercelRequest, VercelResponse } from '@vercel/node'

const SOLANA_RPC_URL = process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { signedTransaction } = req.body || {}

    if (!signedTransaction) {
      return res.status(400).json({
        error: 'Missing required field: signedTransaction'
      })
    }

    const RPC_ENDPOINT = process.env.VITE_SOLANA_RPC_SEND_URL || SOLANA_RPC_URL

    const rpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'sendTransaction',
      params: [
        signedTransaction,
        {
          encoding: 'base64',
          skipPreflight: true,
          preflightCommitment: 'confirmed',
          maxRetries: 3,
        },
      ],
    }

    const response = await fetch(RPC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpcRequest),
    })

    const data = await response.json()

    if (data.error) {
      console.error('Solana RPC Error:', JSON.stringify(data.error, null, 2))
      const errorMessage = data.error.message || data.error.data?.err?.toString() || 'RPC request failed'
      return res.status(400).json({
        error: errorMessage,
        details: data.error
      })
    }

    const signature = data.result
    if (!signature) {
      throw new Error('No signature in RPC response')
    }

    return res.status(200).json({
      success: true,
      signature: signature,
      message: 'Transaction sent successfully'
    })
  } catch (error) {
    console.error('Error sending transaction:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send transaction',
    })
  }
}

