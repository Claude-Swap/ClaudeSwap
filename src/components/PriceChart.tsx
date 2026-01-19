import React, { useEffect, useState, useMemo } from 'react'
import { ComposedChart, Line, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import './PriceChart.css'

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface PriceChartProps {
  tokenAddress: string
  tokenSymbol: string
  tokenName: string
}

type Timeframe = '15_MINUTE' | '1_HOUR' | '4_HOUR' | '1_DAY'

const formatAddress = (address: string) => {
  if (address.length > 10) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  return address
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`
  if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`
  return `$${num.toFixed(6)}`
}


const PriceChart: React.FC<PriceChartProps> = ({ tokenAddress, tokenSymbol, tokenName }) => {
  const [candles, setCandles] = useState<Candle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>('15_MINUTE')

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const to = Date.now()
        const candlesCount = timeframe === '1_DAY' ? 30 : timeframe === '4_HOUR' ? 30 : timeframe === '1_HOUR' ? 48 : 96
        
        const response = await fetch(
          `https://datapi.jup.ag/v2/charts/${tokenAddress}?interval=${timeframe}&candles=${candlesCount}&to=${to}&type=price`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch chart data')
        }

        const result = await response.json()
        const fetchedCandles: Candle[] = result.candles || []
        setCandles(fetchedCandles)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chart')
        setCandles([])
      } finally {
        setIsLoading(false)
      }
    }

    if (tokenAddress) {
      fetchChartData()
    }
  }, [tokenAddress, timeframe])

  // Transform candles for chart display
  const chartData = useMemo(() => {
    if (candles.length === 0) return []
    
    return candles.map((candle) => {
      const date = new Date(candle.time * 1000)
      const isPositive = candle.close >= candle.open
      
      return {
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        timestamp: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isPositive
      }
    })
  }, [candles])

  // Calculate metrics
  const metrics = useMemo(() => {
    if (candles.length === 0) {
      return {
        currentPrice: 0,
        open: 0,
        high: 0,
        low: 0,
        close: 0,
        priceChange: 0,
        priceChangePercent: 0,
        volume24h: 0,
        high24h: 0,
        low24h: 0
      }
    }

    const first = candles[0]
    const last = candles[candles.length - 1]
    const allHighs = candles.map(c => c.high)
    const allLows = candles.map(c => c.low)
    const allVolumes = candles.map(c => c.volume)

    return {
      currentPrice: last.close,
      open: first.open,
      high: Math.max(...allHighs),
      low: Math.min(...allLows),
      close: last.close,
      priceChange: last.close - first.open,
      priceChangePercent: ((last.close - first.open) / first.open) * 100,
      volume24h: allVolumes.reduce((a, b) => a + b, 0),
      high24h: Math.max(...allHighs),
      low24h: Math.min(...allLows)
    }
  }, [candles])

  const isPositive = metrics.priceChangePercent >= 0

  if (isLoading) {
    return (
      <div className="price-chart-container">
        <div className="chart-header">
          <div className="chart-title">
            <span className="chart-symbol">{tokenSymbol}</span>
            <span className="chart-name">{tokenName}</span>
            <span className="chart-address">{formatAddress(tokenAddress)}</span>
          </div>
          <div className="chart-ohlc-skeleton">
            <span className="skeleton-line"></span>
            <span className="skeleton-line"></span>
            <span className="skeleton-line"></span>
            <span className="skeleton-line"></span>
            <span className="skeleton-line"></span>
          </div>
        </div>

        <div className="chart-timeframe-selector">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>

        <div className="chart-content">
          <div className="chart-price-display">
            <div className="skeleton-price"></div>
            <div className="skeleton-change"></div>
          </div>
          <div className="chart-skeleton">
            <div className="skeleton-chart-line"></div>
            <div className="skeleton-chart-line"></div>
            <div className="skeleton-chart-line"></div>
            <div className="skeleton-chart-line"></div>
            <div className="skeleton-chart-line"></div>
          </div>
        </div>

        <div className="chart-volume">
          <div className="volume-label-skeleton"></div>
          <div className="volume-bars-skeleton">
            <div className="skeleton-volume-bar"></div>
            <div className="skeleton-volume-bar"></div>
            <div className="skeleton-volume-bar"></div>
            <div className="skeleton-volume-bar"></div>
            <div className="skeleton-volume-bar"></div>
            <div className="skeleton-volume-bar"></div>
            <div className="skeleton-volume-bar"></div>
            <div className="skeleton-volume-bar"></div>
          </div>
        </div>

        <div className="chart-metrics">
          <div className="metric-item">
            <div className="skeleton-metric-label"></div>
            <div className="skeleton-metric-value"></div>
          </div>
          <div className="metric-item">
            <div className="skeleton-metric-label"></div>
            <div className="skeleton-metric-value"></div>
          </div>
          <div className="metric-item">
            <div className="skeleton-metric-label"></div>
            <div className="skeleton-metric-value"></div>
          </div>
        </div>

        <div className="chart-footer">
          <div className="skeleton-link"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="price-chart-container">
        <div className="chart-header">
          <div className="chart-title">
            <span className="chart-symbol">{tokenSymbol}</span>
            <span className="chart-name">{tokenName}</span>
            <span className="chart-address">{formatAddress(tokenAddress)}</span>
          </div>
          <div className="chart-error">{error}</div>
        </div>
        <div className="chart-footer">
          <a
            href={`https://dexscreener.com/solana/${tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="chart-link"
          >
            <span>View on DexScreener</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="chart-tooltip">
          <div className="tooltip-row">
            <span>O:</span>
            <span>${data.open.toFixed(6)}</span>
          </div>
          <div className="tooltip-row">
            <span>H:</span>
            <span>${data.high.toFixed(6)}</span>
          </div>
          <div className="tooltip-row">
            <span>L:</span>
            <span>${data.low.toFixed(6)}</span>
          </div>
          <div className="tooltip-row">
            <span>C:</span>
            <span>${data.close.toFixed(6)}</span>
          </div>
          <div className="tooltip-row">
            <span>Vol:</span>
            <span>{formatNumber(data.volume)}</span>
          </div>
          <div className="tooltip-time">{data.timestamp}</div>
        </div>
      )
    }
    return null
  }


  return (
    <div className="price-chart-container">
      <div className="chart-header">
        <div className="chart-title">
          <span className="chart-symbol">{tokenSymbol}</span>
          <span className="chart-name">{tokenName}</span>
          <span className="chart-address">{formatAddress(tokenAddress)}</span>
        </div>
        <div className="chart-ohlc">
          <span>O {formatNumber(metrics.open)}</span>
          <span>H {formatNumber(metrics.high24h)}</span>
          <span>L {formatNumber(metrics.low24h)}</span>
          <span>C {formatNumber(metrics.close)}</span>
          <span className={`chart-change ${isPositive ? 'positive' : 'negative'}`}>
            {formatNumber(Math.abs(metrics.priceChange))} ({isPositive ? '+' : ''}{metrics.priceChangePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="chart-timeframe-selector">
        <button 
          className={timeframe === '15_MINUTE' ? 'active' : ''}
          onClick={() => setTimeframe('15_MINUTE')}
        >
          15M
        </button>
        <button 
          className={timeframe === '1_HOUR' ? 'active' : ''}
          onClick={() => setTimeframe('1_HOUR')}
        >
          1H
        </button>
        <button 
          className={timeframe === '4_HOUR' ? 'active' : ''}
          onClick={() => setTimeframe('4_HOUR')}
        >
          4H
        </button>
        <button 
          className={timeframe === '1_DAY' ? 'active' : ''}
          onClick={() => setTimeframe('1_DAY')}
        >
          1D
        </button>
      </div>

      <div className="chart-content">
        <div className="chart-price-display">
          <span className="chart-price-main">{formatNumber(metrics.currentPrice)}</span>
          <span className={`chart-change-main ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{metrics.priceChangePercent.toFixed(2)}%
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <XAxis 
              dataKey="timestamp" 
              hide
              tickCount={5}
              interval="preserveStartEnd"
            />
            <YAxis 
              hide
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Price line with area fill */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#00AEEF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#00AEEF' }}
            />
            {/* High line */}
            <Line
              type="monotone"
              dataKey="high"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
            />
            {/* Low line */}
            <Line
              type="monotone"
              dataKey="low"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-volume">
        <div className="volume-label">Volume: {formatNumber(metrics.volume24h)}</div>
        <ResponsiveContainer width="100%" height={60}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis dataKey="timestamp" hide />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" fill="rgba(0, 174, 239, 0.25)" radius={0}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="rgba(0, 174, 239, 0.25)" />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-metrics">
        <div className="metric-item">
          <span className="metric-label">24H High</span>
          <span className="metric-value">{formatNumber(metrics.high24h)}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">24H Low</span>
          <span className="metric-value">{formatNumber(metrics.low24h)}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">24H Volume</span>
          <span className="metric-value">{formatNumber(metrics.volume24h)}</span>
        </div>
      </div>

      <div className="chart-footer">
        <a
          href={`https://dexscreener.com/solana/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="chart-link"
        >
          <span>View on DexScreener</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    </div>
  )
}

export default PriceChart

