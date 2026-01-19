import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { inputMint, outputMint, amount, slippageBps = '50', maxAccounts = '40', onlyDirectRoutes = 'true' } = req.query

    if (!inputMint || !outputMint || !amount) {
      return res.status(400).json({
        error: 'Missing required parameters: inputMint, outputMint, amount'
      })
    }

    // Call Jupiter API
    const jupiterUrl = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&maxAccounts=${maxAccounts}&onlyDirectRoutes=${onlyDirectRoutes}`

    const jupiterResponse = await fetch(jupiterUrl)

    if (!jupiterResponse.ok) {
      throw new Error(`Jupiter API error: ${jupiterResponse.statusText}`)
    }

    const quoteData = await jupiterResponse.json()

    return res.status(200).json(quoteData)
  } catch (error) {
    console.error('Error getting quote:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get quote',
    })
  }
}

