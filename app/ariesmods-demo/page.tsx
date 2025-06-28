"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AriesModWidget } from '@/components/widgets/ariesmod-widget'
import { AriesModSelector } from '@/components/widgets/ariesmod-selector'
import { ariesModsRegistry, getAllAriesMods } from '@/lib/ariesmods-registry'
import { ARIESMODS_CATEGORIES } from '@/types/ariesmods'
import type { AriesWidget } from '@/types/ariesmods'
import { Zap, Plus, RefreshCw, RotateCcw } from 'lucide-react'

export default function AriesModsDemo() {
  const [demoWidgets, setDemoWidgets] = useState<AriesWidget[]>([])
  const [availableMods, setAvailableMods] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize the AriesMods registry
  useEffect(() => {
    const initializeDemo = async () => {
      try {
        await ariesModsRegistry.initialize()
        const mods = Object.values(getAllAriesMods())
        setAvailableMods(mods)
        
        // Create demo widgets for each category
        const demoWidgets: AriesWidget[] = [
          {
            id: 'demo-temp-sensor',
            type: 'ariesmods',
            ariesModType: 'temperature-sensor',
            title: 'Temperature Sensor',
            x: 50,
            y: 50,
            w: 200,
            h: 200,
            config: { baseTemp: 25, variation: 3, sensorId: 'TEMP_01' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'demo-toggle-control',
            type: 'ariesmods',
            ariesModType: 'toggle-control',
            title: 'LED Control',
            x: 300,
            y: 50,
            w: 180,
            h: 160,
            config: { deviceId: 'LED_001', iconType: 'lightbulb', deviceType: 'LED Strip' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'demo-line-chart',
            type: 'ariesmods',
            ariesModType: 'line-chart',
            title: 'Sensor Data Chart',
            x: 520,
            y: 50,
            w: 300,
            h: 250,
            config: { maxDataPoints: 15, updateInterval: 2000, lineColor: '#10B981', unit: '°C' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'demo-clock',
            type: 'ariesmods',
            ariesModType: 'clock',
            title: 'System Clock',
            x: 50,
            y: 300,
            w: 200,
            h: 180,
            config: { timeFormat: '24h', showDate: true, showUptime: true, location: 'Lab 1' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'demo-selector',
            type: 'ariesmods',
            ariesModType: '',
            title: 'AriesMod Selector Demo',
            x: 300,
            y: 300,
            w: 350,
            h: 400,
            config: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]
        
        setDemoWidgets(demoWidgets)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize AriesMods demo:', error)
        setIsLoading(false)
      }
    }

    initializeDemo()
  }, [])

  const handleWidgetUpdate = (widgetId: string, updates: Partial<AriesWidget>) => {
    setDemoWidgets(prev => 
      prev.map(widget => 
        widget.id === widgetId ? { ...widget, ...updates } : widget
      )
    )
  }

  const addNewWidget = () => {
    const newWidget: AriesWidget = {
      id: `demo-widget-${Date.now()}`,
      type: 'ariesmods',
      ariesModType: '',
      title: 'New AriesMod Widget',
      x: Math.random() * 400 + 50,
      y: Math.random() * 200 + 50,
      w: 200,
      h: 200,
      config: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setDemoWidgets(prev => [...prev, newWidget])
  }

  const resetDemo = () => {
    window.location.reload()
  }

  const refreshAllData = () => {
    setDemoWidgets(prev => 
      prev.map(widget => ({
        ...widget,
        updatedAt: new Date().toISOString()
      }))
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading AriesMods System...</h2>
          <p className="text-muted-foreground">Initializing registry and demo widgets</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-6 w-6 text-blue-600" />
                AriesMods Demo
              </h1>
              <p className="text-muted-foreground">
                Interactive demonstration of the AriesMods plugin system for AriesUI
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={refreshAllData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <Button onClick={addNewWidget} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
              <Button onClick={resetDemo} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{availableMods.length} AriesMods Available</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{demoWidgets.length} Demo Widgets</Badge>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-4">
              {Object.entries(ARIESMODS_CATEGORIES).map(([key, category]) => {
                const count = availableMods.filter(mod => mod.metadata.category === key).length
                return (
                  <div key={key} className="flex items-center gap-1 text-xs">
                    <span>{category.icon}</span>
                    <span>{category.label}: {count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="relative">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
          
          {/* Demo Widgets */}
          <div className="relative min-h-[800px]">
            {demoWidgets.map((widget) => (
              <div
                key={widget.id}
                className="absolute group"
                style={{
                  left: widget.x,
                  top: widget.y,
                  width: widget.w,
                  height: widget.h,
                }}
              >
                {/* Widget Info Badge */}
                <div className="absolute -top-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Badge variant="secondary" className="text-xs">
                    ID: {widget.id.split('-').pop()}
                  </Badge>
                </div>
                
                {/* Delete Button */}
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6"
                    onClick={() => setDemoWidgets(prev => prev.filter(w => w.id !== widget.id))}
                  >
                    ×
                  </Button>
                </div>

                {/* AriesMod Widget */}
                <AriesModWidget
                  widget={widget}
                  onUpdate={(updates) => handleWidgetUpdate(widget.id, updates)}
                  className="border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors"
                />
              </div>
            ))}
          </div>

          {/* Instructions */}
          {demoWidgets.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Card className="w-96">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    No Demo Widgets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Click "Add Widget" to create a new AriesMod widget and explore the system.
                  </p>
                  <Button onClick={addNewWidget} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Widget
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 