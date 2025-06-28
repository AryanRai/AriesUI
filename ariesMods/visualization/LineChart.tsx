import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Activity } from 'lucide-react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'

interface DataPoint {
  time: string
  value: number
  timestamp: number
}

const LineChartComponent: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange
}) => {
  const [chartData, setChartData] = useState<DataPoint[]>([])
  const [isLive, setIsLive] = useState<boolean>(config.isLive !== false)

  useEffect(() => {
    // Initialize with some historical data
    const now = Date.now()
    const initialData: DataPoint[] = Array.from({ length: 20 }, (_, i) => {
      const timestamp = now - (19 - i) * 30000 // 30 seconds apart
      return {
        time: new Date(timestamp).toLocaleTimeString().slice(0, 5),
        value: Math.round((20 + Math.sin(i * 0.3) * 10 + Math.random() * 5) * 10) / 10,
        timestamp
      }
    })
    setChartData(initialData)
  }, [])

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      const now = Date.now()
      const newPoint: DataPoint = {
        time: new Date(now).toLocaleTimeString().slice(0, 5),
        value: Math.round((data.value || 20 + Math.random() * 10) * 10) / 10,
        timestamp: now
      }

      setChartData(prev => {
        const updated = [...prev, newPoint]
        const maxPoints = config.maxDataPoints || 20
        return updated.slice(-maxPoints)
      })
    }, config.updateInterval || 3000)

    return () => clearInterval(interval)
  }, [isLive, data.value, config])

  const getCurrentValue = () => {
    return chartData.length > 0 ? chartData[chartData.length - 1].value : 0
  }

  const getTrend = () => {
    if (chartData.length < 2) return 'stable'
    const current = chartData[chartData.length - 1].value
    const previous = chartData[chartData.length - 2].value
    const diff = current - previous
    
    if (Math.abs(diff) < 0.1) return 'stable'
    return diff > 0 ? 'up' : 'down'
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-500'
      case 'down': return 'text-red-500'
      default: return 'text-blue-500'
    }
  }

  const trend = getTrend()
  const currentValue = getCurrentValue()

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {title}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isLive ? 'default' : 'secondary'}>
              {isLive ? 'Live' : 'Paused'}
            </Badge>
            <div className={`flex items-center gap-1 ${getTrendColor(trend)}`}>
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">{trend}</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-center">
          <div className="text-2xl font-bold">
            {currentValue}{config.unit || ''}
          </div>
          <div className="text-xs text-muted-foreground">
            Current Value
          </div>
        </div>

        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }}
                stroke="#6B7280"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                stroke="#6B7280"
                domain={config.yAxisDomain || ['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#F9FAFB', 
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={config.lineColor || '#3B82F6'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: config.lineColor || '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div>Points: {chartData.length}/{config.maxDataPoints || 20}</div>
          <div>Update: {config.updateInterval || 3000}ms</div>
          <div>Source: {config.dataSource || 'Sensor'}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export const LineChartMod: AriesMod = {
  metadata: {
    id: 'line-chart',
    name: 'LineChart',
    displayName: 'Line Chart',
    description: 'Real-time line chart for visualizing time-series data',
    version: '1.0.0',
    author: 'AriesUI Team',
    category: 'visualization',
    icon: '📈',
    defaultWidth: 300,
    defaultHeight: 250,
    minWidth: 250,
    minHeight: 200,
    tags: ['chart', 'graph', 'visualization', 'time-series']
  },
  component: LineChartComponent,
  generateDummyData: (): AriesModData => ({
    value: Math.round((20 + Math.sin(Date.now() / 10000) * 10 + Math.random() * 5) * 10) / 10,
    timestamp: new Date().toISOString(),
    metadata: {
      dataType: 'continuous',
      unit: 'units',
      sampleRate: '1Hz'
    }
  }),
  validateConfig: (config: Record<string, any>): boolean => {
    if (config.maxDataPoints && (typeof config.maxDataPoints !== 'number' || config.maxDataPoints < 10 || config.maxDataPoints > 1000)) {
      return false
    }
    if (config.updateInterval && (typeof config.updateInterval !== 'number' || config.updateInterval < 100)) {
      return false
    }
    return true
  }
} 