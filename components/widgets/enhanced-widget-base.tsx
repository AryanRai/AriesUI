"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Zap, ZapOff, AlertCircle, TestTube, GripVertical } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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
  children: (data: WidgetData[], isConnected: boolean, isDummyMode: boolean) => React.ReactNode
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
  const [isDummyMode, setIsDummyMode] = useState(true) // Toggle for dummy data

  // Stabilize streamMappings to prevent useEffect dependency issues
  const stableStreamMappings = useMemo(() => streamMappings, [JSON.stringify(streamMappings)])

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

      stableStreamMappings.forEach(mapping => {
        if (!mapping.enabled) return

        if (isDummyMode) {
          // Generate dummy data for testing
          const mockStreamValue = Math.random() * 100 // Generate random data for demo
          const processedValue = processStreamValue(mockStreamValue, mapping)
          
          newData.push({
            value: processedValue,
            unit: mapping.unit,
            timestamp: new Date().toISOString(),
            status: 'active' // Mock status
          })
        } else {
          // Real stream data would go here
          // Mock stream data since activeStreams doesn't exist in current CommsState
          // In a real implementation, this would connect to the actual stream data
          const mockStreamValue = Math.random() * 100 // Generate random data for demo
          const processedValue = processStreamValue(mockStreamValue, mapping)
          
          newData.push({
            value: processedValue,
            unit: mapping.unit,
            timestamp: new Date().toISOString(),
            status: 'active' // Mock status
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
  }, [stableStreamMappings, refreshRate, processStreamValue, isDummyMode])

  const isConnected = useMemo(() => {
    // Mock connection status - in real implementation this would check actual connection
    return !isDummyMode && stableStreamMappings.some(m => m.enabled)
  }, [stableStreamMappings, isDummyMode])

  const hasActiveStreams = useMemo(() => {
    return stableStreamMappings.filter(m => m.enabled).length > 0
  }, [stableStreamMappings])

  const hasErrors = useMemo(() => {
    return widgetData.some(d => d.status === 'error')
  }, [widgetData])

  // Stable handlers to prevent re-renders and infinite loops
  const handleOpenChange = useCallback((open: boolean) => {
    console.log('Dialog open change:', open)
    setIsConfigOpen(open)
  }, [])

  const handleSettingsClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling to parent drag handler
    console.log('Settings button clicked - opening dialog')
    setIsConfigOpen(true)
  }, [])

  const handleDummyToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDummyMode(!isDummyMode)
  }, [isDummyMode])

  const handleMappingsChange = useCallback((mappings: StreamMapping[]) => {
    console.log('Mappings changed:', mappings)
    onStreamMappingsChange?.(mappings)
    setIsConfigOpen(false)
  }, [onStreamMappingsChange])

  const handleDialogClose = useCallback(() => {
    console.log('Dialog closing')
    setIsConfigOpen(false)
  }, [])

  // Memoize dialog content to prevent re-renders
  const dialogContent = useMemo(() => {
    if (!isConfigOpen) return null
    
    return (
      <StreamConfigurator
        widgetId={widgetId}
        currentMappings={stableStreamMappings}
        onMappingsChange={handleMappingsChange}
        onClose={handleDialogClose}
      />
    )
  }, [isConfigOpen, widgetId, stableStreamMappings, handleMappingsChange, handleDialogClose])

  return (
    <Card className={`relative ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{title}</h3>
            
            {/* Drag Handle */}
            <div 
              className="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded transition-colors border border-muted-foreground/20"
              data-drag-handle="true"
              title="Drag to move widget"
              onMouseEnter={() => console.log('Drag handle hover')}
              onMouseDown={(e) => {
                console.log('Drag handle mousedown event')
                // Allow event to bubble to parent for drag handling
              }}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
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
            {isDummyMode && (
              <Badge variant="outline" className="text-xs">
                <TestTube className="h-3 w-3 mr-1" />
                Dummy
              </Badge>
            )}
            {hasErrors && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 z-10 relative"
              title={isDummyMode ? "Switch to Live Data" : "Switch to Dummy Data"}
              onClick={handleDummyToggle}
            >
              <TestTube className={`h-4 w-4 ${isDummyMode ? 'text-orange-500' : 'text-muted-foreground'}`} />
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 z-10 relative settings-button"
              title="Configure Hardware Streams"
              data-settings-button="true"
              onClick={handleSettingsClick}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Settings button mousedown - preventing drag')
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Stream Status */}
        {hasActiveStreams && (
          <div className="text-xs text-muted-foreground">
            {stableStreamMappings.filter(m => m.enabled).length} stream(s) • Last: {lastUpdate} • Mode: {isDummyMode ? 'Dummy' : 'Live'}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {children(widgetData, isConnected, isDummyMode)}
        
        {/* No streams configured message */}
        {!hasActiveStreams && (
          <div className="text-center py-4 text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hardware streams configured</p>
            <p className="text-xs">Click the settings icon to connect to hardware</p>
          </div>
        )}
      </CardContent>

      {/* Dialog rendered outside of the card to prevent infinite loops */}
      {isConfigOpen && (
        <Dialog open={isConfigOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <VisuallyHidden>
              <DialogTitle>Hardware Stream Configuration</DialogTitle>
            </VisuallyHidden>
            {dialogContent}
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
} 