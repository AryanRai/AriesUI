"use client"

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Thermometer, Zap, Gauge, Wifi, WifiOff } from 'lucide-react'
import { EnhancedWidgetBase } from './enhanced-widget-base'
import { Badge } from '@/components/ui/badge'
import { useMultipleCommsStreams } from '@/hooks/use-comms-stream'

interface StreamMapping {
  id: string
  streamId: string
  streamName: string
  multiplier: number
  formula: string
  unit: string
  enabled: boolean
}

interface EnhancedSensorWidgetProps {
  widgetId: string
  title?: string
  sensorType?: 'temperature' | 'pressure' | 'voltage' | 'current' | 'generic'
  streamMappings?: StreamMapping[]
  onStreamMappingsChange?: (mappings: StreamMapping[]) => void
  className?: string
  precision?: number
  showTrend?: boolean
  thresholds?: {
    warning?: { min?: number; max?: number }
    critical?: { min?: number; max?: number }
  }
}

export function EnhancedSensorWidget({
  widgetId,
  title,
  sensorType = 'generic',
  streamMappings = [],
  onStreamMappingsChange,
  className = "",
  precision = 2,
  showTrend = true,
  thresholds
}: EnhancedSensorWidgetProps) {
  const [previousValues, setPreviousValues] = useState<number[]>([])
  
  // Get stream IDs from mappings
  const streamIds = streamMappings.filter(m => m.enabled).map(m => m.streamId)
  
  // Connect to hardware streams
  const { streamData, isConnected, connectionStatus, error } = useMultipleCommsStreams(streamIds)

  const getSensorIcon = () => {
    switch (sensorType) {
      case 'temperature': return <Thermometer className="h-4 w-4" />
      case 'pressure': return <Gauge className="h-4 w-4" />
      case 'voltage': 
      case 'current': return <Zap className="h-4 w-4" />
      default: return <Gauge className="h-4 w-4" />
    }
  }

  const getDisplayTitle = () => {
    if (title) return title
    
    switch (sensorType) {
      case 'temperature': return 'Temperature Sensor'
      case 'pressure': return 'Pressure Sensor'
      case 'voltage': return 'Voltage Sensor'
      case 'current': return 'Current Sensor'
      default: return 'Sensor'
    }
  }

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toFixed(precision)
    }
    return String(value)
  }

  const getValueStatus = (value: number) => {
    if (!thresholds) return 'normal'
    
    if (thresholds.critical) {
      if ((thresholds.critical.min !== undefined && value < thresholds.critical.min) ||
          (thresholds.critical.max !== undefined && value > thresholds.critical.max)) {
        return 'critical'
      }
    }
    
    if (thresholds.warning) {
      if ((thresholds.warning.min !== undefined && value < thresholds.warning.min) ||
          (thresholds.warning.max !== undefined && value > thresholds.warning.max)) {
        return 'warning'
      }
    }
    
    return 'normal'
  }

  const getTrendIcon = (current: number, previous: number) => {
    const diff = current - previous
    const threshold = Math.abs(current) * 0.01 // 1% change threshold
    
    if (Math.abs(diff) < threshold) return <Minus className="h-3 w-3" />
    return diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
  }

  const getTrendColor = (current: number, previous: number) => {
    const diff = current - previous
    const threshold = Math.abs(current) * 0.01
    
    if (Math.abs(diff) < threshold) return 'text-muted-foreground'
    return diff > 0 ? 'text-green-500' : 'text-red-500'
  }

  // Convert hardware stream data to display format
  const displayData = streamMappings.filter(m => m.enabled).map(mapping => {
    const hardwareData = streamData.get(mapping.streamId)
    if (!hardwareData) {
      return {
        value: 'No Data',
        unit: mapping.unit,
        timestamp: new Date().toISOString(),
        status: 'inactive' as const,
        streamName: mapping.streamName
      }
    }
    
    // Apply formula/multiplier transformation
    let transformedValue = hardwareData.value
    if (typeof hardwareData.value === 'number') {
      transformedValue = hardwareData.value * mapping.multiplier
      
      // Apply custom formula if provided
      if (mapping.formula && mapping.formula !== 'x') {
        try {
          // Simple formula evaluation (for basic math like x*1.8+32)
          const formula = mapping.formula.replace(/x/g, transformedValue.toString())
          transformedValue = eval(formula)
        } catch (e) {
          console.warn('Formula evaluation failed:', e)
        }
      }
    }
    
    return {
      value: transformedValue,
      unit: mapping.unit || hardwareData.unit,
      timestamp: hardwareData.timestamp,
      status: hardwareData.status,
      streamName: mapping.streamName
    }
  })

  return (
    <div className={`relative ${className}`}>
      {/* Connection Status Indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1" title={isConnected ? "Connected to hardware" : "Disconnected from hardware"}>
        {isConnected ? (
          <Wifi className="h-3 w-3 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-500" />
        )}
      </div>

      <EnhancedWidgetBase
        widgetId={widgetId}
        title={getDisplayTitle()}
        streamMappings={streamMappings}
        onStreamMappingsChange={onStreamMappingsChange}
        className=""
        refreshRate={100}
      >
        {() => (
          <div className="space-y-3 pt-4">
            {error && (
              <div className="text-center py-2">
                <Badge variant="destructive" className="text-xs">
                  {error}
                </Badge>
              </div>
            )}
            
            {displayData.length === 0 ? (
              <div className="text-center py-8">
                {getSensorIcon()}
                <p className="text-muted-foreground mt-2">
                  {streamMappings.length === 0 ? 'Configure streams' : 'No active streams'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click settings to add hardware streams
                </p>
              </div>
            ) : (
              displayData.map((item, index) => {
              const numericValue = typeof item.value === 'number' ? item.value : 0
              const status = typeof item.value === 'number' ? getValueStatus(numericValue) : 'normal'
              const previousValue = previousValues[index]
              
              // Update previous values for trend calculation
              React.useEffect(() => {
                if (typeof item.value === 'number') {
                  setPreviousValues(prev => {
                    const newValues = [...prev]
                    newValues[index] = numericValue
                    return newValues
                  })
                }
              }, [item.value, index])

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSensorIcon()}
                      <span className="text-sm font-medium">
                        Stream {index + 1}
                      </span>
                      {status !== 'normal' && (
                        <Badge 
                          variant={status === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {status}
                        </Badge>
                      )}
                    </div>
                    
                    {showTrend && typeof previousValue === 'number' && typeof item.value === 'number' && (
                      <div className={`flex items-center gap-1 ${getTrendColor(numericValue, previousValue)}`}>
                        {getTrendIcon(numericValue, previousValue)}
                        <span className="text-xs">
                          {((numericValue - previousValue) / previousValue * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      status === 'critical' ? 'text-red-500' : 
                      status === 'warning' ? 'text-yellow-500' : 
                      'text-foreground'
                    }`}>
                      {formatValue(item.value)}
                      {item.unit && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {item.unit}
                        </span>
                      )}
                    </div>
                    
                    {item.timestamp && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  
                  {/* Status indicator */}
                  <div className="flex justify-center">
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === 'active' ? 'bg-green-500' :
                      item.status === 'error' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </EnhancedWidgetBase>
    </div>
  )
} 