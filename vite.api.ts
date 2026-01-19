import type { Plugin } from 'vite'

type Connect = {
  IncomingMessage: any
  ServerResponse: any
  NextFunction: () => void
}

const SOLANA_RPC_URL = process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

function handleAPIRequest(
  req: any,
  res: any,
  next: () => void
) {
  // Обрабатываем только /api запросы
  if (!req.url?.startsWith('/api/')) {
    return next()
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.statusCode = 200
    res.end()
    return
  }

  try {
    // /api/rpc/blockhash
    if (req.url === '/api/rpc/blockhash' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      
      req.on('end', async () => {
        try {
          const { commitment = 'confirmed' } = JSON.parse(body)
          
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

          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify({
            success: true,
            result: data.result,
          }))
        } catch (error) {
          console.error('Error getting blockhash:', error)
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 500
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to get blockhash',
          }))
        }
      })
      return
    }

    // /api/getquote - получаем quote от Jupiter API
    if (req.url?.startsWith('/api/getquote') && req.method === 'GET') {
      (async () => {
        try {
          const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
          const inputMint = url.searchParams.get('inputMint')
          const outputMint = url.searchParams.get('outputMint')
          const amount = url.searchParams.get('amount')
          const slippageBps = url.searchParams.get('slippageBps') || '50'
          const maxAccounts = url.searchParams.get('maxAccounts') || '40'
          const onlyDirectRoutes = url.searchParams.get('onlyDirectRoutes') || 'true'

          if (!inputMint || !outputMint || !amount) {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 400
            res.end(JSON.stringify({
              error: 'Missing required parameters: inputMint, outputMint, amount'
            }))
            return
          }

          // Вызываем Jupiter API
          const jupiterUrl = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&maxAccounts=${maxAccounts}&onlyDirectRoutes=${onlyDirectRoutes}`
          
          const jupiterResponse = await fetch(jupiterUrl)

          if (!jupiterResponse.ok) {
            throw new Error(`Jupiter API error: ${jupiterResponse.statusText}`)
          }

          const quoteData = await jupiterResponse.json()

          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify(quoteData))
        } catch (error) {
          console.error('Error getting quote:', error)
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 500
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to get quote',
          }))
        }
      })()
      return
    }

    // /api/swap/instructions
    if (req.url === '/api/swap/instructions' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      
      req.on('end', async () => {
        try {
          const { quoteResponse, userPublicKey } = JSON.parse(body)

          if (!quoteResponse || !userPublicKey) {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 400
            res.end(JSON.stringify({
              error: 'Missing required fields: quoteResponse and userPublicKey'
            }))
            return
          }

          // Вызываем Jupiter API
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

          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify(swapInstructionsData))
        } catch (error) {
          console.error('Error getting swap instructions:', error)
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 500
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to get swap instructions',
          }))
        }
      })
      return
    }

    // /api/swap/send-transaction
    if (req.url === '/api/swap/send-transaction' && req.method === 'POST') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      
      req.on('end', async () => {
        try {
          const { signedTransaction } = JSON.parse(body)

          if (!signedTransaction) {
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 400
            res.end(JSON.stringify({
              error: 'Missing required field: signedTransaction'
            }))
            return
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
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 400
            res.end(JSON.stringify({
              error: errorMessage,
              details: data.error
            }))
            return
          }

          const signature = data.result
          if (!signature) {
            throw new Error('No signature in RPC response')
          }

          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify({
            success: true,
            signature: signature,
            message: 'Transaction sent successfully'
          }))
        } catch (error) {
          console.error('Error sending transaction:', error)
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 500
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to send transaction',
          }))
        }
      })
      return
    }

    // Если роут не найден
    res.statusCode = 404
    res.end(JSON.stringify({ error: 'Not found' }))
  } catch (error) {
    console.error('API Error:', error)
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 500
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
    }))
  }
}

export function apiPlugin(): Plugin {
  return {
    name: 'vite-api-plugin',
    configureServer(server) {
      server.middlewares.use(handleAPIRequest)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleAPIRequest)
    },
  }
}

