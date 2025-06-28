import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Thermometer } from 'lucide-react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'

const TemperatureSensorComponent: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange
}) => {
  const [currentTemp, setCurrentTemp] = useState<number>(data.value || 22.5)
  
  useEffect(() => {
    // Simulate temperature fluctuations with dummy data
    const interval = setInterval(() => {
      const baseTemp = config.baseTemp || 22
      const variation = config.variation || 5
      const newTemp = baseTemp + (Math.random() - 0.5) * variation
      setCurrentTemp(Math.round(newTemp * 10) / 10)
    }, config.updateInterval || 2000)

    return () => clearInterval(interval)
  }, [config])

  const getTemperatureColor = (temp: number) => {
    if (temp < 10) return 'text-blue-600'
    if (temp < 20) return 'text-blue-400'
    if (temp < 30) return 'text-green-500'
    if (temp < 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getTemperatureStatus = (temp: number) => {
    if (temp < 10) return { label: 'Cold', variant: 'default' as const }
    if (temp < 20) return { label: 'Cool', variant: 'secondary' as const }
    if (temp < 30) return { label: 'Normal', variant: 'default' as const }
    if (temp < 40) return { label: 'Warm', variant: 'destructive' as const }
    return { label: 'Hot', variant: 'destructive' as const }
  }

  const status = getTemperatureStatus(currentTemp)

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Thermometer className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className={`text-3xl font-bold ${getTemperatureColor(currentTemp)}`}>
            {currentTemp}°C
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        </div>
        
        <div className="flex justify-center">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div>Sensor ID: {config.sensorId || 'TEMP_001'}</div>
          <div>Unit: {config.unit || '°C'}</div>
          <div>Precision: {config.precision || '±0.1°C'}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export const TemperatureSensorMod: AriesMod = {
  metadata: {
    id: 'temperature-sensor',
    name: 'TemperatureSensor',
    displayName: 'Temperature Sensor',
    description: 'Displays temperature readings with visual status indicators',
    version: '1.0.0',
    author: 'AriesUI Team',
    category: 'sensors',
    icon: '🌡️',
    defaultWidth: 200,
    defaultHeight: 200,
    minWidth: 180,
    minHeight: 150,
    tags: ['temperature', 'sensor', 'monitoring']
  },
  component: TemperatureSensorComponent,
  generateDummyData: (): AriesModData => ({
    value: Math.round((20 + Math.random() * 10) * 10) / 10, // 20-30°C
    timestamp: new Date().toISOString(),
    metadata: {
      sensorType: 'DS18B20',
      location: 'Room 1',
      calibrationDate: '2024-01-15'
    }
  }),
  validateConfig: (config: Record<string, any>): boolean => {
    // Validate configuration parameters
    if (config.baseTemp && (typeof config.baseTemp !== 'number' || config.baseTemp < -50 || config.baseTemp > 100)) {
      return false
    }
    if (config.variation && (typeof config.variation !== 'number' || config.variation < 0 || config.variation > 50)) {
      return false
    }
    return true
  }
} 