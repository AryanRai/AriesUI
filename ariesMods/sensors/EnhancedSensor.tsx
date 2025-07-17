import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Thermometer, Zap, Gauge, Wifi, WifiOff, Activity } from 'lucide-react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'

const EnhancedSensorComponent: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange
}) => {
  const [previousValue, setPreviousValue] = useState<number>(0)
  const [currentValue, setCurrentValue] = useState<number>(data?.value || 0)
  
  useEffect(() => {
    // Use stream data if available, otherwise generate dummy data
    const hasStreamData = data && typeof data.value === 'number'
    
    if (hasStreamData) {
      setPreviousValue(currentValue)
      setCurrentValue(data.value as number)
    } else {
      // Generate dummy data only if no stream data
      const interval = setInterval(() => {
        setPreviousValue(currentValue)
        const baseValue = config.baseValue || 23.5
        const variation = config.variation || 5
        const newValue = baseValue + (Math.random() - 0.5) * variation
        setCurrentValue(Math.round(newValue * 100) / 100)
      }, config.updateInterval || 2000)

      return () => clearInterval(interval)
    }
  }, [data, config, currentValue])

  const getSensorIcon = () => {
    switch (config.sensorType) {
      case 'temperature': return <Thermometer className="h-4 w-4" />
      case 'pressure': return <Gauge className="h-4 w-4" />
      case 'voltage': 
      case 'current': return <Zap className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const formatValue = (value: number): string => {
    const precision = config.precision || 2
    return value.toFixed(precision)
  }

  const getValueStatus = (value: number) => {
    const criticalMin = config.criticalMin || 10
    const criticalMax = config.criticalMax || 40
    const warningMin = config.warningMin || 15
    const warningMax = config.warningMax || 35
    
    if (value <= criticalMin || value >= criticalMax) return 'critical'
    if (value <= warningMin || value >= warningMax) return 'warning'
    return 'normal'
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (previous === 0) return <Minus className="h-3 w-3" />
    
    const diff = current - previous
    const threshold = Math.abs(current) * 0.01 // 1% change threshold
    
    if (Math.abs(diff) < threshold) return <Minus className="h-3 w-3" />
    return diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
  }

  const getTrendColor = (current: number, previous: number) => {
    if (previous === 0) return 'text-muted-foreground'
    
    const diff = current - previous
    const threshold = Math.abs(current) * 0.01
    
    if (Math.abs(diff) < threshold) return 'text-muted-foreground'
    return diff > 0 ? 'text-green-500' : 'text-red-500'
  }

  const getTrendPercentage = (current: number, previous: number): string => {
    if (previous === 0) return '0.0'
    return ((current - previous) / Math.abs(previous) * 100).toFixed(1)
  }

  const status = getValueStatus(currentValue)
  const hasStreamData = data && typeof data.value === 'number'
  const displayUnit = data?.metadata?.unit || config.unit || ''
  const sensorName = config.sensorName || title || 'Enhanced Sensor'
  const showTrend = config.showTrend !== false && previousValue !== 0

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {getSensorIcon()}
            {sensorName}
          </div>
          <div className="flex items-center gap-1">
            {hasStreamData ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <Badge variant="outline" className="text-xs">Live</Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-orange-500" />
                <Badge variant="outline" className="text-xs">Demo</Badge>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className={`text-3xl font-bold ${
            status === 'critical' ? 'text-red-500' : 
            status === 'warning' ? 'text-yellow-500' : 
            'text-green-500'
          }`}>
            {formatValue(currentValue)}{displayUnit && <span className="text-lg text-muted-foreground ml-1">{displayUnit}</span>}
          </div>
          <div className="text-sm text-muted-foreground">
            {hasStreamData ? 'Live Hardware Stream' : 'Demo Data'}
          </div>
          {data?.timestamp && (
            <div className="text-xs text-muted-foreground">
              {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
        
        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge variant={
            status === 'critical' ? 'destructive' : 
            status === 'warning' ? 'secondary' : 
            'default'
          }>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        {/* Trend Analysis */}
        {showTrend && (
          <div className={`flex items-center justify-center gap-1 text-sm ${getTrendColor(currentValue, previousValue)}`}>
            {getTrendIcon(currentValue, previousValue)}
            <span>{getTrendPercentage(currentValue, previousValue)}%</span>
            <span className="text-xs text-muted-foreground">vs prev</span>
          </div>
        )}

        {/* Extended info for larger widgets */}
        {width > 200 && height > 160 && (
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <div>Sensor: {config.sensorType || 'Generic'}</div>
            <div>Range: {config.criticalMin || 0} - {config.criticalMax || 100}</div>
            {config.precision && <div>Precision: {config.precision} decimals</div>}
            {hasStreamData && data?.metadata?.streamId && (
              <div>Stream ID: {data.metadata.streamId}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const EnhancedSensorMod: AriesMod = {
  metadata: {
    id: 'enhanced-sensor',
    name: 'EnhancedSensor',
    displayName: 'Enhanced Sensor',
    description: 'Advanced sensor display with trend analysis, thresholds, and multiple sensor types',
    version: '1.0.0',
    author: 'AriesUI Team',
    category: 'sensors',
    icon: '🌡️',
    defaultWidth: 250,
    defaultHeight: 200,
    minWidth: 180,
    minHeight: 140,
    tags: ['sensor', 'monitoring', 'hardware', 'trend', 'thresholds'],
    configSchema: {
      sensorName: {
        type: 'text',
        label: 'Sensor Name',
        default: 'Enhanced Sensor',
        placeholder: 'e.g., Chamber Temperature'
      },
      sensorType: {
        type: 'select',
        label: 'Sensor Type',
        default: 'generic',
        options: [
          { value: 'temperature', label: 'Temperature' },
          { value: 'pressure', label: 'Pressure' },
          { value: 'voltage', label: 'Voltage' },
          { value: 'current', label: 'Current' },
          { value: 'generic', label: 'Generic' }
        ]
      },
      unit: {
        type: 'text',
        label: 'Unit',
        default: '',
        placeholder: 'e.g., °C, %, V, A, PSI'
      },
      precision: {
        type: 'number',
        label: 'Decimal Precision',
        default: 2,
        min: 0,
        max: 10
      },
      baseValue: {
        type: 'number',
        label: 'Base Value (Demo)',
        default: 23.5,
        placeholder: 'Center value for dummy data'
      },
      variation: {
        type: 'number',
        label: 'Variation Range (Demo)',
        default: 5,
        min: 0,
        placeholder: 'Random variation range'
      },
      criticalMin: {
        type: 'number',
        label: 'Critical Minimum',
        default: 10,
        placeholder: 'Critical low threshold'
      },
      criticalMax: {
        type: 'number',
        label: 'Critical Maximum',
        default: 40,
        placeholder: 'Critical high threshold'
      },
      warningMin: {
        type: 'number',
        label: 'Warning Minimum',
        default: 15,
        placeholder: 'Warning low threshold'
      },
      warningMax: {
        type: 'number',
        label: 'Warning Maximum',
        default: 35,
        placeholder: 'Warning high threshold'
      },
      showTrend: {
        type: 'boolean',
        label: 'Show Trend Analysis',
        default: true
      },
      updateInterval: {
        type: 'number',
        label: 'Update Interval (ms)',
        default: 2000,
        min: 100,
        max: 60000,
        placeholder: 'Milliseconds between updates'
      }
    }
  },
  component: EnhancedSensorComponent,
  generateDummyData: (): AriesModData => ({
    value: Math.round((Math.random() * 30 + 10) * 100) / 100, // 10-40 with 2 decimals
    timestamp: new Date().toISOString(),
    metadata: {
      sensorType: 'Enhanced',
      location: 'Hardware Module',
      unit: '°C',
      streamId: 'enhanced_sensor_001'
    }
  }),
  validateConfig: (config: Record<string, any>): boolean => {
    // Validate configuration parameters
    if (config.baseValue && typeof config.baseValue !== 'number') return false
    if (config.variation && (typeof config.variation !== 'number' || config.variation < 0)) return false
    if (config.precision && (typeof config.precision !== 'number' || config.precision < 0 || config.precision > 10)) return false
    if (config.updateInterval && (typeof config.updateInterval !== 'number' || config.updateInterval < 100)) return false
    
    // Validate thresholds
    const { criticalMin, criticalMax, warningMin, warningMax } = config
    if (criticalMin !== undefined && criticalMax !== undefined && criticalMin >= criticalMax) return false
    if (warningMin !== undefined && warningMax !== undefined && warningMin >= warningMax) return false
    
    return true
  }
}