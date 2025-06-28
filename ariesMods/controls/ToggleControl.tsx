import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Power, Lightbulb } from 'lucide-react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'

const ToggleControlComponent: React.FC<AriesModProps> = ({
  id,
  title,
  width,
  height,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(data.value || false)
  const [isConnected, setIsConnected] = useState<boolean>(true)

  useEffect(() => {
    // Simulate connection status
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.1) // 90% uptime simulation
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked)
    
    // Send command to hardware (when real integration is implemented)
    if (onDataRequest) {
      onDataRequest({
        command: 'set_state',
        value: checked,
        deviceId: config.deviceId || 'RELAY_001'
      })
    }

    console.log(`Toggle ${config.deviceId || 'RELAY_001'}: ${checked ? 'ON' : 'OFF'}`)
  }

  const getIcon = () => {
    const iconType = config.iconType || 'power'
    switch (iconType) {
      case 'lightbulb':
        return <Lightbulb className="h-4 w-4" />
      default:
        return <Power className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    if (!isConnected) return 'text-gray-400'
    return isEnabled ? 'text-green-500' : 'text-gray-600'
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <div className={getStatusColor()}>
            {getIcon()}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="text-center space-y-2">
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={!isConnected}
              className="scale-125"
            />
            <div className="text-sm font-medium">
              {isEnabled ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-center">
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Offline'}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <div>Device: {config.deviceId || 'RELAY_001'}</div>
            <div>Type: {config.deviceType || 'Relay'}</div>
            <div>Channel: {config.channel || '1'}</div>
            <div>Last Update: {new Date(data.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const ToggleControlMod: AriesMod = {
  metadata: {
    id: 'toggle-control',
    name: 'ToggleControl',
    displayName: 'Toggle Control',
    description: 'Switch control for relays, lights, and other on/off devices',
    version: '1.0.0',
    author: 'AriesUI Team',
    category: 'control',
    icon: '🔌',
    defaultWidth: 180,
    defaultHeight: 160,
    minWidth: 150,
    minHeight: 140,
    tags: ['toggle', 'switch', 'relay', 'control']
  },
  component: ToggleControlComponent,
  generateDummyData: (): AriesModData => ({
    value: Math.random() > 0.5, // Random on/off state
    timestamp: new Date().toISOString(),
    metadata: {
      deviceType: 'Relay',
      channel: 1,
      voltage: '12V',
      maxCurrent: '10A'
    }
  }),
  validateConfig: (config: Record<string, any>): boolean => {
    // Validate device configuration
    if (config.channel && (typeof config.channel !== 'number' || config.channel < 1 || config.channel > 16)) {
      return false
    }
    if (config.deviceId && typeof config.deviceId !== 'string') {
      return false
    }
    return true
  }
} 