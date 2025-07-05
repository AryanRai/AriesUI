"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Zap, ZapOff, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { StreamConfigurator } from './stream-configurator'
import { useComms } from '@/components/comms-context'

interface StreamMapping {
  id: string
  streamId: string
  streamName: string
  multiplier: number
  formula: string
  unit: string
  enabled: boolean
}

interface WidgetData {
  value: number | string | boolean
  unit?: string
  timestamp?: string
  status: 'active' | 'inactive' | 'error'
}

interface EnhancedWidgetBaseProps {
  widgetId: string
  title: string
  children: (data: WidgetData[], isConnected: boolean) => React.ReactNode
  className?: string
  streamMappings?: StreamMapping[]
  onStreamMappingsChange?: (mappings: StreamMapping[]) => void
  refreshRate?: number // ms
}

export function EnhancedWidgetBase({
  widgetId,
  title,
  children,
  className = "",
  streamMappings = [],
  onStreamMappingsChange,
  refreshRate = 100
}: EnhancedWidgetBaseProps) {
  const { state } = useComms()
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [widgetData, setWidgetData] = useState<WidgetData[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')

  // Process stream data with formulas and multipliers
  const processStreamValue = useCallback((value: any, mapping: StreamMapping): number | string | boolean => {
    if (typeof value !== 'number') return value

    let processedValue = value

    // Apply multiplier
    if (mapping.multiplier !== 1) {
      processedValue = value * mapping.multiplier
    }

    // Apply formula if provided
    if (mapping.formula && mapping.formula.trim()) {
      try {
        // Replace 'x' with the value in the formula
        const formula = mapping.formula.replace(/x/g, processedValue.toString())
        processedValue = eval(formula)
      } catch (error) {
        console.warn(`Formula error for widget ${widgetId}:`, error)
        return value // Return original value if formula fails
      }
    }

    return processedValue
  }, [widgetId])

  // Update widget data from streams
  useEffect(() => {
    const updateData = () => {
      const newData: WidgetData[] = []

      streamMappings.forEach(mapping => {
        if (!mapping.enabled) return

        const stream = state.activeStreams?.get(mapping.streamId)
        if (stream) {
          const processedValue = processStreamValue(stream.value, mapping)
          
          newData.push({
            value: processedValue,
            unit: mapping.unit || stream.unit,
            timestamp: stream['stream-update-timestamp'],
            status: stream.status
          })
        } else {
          // Stream not available
          newData.push({
            value: 'No Data',
            unit: mapping.unit,
            timestamp: new Date().toISOString(),
            status: 'inactive'
          })
        }
      })

      setWidgetData(newData)
      setLastUpdate(new Date().toLocaleTimeString())
    }

    // Initial update
    updateData()

    // Set up refresh interval
    const interval = setInterval(updateData, refreshRate)

    return () => clearInterval(interval)
  }, [streamMappings, state.activeStreams, refreshRate, processStreamValue])

  const isConnected = useMemo(() => {
    return state.connectionStatus === 'connected' && streamMappings.some(m => m.enabled)
  }, [state.connectionStatus, streamMappings])

  const hasActiveStreams = useMemo(() => {
    return streamMappings.filter(m => m.enabled).length > 0
  }, [streamMappings])

  const hasErrors = useMemo(() => {
    return widgetData.some(d => d.status === 'error')
  }, [widgetData])

  // Memoize the dialog content to prevent re-renders
  const dialogContent = useMemo(() => {
    if (!isConfigOpen) return null
    
    return (
      <StreamConfigurator
        widgetId={widgetId}
        currentMappings={streamMappings}
        onMappingsChange={(mappings) => {
          onStreamMappingsChange?.(mappings)
          setIsConfigOpen(false)
        }}
        onClose={() => setIsConfigOpen(false)}
      />
    )
  }, [isConfigOpen, widgetId, streamMappings, onStreamMappingsChange])

  // Stable handlers to prevent re-renders
  const handleOpenChange = useCallback((open: boolean) => {
    setIsConfigOpen(open)
  }, [])

  const handleSettingsClick = useCallback(() => {
    setIsConfigOpen(true)
  }, [])

  return (
    <Card className={`relative ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{title}</h3>
            {hasActiveStreams && (
              <Badge 
                variant={isConnected ? "default" : "secondary"}
                className="text-xs"
              >
                {isConnected ? (
                  <><Zap className="h-3 w-3 mr-1" />Live</>
                ) : (
                  <><ZapOff className="h-3 w-3 mr-1" />Offline</>
                )}
              </Badge>
            )}
            {hasErrors && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
          </div>
          
          <Dialog open={isConfigOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                title="Configure Hardware Streams"
                onClick={handleSettingsClick}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <VisuallyHidden>
                <DialogTitle>Hardware Stream Configuration</DialogTitle>
              </VisuallyHidden>
              {dialogContent}
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Stream Status */}
        {hasActiveStreams && (
          <div className="text-xs text-muted-foreground">
            {streamMappings.filter(m => m.enabled).length} stream(s) • Last: {lastUpdate}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {children(widgetData, isConnected)}
        
        {/* No streams configured message */}
        {!hasActiveStreams && (
          <div className="text-center py-4 text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hardware streams configured</p>
            <p className="text-xs">Click the settings icon to connect to hardware</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 