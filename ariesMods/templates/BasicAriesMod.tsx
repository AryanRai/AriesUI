import React from 'react'
import type { AriesMod, AriesModProps, AriesModData } from '@/types/ariesmods'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity } from 'lucide-react'

// Define your AriesMod's configuration interface
export interface BasicAriesModConfig {
  displayValue: string
  showIcon: boolean
  theme: 'default' | 'success' | 'warning' | 'danger'
  updateInterval: number
}

// Default configuration
const defaultConfig: BasicAriesModConfig = {
  displayValue: 'Hello AriesMod!',
  showIcon: true,
  theme: 'default',
  updateInterval: 1000
}

// Main component - this is what gets rendered in the grid
const BasicAriesMod: React.FC<AriesModProps> = ({ 
  id, 
  title, 
  width, 
  height, 
  data, 
  config, 
  onConfigChange,
  onDataRequest 
}) => {
  // Merge default config with user config
  const modConfig = { ...defaultConfig, ...config } as BasicAriesModConfig

  // Get theme colors
  const getThemeColors = () => {
    switch (modConfig.theme) {
      case 'success': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' }
      case 'warning': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' }
      case 'danger': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' }
      default: return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' }
    }
  }

  const colors = getThemeColors()

  // Handle data requests (for real-time data)
  React.useEffect(() => {
    if (onDataRequest) {
      const interval = setInterval(() => {
        onDataRequest({ type: 'basic-data', timestamp: new Date().toISOString() })
      }, modConfig.updateInterval)
      
      return () => clearInterval(interval)
    }
  }, [onDataRequest, modConfig.updateInterval])

  return (
    <Card className={`h-full ${colors.bg} ${colors.border} border-2`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {modConfig.showIcon && <Activity className={`h-4 w-4 ${colors.text}`} />}
            <span className={colors.text}>{title}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            v1.0
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="text-center">
          <div className={`text-lg font-semibold ${colors.text}`}>
            {modConfig.displayValue}
          </div>
          
          {data && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(data.timestamp).toLocaleTimeString()}
              </div>
              {data.value && (
                <div className={`text-sm ${colors.text}`}>
                  Value: {data.value}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Generate dummy data for testing
const generateDummyData = (): AriesModData => {
  return {
    value: Math.floor(Math.random() * 100),
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'basic-ariesmod',
      generated: true
    }
  }
}

// Validate configuration (optional)
const validateConfig = (config: Record<string, any>): boolean => {
  // Check if theme is valid
  if (config.theme && !['default', 'success', 'warning', 'danger'].includes(config.theme)) {
    return false
  }
  
  // Check if updateInterval is a positive number
  if (config.updateInterval && (typeof config.updateInterval !== 'number' || config.updateInterval < 100)) {
    return false
  }
  
  return true
}

// Export your AriesMod - this is what gets registered
export const BasicAriesModTemplate: AriesMod = {
  metadata: {
    id: 'basic-template',
    name: 'BasicTemplate',
    displayName: 'Basic Template',
    description: 'A simple template for creating new AriesMods',
    version: '1.0.0',
    author: 'Your Name',
    category: 'custom', // sensor | control | visualization | utility | custom
    icon: '🔧',
    defaultWidth: 200,
    defaultHeight: 150,
    minWidth: 150,
    minHeight: 100,
    maxWidth: 400,
    maxHeight: 300,
    configSchema: {
      displayValue: {
        type: 'text',
        label: 'Display Value',
        default: 'Hello AriesMod!',
        placeholder: 'Enter text to display'
      },
      showIcon: {
        type: 'boolean',
        label: 'Show Icon',
        default: true
      },
      theme: {
        type: 'select',
        label: 'Theme',
        options: [
          { value: 'default', label: 'Default (Blue)' },
          { value: 'success', label: 'Success (Green)' },
          { value: 'warning', label: 'Warning (Yellow)' },
          { value: 'danger', label: 'Danger (Red)' }
        ],
        default: 'default'
      },
      updateInterval: {
        type: 'number',
        label: 'Update Interval (ms)',
        default: 1000,
        min: 100,
        max: 10000,
        step: 100
      }
    },
    tags: ['template', 'basic', 'example']
  },
  component: BasicAriesMod,
  generateDummyData,
  validateConfig
} 