import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCommsStream } from '@/hooks/use-comms-stream'
import type { AriesModProps } from '@/types/ariesmods'

/**
 * PhysicsValueMonitor - Displays a physics value with unit and trend indicator
 * 
 * This component is designed to display real-time physics values from simulations
 * with appropriate units, trend indicators, and configurable styling.
 */
const PhysicsValueMonitor: React.FC<AriesModProps> = ({
  title,
  data,
  config = {}
}) => {
  const [prevValue, setPrevValue] = useState<number | null>(null)
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')
  
  // Get stream data if streamId is provided in config
  const streamData = config.streamId ? useCommsStream(config.streamId) : null
  
  // Use either direct data or stream data
  const value = streamData?.value ?? data?.value ?? 0
  const unit = config.unit || streamData?.unit || data?.unit || ''
  const precision = config.precision || 2
  const displayValue = typeof value === 'number' ? value.toFixed(precision) : value
  
  // Determine min/max for color coding
  const min = config.min ?? streamData?.metadata?.min ?? -Infinity
  const max = config.max ?? streamData?.metadata?.max ?? Infinity
  
  // Custom colors
  const color = config.color || streamData?.metadata?.color || '#4169E1'
  
  // Update trend indicator
  useEffect(() => {
    if (prevValue !== null && typeof value === 'number') {
      if (value > prevValue) {
        setTrend('up')
      } else if (value < prevValue) {
        setTrend('down')
      } else {
        setTrend('stable')
      }
    }
    setPrevValue(typeof value === 'number' ? value : null)
  }, [value, prevValue])
  
  // Determine if value is within normal range
  const isOutOfRange = typeof value === 'number' && (value < min || value > max)
  
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Badge 
            variant={isOutOfRange ? "destructive" : "outline"}
            className="text-xs"
          >
            {unit}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div 
            className="text-3xl font-bold"
            style={{ color: isOutOfRange ? 'var(--destructive)' : color }}
          >
            {displayValue}
            
            {/* Trend indicator */}
            <span className="ml-2 text-sm">
              {trend === 'up' && <span className="text-green-500">▲</span>}
              {trend === 'down' && <span className="text-red-500">▼</span>}
              {trend === 'stable' && <span className="text-gray-500">■</span>}
            </span>
          </div>
        </div>
        
        {/* Range indicator */}
        {(min > -Infinity || max < Infinity) && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Range: {min > -Infinity ? min : '∞'} to {max < Infinity ? max : '∞'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PhysicsValueMonitor