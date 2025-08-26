import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Activity, Volume2, Target } from 'lucide-react'
import type { AriesModProps } from '@/types/ariesmods'

interface StockData {
  symbol: string
  price: number
  volume: number
  signal: string
  signalStrength: number
  prevPrice: number
}

const StockPriceMonitor: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange
}) => {
  const symbol = config.symbol || 'AAPL'
  const [stockData, setStockData] = useState<StockData>({
    symbol,
    price: data?.[`${symbol}_price`] || 150.00,
    volume: data?.[`${symbol}_volume`] || 45000000,
    signal: data?.[`${symbol}_signal`] || 'hold',
    signalStrength: data?.[`${symbol}_signal_strength`] || 0.5,
    prevPrice: 148.50
  })

  useEffect(() => {
    // Update with real stream data if available
    if (data) {
      setStockData(prev => ({
        ...prev,
        price: data[`${symbol}_price`] || prev.price,
        volume: data[`${symbol}_volume`] || prev.volume,
        signal: data[`${symbol}_signal`] || prev.signal,
        signalStrength: data[`${symbol}_signal_strength`] || prev.signalStrength,
        prevPrice: prev.price // Store previous price for change calculation
      }))
    } else {
      // Generate dummy data if no stream data
      const interval = setInterval(() => {
        setStockData(prev => {
          const change = (Math.random() - 0.5) * 2
          const newPrice = Math.max(prev.price + change, 1)
          return {
            ...prev,
            prevPrice: prev.price,
            price: newPrice,
            volume: Math.floor(Math.random() * 10000000) + 30000000,
            signal: ['buy', 'sell', 'hold'][Math.floor(Math.random() * 3)],
            signalStrength: Math.random()
          }
        })
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [data, symbol])

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + 'M'
    } else if (volume >= 1000) {
      return (volume / 1000).toFixed(0) + 'K'
    }
    return volume.toString()
  }

  const getSignalColor = (signal: string): string => {
    switch (signal.toLowerCase()) {
      case 'buy': return 'bg-green-100 text-green-800'
      case 'sell': return 'bg-red-100 text-red-800'
      case 'hold': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSignalIcon = (signal: string) => {
    switch (signal.toLowerCase()) {
      case 'buy': return <TrendingUp className="w-3 h-3" />
      case 'sell': return <TrendingDown className="w-3 h-3" />
      case 'hold': return <Target className="w-3 h-3" />
      default: return <Activity className="w-3 h-3" />
    }
  }

  const priceChange = stockData.price - stockData.prevPrice
  const priceChangePercent = (priceChange / stockData.prevPrice) * 100

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {title || stockData.symbol}
          </div>
          <Badge variant="outline" className="text-xs">
            {stockData.symbol}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price */}
        <div className="text-center">
          <div className="text-2xl font-bold">
            {formatPrice(stockData.price)}
          </div>
          <div className={`text-sm flex items-center justify-center gap-1 ${
            priceChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {priceChange >= 0 ? '+' : ''}{formatPrice(priceChange)} 
            ({priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">Volume</span>
          </div>
          <span className="text-sm font-medium">
            {formatVolume(stockData.volume)}
          </span>
        </div>

        {/* Trading Signal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-gray-600">Signal</span>
          </div>
          <Badge className={getSignalColor(stockData.signal)}>
            <div className="flex items-center gap-1">
              {getSignalIcon(stockData.signal)}
              {stockData.signal.toUpperCase()}
            </div>
          </Badge>
        </div>

        {/* Signal Strength */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Signal Strength</span>
            <span className="text-sm font-medium">
              {(stockData.signalStrength * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                stockData.signalStrength > 0.7 ? 'bg-green-500' :
                stockData.signalStrength > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${stockData.signalStrength * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="pt-2 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500">Day High</div>
              <div className="text-sm font-medium">
                {formatPrice(stockData.price * 1.02)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Day Low</div>
              <div className="text-sm font-medium">
                {formatPrice(stockData.price * 0.98)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default StockPriceMonitor