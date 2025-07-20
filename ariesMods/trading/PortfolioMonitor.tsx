import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertTriangle } from 'lucide-react'
import type { AriesModProps } from '@/types/ariesmods'

interface PortfolioData {
  portfolioValue: number
  buyingPower: number
  cash: number
  portfolioHeat: number
  riskAlert: string
}

const PortfolioMonitor: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange
}) => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    portfolioValue: data?.portfolio_value || 100000,
    buyingPower: data?.buying_power || 80000,
    cash: data?.cash || 50000,
    portfolioHeat: data?.portfolio_heat || 0.6,
    riskAlert: data?.risk_alert || 'LOW_HEAT'
  })

  useEffect(() => {
    // Update with real stream data if available
    if (data) {
      setPortfolioData(prev => ({
        ...prev,
        portfolioValue: data.portfolio_value || prev.portfolioValue,
        buyingPower: data.buying_power || prev.buyingPower,
        cash: data.cash || prev.cash,
        portfolioHeat: data.portfolio_heat || prev.portfolioHeat,
        riskAlert: data.risk_alert || prev.riskAlert
      }))
    }
  }, [data])

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const getHeatColor = (heat: number): string => {
    if (heat > 0.8) return 'bg-red-500'
    if (heat > 0.6) return 'bg-orange-500'
    if (heat > 0.4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getRiskBadgeColor = (alert: string): string => {
    switch (alert) {
      case 'HIGH_HEAT': return 'bg-red-100 text-red-800'
      case 'MEDIUM_HEAT': return 'bg-orange-100 text-orange-800'
      case 'LOW_HEAT': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getChangePercentage = (): number => {
    const initialValue = config.initialValue || 100000
    return ((portfolioData.portfolioValue - initialValue) / initialValue) * 100
  }

  const changePercentage = getChangePercentage()

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          {title || 'Portfolio Monitor'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portfolio Value */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Portfolio Value</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">
              {formatCurrency(portfolioData.portfolioValue)}
            </div>
            <div className={`text-xs flex items-center gap-1 ${
              changePercentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {changePercentage >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Buying Power */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Buying Power</span>
          <span className="text-sm font-medium">
            {formatCurrency(portfolioData.buyingPower)}
          </span>
        </div>

        {/* Cash */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Cash</span>
          <span className="text-sm font-medium">
            {formatCurrency(portfolioData.cash)}
          </span>
        </div>

        {/* Portfolio Heat */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Portfolio Heat</span>
            <span className="text-sm font-medium">
              {(portfolioData.portfolioHeat * 100).toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={portfolioData.portfolioHeat * 100} 
            className="h-2"
            indicatorClassName={getHeatColor(portfolioData.portfolioHeat)}
          />
        </div>

        {/* Risk Alert */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-600">Risk Level</span>
          </div>
          <Badge className={getRiskBadgeColor(portfolioData.riskAlert)}>
            {portfolioData.riskAlert.replace('_', ' ')}
          </Badge>
        </div>

        {/* Summary Stats */}
        <div className="pt-2 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500">Invested</div>
              <div className="text-sm font-medium">
                {formatCurrency(portfolioData.portfolioValue - portfolioData.cash)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Cash %</div>
              <div className="text-sm font-medium">
                {((portfolioData.cash / portfolioData.portfolioValue) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PortfolioMonitor