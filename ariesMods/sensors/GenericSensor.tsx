import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'

const GenericSensorComponent: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange
}) => {
  const [currentValue, setCurrentValue] = useState<number>(data?.value || 0)
  
  useEffect(() => {
    // Use stream data if available, otherwise generate dummy data
    const hasStreamData = data && typeof data.value === 'number'
    
    if (hasStreamData) {
      setCurrentValue(data.value as number)
    } else {
      // Generate dummy data only if no stream data
      const interval = setInterval(() => {
        const baseValue = config.baseValue || 50
        const variation = config.variation || 20
        const newValue = baseValue + (Math.random() - 0.5) * variation
        setCurrentValue(Math.round(newValue * 100) / 100)
      }, config.updateInterval || 2000)

      return () => clearInterval(interval)
    }
  }, [data, config])

  const getStatusColor = (value: number) => {
    const warningMin = config.warningMin || 20
    const warningMax = config.warningMax || 80
    const criticalMin = config.criticalMin || 10
    const criticalMax = config.criticalMax || 90
    
    if (value <= criticalMin || value >= criticalMax) return 'text-red-500'
    if (value <= warningMin || value >= warningMax) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusInfo = (value: number) => {
    const warningMin = config.warningMin || 20
    const warningMax = config.warningMax || 80
    const criticalMin = config.criticalMin || 10
    const criticalMax = config.criticalMax || 90
    
    if (value <= criticalMin || value >= criticalMax) {
      return { 
        label: 'Critical', 
        variant: 'destructive' as const, 
        icon: AlertTriangle 
      }
    }
    if (value <= warningMin || value >= warningMax) {
      return { 
        label: 'Warning', 
        variant: 'secondary' as const, 
        icon: AlertTriangle 
      }
    }
    return { 
      label: 'Normal', 
      variant: 'default' as const, 
      icon: CheckCircle 
    }
  }

  const status = getStatusInfo(currentValue)
  const hasStreamData = data && typeof data.value === 'number'
  const displayUnit = data?.metadata?.unit || config.unit || ''
  const precision = config.precision || 2
  const displayValue = Number(currentValue).toFixed(precision)
  const StatusIcon = status.icon

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {title || 'Generic Sensor'}
          </div>
          {hasStreamData && (
            <Badge variant="outline" className="text-xs">
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className={`text-3xl font-bold ${getStatusColor(currentValue)}`}>
            {displayValue}{displayUnit}
          </div>
          <div className="text-sm text-muted-foreground">
            {hasStreamData ? 'Live Stream' : 'Demo Data'}
          </div>
          <div className="text-xs text-muted-foreground">
            {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'No timestamp'}
          </div>
        </div>
        
        <div className="flex justify-center items-center gap-2">
          <StatusIcon className="h-4 w-4" />
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {width > 180 && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Sensor ID: {config.sensorId || data?.metadata?.sensorId || 'SENSOR_001'}</div>
            <div>Type: {config.sensorType || data?.metadata?.sensorType || 'Generic'}</div>
            {displayUnit && <div>Unit: {displayUnit}</div>}
            <div>Range: {config.criticalMin || 0} - {config.criticalMax || 100}</div>
            {hasStreamData && (
              <div>Source: {data?.metadata?.streamId || 'Hardware Stream'}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const GenericSensorMod: AriesMod = {
  metadata: {
    id: 'generic-sensor',
    name: 'GenericSensor',
    displayName: 'Generic Sensor',
    description: 'Configurable sensor display for any type of numeric data with thresholds',
    version: '1.0.0',
    author: 'AriesUI Team',
    category: 'sensors',
    icon: '📊',
    defaultWidth: 200,
    defaultHeight: 200,
    minWidth: 160,
    minHeight: 140,
    tags: ['sensor', 'monitoring', 'generic', 'configurable'],
    configSchema: {
      sensorType: {
        type: 'text',
        label: 'Sensor Type',
        default: 'Generic',
        placeholder: 'e.g., Temperature, Pressure, Voltage'
      },
      unit: {
        type: 'text',
        label: 'Unit',
        default: '',
        placeholder: 'e.g., °C, %, V, A'
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
        default: 50,
        placeholder: 'Center value for dummy data'
      },
      variation: {
        type: 'number',
        label: 'Variation Range (Demo)',
        default: 20,
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
        default: 90,
        placeholder: 'Critical high threshold'
      },
      warningMin: {
        type: 'number',
        label: 'Warning Minimum',
        default: 20,
        placeholder: 'Warning low threshold'
      },
      warningMax: {
        type: 'number',
        label: 'Warning Maximum',
        default: 80,
        placeholder: 'Warning high threshold'
      }
    }
  },
  component: GenericSensorComponent,
  generateDummyData: (): AriesModData => ({
    value: Math.round((Math.random() * 100) * 100) / 100, // 0-100 with 2 decimals
    timestamp: new Date().toISOString(),
    metadata: {
      sensorType: 'Generic',
      location: 'Device 1',
      unit: '%'
    }
  }),
  validateConfig: (config: Record<string, any>): boolean => {
    // Validate configuration parameters
    if (config.baseValue && typeof config.baseValue !== 'number') return false
    if (config.variation && (typeof config.variation !== 'number' || config.variation < 0)) return false
    if (config.precision && (typeof config.precision !== 'number' || config.precision < 0 || config.precision > 10)) return false
    
    // Validate thresholds
    const { criticalMin, criticalMax, warningMin, warningMax } = config
    if (criticalMin !== undefined && criticalMax !== undefined && criticalMin >= criticalMax) return false
    if (warningMin !== undefined && warningMax !== undefined && warningMin >= warningMax) return false
    
    return true
  }
} 