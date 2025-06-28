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

  // Generate initial dummy data if none exists
  useEffect(() => {
    if (widget.ariesModType && !currentData) {
      const dummyData = generateDummyDataForMod(widget.ariesModType)
      if (dummyData) {
        setCurrentData(dummyData)
        onUpdate({ data: dummyData })
      }
    }
  }, [widget.ariesModType, currentData, onUpdate])

  // Periodically generate new dummy data
  useEffect(() => {
    if (!widget.ariesModType || !currentData) return

    const interval = setInterval(() => {
      const newData = generateDummyDataForMod(widget.ariesModType)
      if (newData) {
        setCurrentData(newData)
        onUpdate({ data: newData })
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [widget.ariesModType, onUpdate])

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

  // Render the selected AriesMod component
  const ModComponent = selectedMod.component
  
  if (!currentData) {
    return (
      <Card className={`w-full h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <div className="text-xs text-muted-foreground">Loading data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If in config mode, show configuration interface
  if (isConfigMode) {
    return (
      <Card className={`w-full h-full ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>{selectedMod.metadata.displayName} Configuration</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsConfigMode(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100%-80px)]">
          {selectedMod.metadata.configSchema && Object.entries(selectedMod.metadata.configSchema).map(([key, field]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-xs font-medium">
                {field.label}
              </Label>
              {field.type === 'text' && (
                <Input
                  id={key}
                  value={widget.config?.[key] || field.default || ''}
                  placeholder={field.placeholder}
                  onChange={(e) => handleConfigChange({ [key]: e.target.value })}
                  className="h-8 text-xs"
                />
              )}
              {field.type === 'number' && (
                <Input
                  id={key}
                  type="number"
                  value={widget.config?.[key] || field.default || 0}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  onChange={(e) => handleConfigChange({ [key]: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs"
                />
              )}
              {field.type === 'boolean' && (
                <Switch
                  checked={widget.config?.[key] ?? field.default ?? false}
                  onCheckedChange={(checked) => handleConfigChange({ [key]: checked })}
                />
              )}
              {field.type === 'select' && (
                <Select
                  value={widget.config?.[key] || field.default}
                  onValueChange={(value) => handleConfigChange({ [key]: value })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option: { value: string; label: string }) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {field.type === 'range' && (
                <div className="space-y-2">
                  <Slider
                    value={[widget.config?.[key] || field.default || 50]}
                    onValueChange={([value]) => handleConfigChange({ [key]: value })}
                    min={field.min || 0}
                    max={field.max || 100}
                    step={field.step || 1}
                    className="w-full"
                  />
                  <div className="text-xs text-center text-muted-foreground">
                    {widget.config?.[key] || field.default || 50}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-4">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsConfigMode(false)}
              className="flex-1"
            >
              Done
            </Button>
            <Button 
              size="sm" 
              onClick={refreshData}
              className="flex-1"
            >
              Apply & Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`w-full h-full relative group ${className}`}>
      {/* AriesMod Controls Overlay */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm border border-border/50"
            onClick={refreshData}
            title="Refresh Data"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm border border-border/50"
            onClick={() => setIsSelecting(true)}
            title="Change AriesMod"
          >
            <Zap className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-background/80 backdrop-blur-sm border border-border/50"
            onClick={() => setIsConfigMode(!isConfigMode)}
            title="Configure"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* AriesMod Badge */}
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm border border-border/50">
          {selectedMod.metadata.icon} {selectedMod.metadata.displayName}
        </Badge>
      </div>

      {/* Render the actual AriesMod component */}
      <ModComponent
        id={widget.id}
        title={widget.title}
        width={widget.w}
        height={widget.h}
        data={currentData}
        config={widget.config || {}}
        onConfigChange={handleConfigChange}
        onDataRequest={handleDataRequest}
      />
    </div>
  )
} 