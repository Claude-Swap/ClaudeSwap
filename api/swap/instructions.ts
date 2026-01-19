import type { VercelRequest, VercelResponse } from '@vercel/node'

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
    const { quoteResponse, userPublicKey } = req.body || {}

    if (!quoteResponse || !userPublicKey) {
      return res.status(400).json({
        error: 'Missing required fields: quoteResponse and userPublicKey'
      })
    }

    // Call Jupiter API
    const jupiterResponse = await fetch('https://lite-api.jup.ag/swap/v1/swap-instructions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
      }),
    })

    if (!jupiterResponse.ok) {
      const errorData = await jupiterResponse.json().catch(() => ({}))
      throw new Error(errorData.error || `Jupiter API error: ${jupiterResponse.statusText}`)
    }

    const swapInstructionsData = await jupiterResponse.json()

    return res.status(200).json(swapInstructionsData)
  } catch (error) {
    console.error('Error getting swap instructions:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get swap instructions',
    })
  }
}

