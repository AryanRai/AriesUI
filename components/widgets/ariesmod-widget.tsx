import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Settings, Zap, RefreshCw, AlertTriangle, X } from 'lucide-react'
import { AriesModSelector } from './ariesmod-selector'
import { EnhancedWidgetBase } from './enhanced-widget-base'
import { getAriesMod, generateDummyDataForMod } from '@/lib/ariesmods-registry'
import type { AriesWidget, AriesModData } from '@/types/ariesmods'

interface AriesModWidgetProps {
  widget: AriesWidget
  onUpdate: (updates: Partial<AriesWidget>) => void
  className?: string
}

export const AriesModWidget: React.FC<AriesModWidgetProps> = ({
  widget,
  onUpdate,
  className = ''
}) => {
  const [isSelecting, setIsSelecting] = useState<boolean>(!widget.ariesModType)
  const [currentData, setCurrentData] = useState<AriesModData | null>(widget.data || null)
  const [isConfigMode, setIsConfigMode] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Generate initial dummy data if none exists and no streams are configured
  useEffect(() => {
    if (widget.ariesModType && !currentData && (!widget.streamMappings || widget.streamMappings.length === 0)) {
      const dummyData = generateDummyDataForMod(widget.ariesModType)
      if (dummyData) {
        setCurrentData(dummyData)
        onUpdate({ data: dummyData })
      }
    }
  }, [widget.ariesModType, currentData, onUpdate, widget.streamMappings])

  // Periodically generate new dummy data ONLY if no streams are configured
  useEffect(() => {
    if (!widget.ariesModType || !currentData) return
    
    // Don't generate dummy data if streams are configured
    const hasActiveStreams = widget.streamMappings && widget.streamMappings.some(m => m.enabled)
    if (hasActiveStreams) return

    const interval = setInterval(() => {
      const newData = generateDummyDataForMod(widget.ariesModType)
      if (newData) {
        setCurrentData(newData)
        onUpdate({ data: newData })
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [widget.ariesModType, onUpdate, widget.streamMappings])

  const handleModSelect = (modId: string) => {
    const mod = getAriesMod(modId)
    if (!mod) {
      setError(`AriesMod "${modId}" not found`)
      return
    }

    // Initialize with default config and dummy data
    const dummyData = generateDummyDataForMod(modId)
    const defaultConfig = {
      // Add any default configuration based on the mod
      ...widget.config
    }

    onUpdate({
      ariesModType: modId,
      title: widget.title || mod.metadata.displayName,
      w: Math.max(widget.w, mod.metadata.defaultWidth || 200),
      h: Math.max(widget.h, mod.metadata.defaultHeight || 200),
      config: defaultConfig,
      data: dummyData || undefined,
      streamMappings: widget.streamMappings || [],
      updatedAt: new Date().toISOString()
    })

    setCurrentData(dummyData)
    setIsSelecting(false)
    setError(null)
  }

  const handleConfigChange = (newConfig: Record<string, any>) => {
    onUpdate({
      config: { ...widget.config, ...newConfig },
      updatedAt: new Date().toISOString()
    })
  }

  const handleStreamMappingsChange = (mappings: any[]) => {
    onUpdate({
      streamMappings: mappings,
      updatedAt: new Date().toISOString()
    })
  }

  const handleDataRequest = (params: any) => {
    // This would send commands to hardware when real integration is implemented
    console.log('AriesMod data request:', params)
  }

  const refreshData = () => {
    if (widget.ariesModType) {
      const newData = generateDummyDataForMod(widget.ariesModType)
      if (newData) {
        setCurrentData(newData)
        onUpdate({ data: newData })
      }
    }
  }

  // If in selection mode, show the selector
  if (isSelecting) {
    return (
      <div className={`w-full h-full ${className}`}>
        <AriesModSelector
          onSelect={handleModSelect}
          selectedModId={widget.ariesModType}
          className="h-full"
        />
      </div>
    )
  }

  // If no AriesMod selected, show placeholder
  if (!widget.ariesModType) {
    return (
      <Card className={`w-full h-full ${className}`}>
        <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="text-center space-y-2">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="font-medium">No AriesMod Selected</h3>
            <p className="text-sm text-muted-foreground">
              Choose an AriesMod to display data and controls
            </p>
          </div>
          <Button 
            onClick={() => setIsSelecting(true)}
            className="mt-4"
          >
            <Zap className="h-4 w-4 mr-2" />
            Select AriesMod
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Get the selected AriesMod
  const selectedMod = getAriesMod(widget.ariesModType)
  if (!selectedMod) {
    return (
      <Card className={`w-full h-full ${className} border-red-200`}>
        <CardContent className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="text-center space-y-2">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500" />
            <h3 className="font-medium text-red-700">AriesMod Error</h3>
            <p className="text-sm text-red-600">
              AriesMod "{widget.ariesModType}" not found
            </p>
          </div>
          <Button 
            onClick={() => setIsSelecting(true)}
            variant="outline"
          >
            Select Different AriesMod
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card className={`w-full h-full ${className} border-red-200`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="text-red-700">Error</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  // Render the AriesMod with stream integration
  return (
    <EnhancedWidgetBase
      widgetId={widget.id}
      title={widget.title || selectedMod.metadata.displayName}
      className={className}
      streamMappings={widget.streamMappings || []}
      onStreamMappingsChange={handleStreamMappingsChange}
      refreshRate={100}
    >
      {(streamData, isConnected, isDummyMode) => {
        // Convert stream data to AriesModData format, or use dummy data based on mode
        const ariesModData: AriesModData = isDummyMode || streamData.length === 0 ? 
          currentData || {
            value: Math.random() * 100, // Generate dummy data
            timestamp: new Date().toISOString(),
            metadata: { isDummy: true }
          } : {
            value: streamData[0].value,
            timestamp: streamData[0].timestamp || new Date().toISOString(),
            metadata: {
              unit: streamData[0].unit || '',
              status: streamData[0].status || 'active',
              streamCount: streamData.length,
              isDummy: false
            }
          }

        // Render the AriesMod component with stream data
        const ModComponent = selectedMod.component
        
        return (
          <div className="w-full h-full">
            <ModComponent
              id={widget.id}
              title={widget.title || selectedMod.metadata.displayName}
              width={widget.w}
              height={widget.h}
              data={ariesModData}
              config={widget.config || {}}
              onConfigChange={handleConfigChange}
              onDataRequest={handleDataRequest}
            />
          </div>
        )
      }}
    </EnhancedWidgetBase>
  )
} 