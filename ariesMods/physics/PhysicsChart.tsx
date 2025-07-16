import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCommsStream } from '@/hooks/use-comms-stream'
import type { AriesModProps } from '@/types/ariesmods'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'

interface DataPoint {
  time: number
  value: number
}

/**
 * PhysicsChart - Real-time chart for physics simulation data
 * 
 * This component displays a real-time chart of physics values over time,
 * with configurable window size, colors, and reference lines.
 */
const PhysicsChart: React.FC<AriesModProps> = ({
  title,
  data,
  config = {}
}) => {
  // Configuration options
  const streamId = config.streamId
  const windowSize = config.windowSize || 100 // Number of points to display
  const timeWindow = config.timeWindow || 10 // Time window in seconds
  const yAxisDomain = config.yAxisDomain || 'auto' // 'auto' or [min, max]
  const color = config.color || '#4169E1'
  const showGrid = config.showGrid !== false
  const showTooltip = config.showTooltip !== false
  const referenceLines = config.referenceLines || []
  
  // Get stream data if streamId is provided
  const streamData = streamId ? useCommsStream(streamId) : null
  
  // Chart data state
  const [chartData, setChartData] = useState<DataPoint[]>([])
  const startTimeRef = useRef<number>(Date.now() / 1000)
  
  // Use either direct data or stream data
  const value = streamData?.value ?? data?.value
  const unit = config.unit || streamData?.unit || data?.unit || ''
  
  // Update chart data when value changes
  useEffect(() => {
    if (typeof value === 'number') {
      const currentTime = Date.now() / 1000 - startTimeRef.current
      
      setChartData(prevData => {
        // Add new data point
        const newData = [...prevData, { time: currentTime, value }]
        
        // Remove old data points outside the time window
        const cutoffTime = currentTime - timeWindow
        const filteredData = newData.filter(point => point.time >= cutoffTime)
        
        // Limit to windowSize points
        return filteredData.slice(-windowSize)
      })
    }
  }, [value, windowSize, timeWindow])
  
  // Calculate Y-axis domain
  const getYAxisDomain = () => {
    if (yAxisDomain !== 'auto') return yAxisDomain
    
    if (chartData.length === 0) return [0, 1]
    
    const values = chartData.map(point => point.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    // Add 10% padding
    const padding = (max - min) * 0.1
    return [min - padding, max + padding]
  }
  
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {title} {unit && <span className="text-xs text-muted-foreground">({unit})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <div className="w-full h-[calc(100%-30px)]" style={{ minHeight: '150px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.2} />}
              <XAxis 
                dataKey="time" 
                type="number"
                domain={[(now) => now - timeWindow, 'dataMax']}
                tickFormatter={(time) => time.toFixed(1)}
                label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                domain={getYAxisDomain()}
                tick={{ fontSize: 10 }}
              />
              {showTooltip && (
                <Tooltip 
                  formatter={(value: number) => [value.toFixed(3), 'Value']}
                  labelFormatter={(time) => `Time: ${time.toFixed(2)}s`}
                />
              )}
              
              {/* Reference lines */}
              {referenceLines.map((line, index) => (
                <ReferenceLine 
                  key={index}
                  y={line.value}
                  stroke={line.color || '#ff7300'}
                  strokeDasharray={line.dashed ? '3 3' : '0'}
                  label={{ 
                    value: line.label, 
                    position: 'right',
                    fill: line.color || '#ff7300',
                    fontSize: 10
                  }}
                />
              ))}
              
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                dot={false}
                isAnimationActive={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default PhysicsChart