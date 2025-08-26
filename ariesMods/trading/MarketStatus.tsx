import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react'
import type { AriesModProps } from '@/types/ariesmods'

interface MarketData {
  isOpen: boolean
  marketHours: string
  nextOpen: string
  nextClose: string
  currentTime: string
  spyPrice: number
  spyChange: number
  qqqPrice: number
  qqqChange: number
}

const MarketStatus: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange
}) => {
  const [marketData, setMarketData] = useState<MarketData>({
    isOpen: data?.market_open || false,
    marketHours: data?.market_hours || 'CLOSED',
    nextOpen: '09:30 AM EST',
    nextClose: '04:00 PM EST',
    currentTime: new Date().toLocaleTimeString(),
    spyPrice: data?.SPY_price || 450.00,
    spyChange: 0.5,
    qqqPrice: data?.QQQ_price || 380.00,
    qqqqChange: -0.3
  })

  useEffect(() => {
    // Update current time every second
    const timeInterval = setInterval(() => {
      setMarketData(prev => ({
        ...prev,
        currentTime: new Date().toLocaleTimeString()
      }))
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  useEffect(() => {
    // Update with real stream data if available
    if (data) {
      setMarketData(prev => ({
        ...prev,
        isOpen: data.market_open !== undefined ? data.market_open : prev.isOpen,
        marketHours: data.market_hours || prev.marketHours,
        spyPrice: data.SPY_price || prev.spyPrice,
        qqqPrice: data.QQQ_price || prev.qqqPrice
      }))
    } else {
      // Generate dummy data if no stream data
      const interval = setInterval(() => {
        setMarketData(prev => {
          const now = new Date()
          const hour = now.getHours()
          const isMarketHours = hour >= 9 && hour < 16
          
          return {
            ...prev,
            isOpen: isMarketHours,
            marketHours: isMarketHours ? 'OPEN' : 'CLOSED',
            spyPrice: prev.spyPrice + (Math.random() - 0.5) * 2,
            qqqPrice: prev.qqqPrice + (Math.random() - 0.5) * 2
          }
        })
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [data])

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const getMarketStatusColor = (isOpen: boolean): string => {
    return isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getMarketStatusIcon = (isOpen: boolean) => {
    return isOpen ? <Activity className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {title || 'Market Status'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Status */}
        <div className="text-center">
          <Badge className={`${getMarketStatusColor(marketData.isOpen)} text-lg px-4 py-2`}>
            <div className="flex items-center gap-2">
              {getMarketStatusIcon(marketData.isOpen)}
              {marketData.marketHours}
            </div>
          </Badge>
          <div className="text-sm text-gray-600 mt-2">
            {marketData.currentTime}
          </div>
        </div>

        {/* Market Hours */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Market Open</div>
            <div className="text-sm font-medium">{marketData.nextOpen}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Market Close</div>
            <div className="text-sm font-medium">{marketData.nextClose}</div>
          </div>
        </div>

        {/* Key Indices */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700 border-b pb-1">
            Key Indices
          </div>
          
          {/* SPY */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">SPY</Badge>
              <span className="text-sm">S&P 500</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {formatPrice(marketData.spyPrice)}
              </div>
              <div className={`text-xs flex items-center gap-1 ${
                marketData.spyChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {marketData.spyChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {marketData.spyChange >= 0 ? '+' : ''}{marketData.spyChange.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* QQQ */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">QQQ</Badge>
              <span className="text-sm">NASDAQ</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {formatPrice(marketData.qqqPrice)}
              </div>
              <div className={`text-xs flex items-center gap-1 ${
                marketData.qqqqChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {marketData.qqqqChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {marketData.qqqqChange >= 0 ? '+' : ''}{marketData.qqqqChange.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Market Summary */}
        <div className="pt-2 border-t border-gray-200">
          <div className="text-center">
            <div className="text-xs text-gray-500">Market Session</div>
            <div className="text-sm font-medium">
              {marketData.isOpen ? 'Regular Trading Hours' : 'Pre/After Market'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MarketStatus