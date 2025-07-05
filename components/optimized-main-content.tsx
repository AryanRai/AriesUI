"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Settings, Hash, GripVertical, Grid3X3, Terminal, Zap, Activity } from "lucide-react"
import { useComms } from "@/components/comms-context"
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"
import { useVirtualGrid } from "@/hooks/use-virtual-grid"
import { usePerformanceOptimization } from "@/hooks/use-performance-optimization"
import { VirtualizedGrid } from "@/components/virtualized-grid"
import { OptimizedWidget } from "@/components/optimized-widget"
import { LazyComponent } from "@/components/lazy-component"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { AriesModWidget } from "@/components/widgets/ariesmod-widget"
import { FloatingToolbar } from "@/components/floating-toolbar-merged"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useThemeColors } from "@/hooks/use-theme-colors"
import type { AriesWidget, NestedAriesWidget } from "@/types/ariesmods"

// Types
interface BaseWidget {
  id: string
  type: string
  title: string
  content: string
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
}

interface MainGridWidget extends BaseWidget {
  container: "main"
}

interface NestedWidget extends BaseWidget {
  container: "nest"
  nestId: string
}

interface NestContainer {
  id: string
  type: string
  title: string
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
}

interface GridState {
  mainWidgets: MainGridWidget[]
  nestContainers: NestContainer[]
  nestedWidgets: NestedWidget[]
  mainAriesWidgets: AriesWidget[]
  nestedAriesWidgets: NestedAriesWidget[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  gridSize: number
  lastSaved: string | null
  version: string
}

interface OptimizedMainContentProps {
  gridState: GridState
  setGridState: React.Dispatch<React.SetStateAction<GridState>>
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  WIDGET_COUNT_FOR_VIRTUALIZATION: 50,
  FPS_THRESHOLD_FOR_OPTIMIZATION: 30,
  MEMORY_THRESHOLD_MB: 512,
  RENDER_BATCH_SIZE: 10,
  LAZY_RENDER_THRESHOLD: 20
}

export function OptimizedMainContent({ gridState, setGridState }: OptimizedMainContentProps) {
  const { state } = useComms()
  const { reduceMotion } = useAnimationPreferences()
  const { themeColors } = useThemeColors()
  
  // State management
  const [viewport, setViewport] = useState(gridState.viewport)
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false)
  const [performanceMode, setPerformanceMode] = useState<"auto" | "high" | "balanced">("auto")
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
  
  // Performance optimizations
  const {
    isOptimizing,
    performanceMetrics,
    enableOptimizations,
    disableOptimizations,
    getBatchedUpdates,
    scheduleUpdate,
    getCurrentBatch
  } = usePerformanceOptimization({
    targetFPS: 60,
    memoryThreshold: PERFORMANCE_THRESHOLDS.MEMORY_THRESHOLD_MB,
    batchSize: PERFORMANCE_THRESHOLDS.RENDER_BATCH_SIZE
  })
  
  // Virtual grid for large datasets
  const {
    visibleItems,
    scrollToItem,
    getVirtualBounds,
    updateViewport: updateVirtualViewport,
    spatialIndex
  } = useVirtualGrid({
    items: [
      ...gridState.mainWidgets,
      ...gridState.nestContainers,
      ...gridState.mainAriesWidgets
    ],
    containerSize: { width: window.innerWidth, height: window.innerHeight },
    itemSize: { width: 200, height: 150 },
    overscan: 5,
    onItemsChange: useCallback((items) => {
      // Update only visible items to optimize rendering
      scheduleUpdate(() => {
        console.log('Updating visible items:', items.length)
      })
    }, [scheduleUpdate])
  })
  
  // Auto-save and persistence
  const [autoSaveEnabled, setAutoSaveEnabled] = useLocalStorage('grid-auto-save', true)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  
  // Calculate total widget count
  const totalWidgets = useMemo(() => {
    return gridState.mainWidgets.length + 
           gridState.nestedWidgets.length + 
           gridState.mainAriesWidgets.length + 
           gridState.nestedAriesWidgets.length
  }, [gridState.mainWidgets, gridState.nestedWidgets, gridState.mainAriesWidgets, gridState.nestedAriesWidgets])
  
  // Determine if we should use virtualization
  const shouldVirtualize = useMemo(() => {
    return totalWidgets > PERFORMANCE_THRESHOLDS.WIDGET_COUNT_FOR_VIRTUALIZATION ||
           performanceMetrics.fps < PERFORMANCE_THRESHOLDS.FPS_THRESHOLD_FOR_OPTIMIZATION ||
           performanceMetrics.memoryUsage > PERFORMANCE_THRESHOLDS.MEMORY_THRESHOLD_MB
  }, [totalWidgets, performanceMetrics])
  
  // Auto-enable optimizations based on performance
  useEffect(() => {
    if (performanceMode === "auto") {
      if (shouldVirtualize && !isOptimizing) {
        enableOptimizations()
      } else if (!shouldVirtualize && isOptimizing) {
        disableOptimizations()
      }
    }
  }, [shouldVirtualize, isOptimizing, performanceMode, enableOptimizations, disableOptimizations])
  
  // Update virtual viewport when viewport changes
  useEffect(() => {
    updateVirtualViewport(viewport)
  }, [viewport, updateVirtualViewport])
  
  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return
    
    const timeoutId = setTimeout(() => {
      setLastSaved(new Date().toISOString())
      // Save to localStorage or backend
      localStorage.setItem('grid-state', JSON.stringify(gridState))
    }, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [gridState, autoSaveEnabled])
  
  // Widget management functions
  const addWidget = useCallback((type: string = "standard") => {
    const newWidget: MainGridWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: `Widget ${totalWidgets + 1}`,
      content: "New widget content",
      x: Math.random() * 400,
      y: Math.random() * 400,
      w: 200,
      h: 150,
      container: "main",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setGridState(prev => ({
      ...prev,
      mainWidgets: [...prev.mainWidgets, newWidget]
    }))
  }, [totalWidgets, setGridState])
  
  const removeWidget = useCallback((id: string) => {
    setGridState(prev => ({
      ...prev,
      mainWidgets: prev.mainWidgets.filter(w => w.id !== id),
      nestedWidgets: prev.nestedWidgets.filter(w => w.id !== id),
      mainAriesWidgets: prev.mainAriesWidgets.filter(w => w.id !== id),
      nestedAriesWidgets: prev.nestedAriesWidgets.filter(w => w.id !== id)
    }))
  }, [setGridState])
  
  const updateWidget = useCallback((id: string, updates: Partial<BaseWidget>) => {
    setGridState(prev => ({
      ...prev,
      mainWidgets: prev.mainWidgets.map(w => 
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ),
      nestedWidgets: prev.nestedWidgets.map(w => 
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ),
      mainAriesWidgets: prev.mainAriesWidgets.map(w => 
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ),
      nestedAriesWidgets: prev.nestedAriesWidgets.map(w => 
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      )
    }))
  }, [setGridState])
  
  // Render optimized widget
  const renderWidget = useCallback((widget: any, index: number) => {
    const isVisible = visibleItems.includes(widget.id)
    const shouldLazyRender = index > PERFORMANCE_THRESHOLDS.LAZY_RENDER_THRESHOLD
    
    if (shouldLazyRender && !isVisible) {
      return (
        <LazyComponent
          key={widget.id}
          threshold={0.1}
          fallback={
            <div 
              className="absolute bg-muted/20 border border-muted-foreground/20 rounded-md"
              style={{
                left: widget.x,
                top: widget.y,
                width: widget.w,
                height: widget.h
              }}
            >
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Loading...
              </div>
            </div>
          }
        >
          {renderActualWidget(widget)}
        </LazyComponent>
      )
    }
    
    return renderActualWidget(widget)
  }, [visibleItems])
  
  const renderActualWidget = useCallback((widget: any) => {
    if (widget.type === 'ariesmods') {
      return (
        <OptimizedWidget
          key={widget.id}
          widget={widget}
          onUpdate={(updates) => updateWidget(widget.id, updates)}
          onRemove={() => removeWidget(widget.id)}
        >
          <AriesModWidget
            widget={widget}
            onUpdate={(updates) => updateWidget(widget.id, updates)}
            className="w-full h-full"
          />
        </OptimizedWidget>
      )
    }
    
    return (
      <OptimizedWidget
        key={widget.id}
        widget={widget}
        onUpdate={(updates) => updateWidget(widget.id, updates)}
        onRemove={() => removeWidget(widget.id)}
      >
        <Card className="w-full h-full bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{widget.title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground">
              {widget.content}
            </div>
          </CardContent>
        </Card>
      </OptimizedWidget>
    )
  }, [updateWidget, removeWidget])
  
  // Performance mode toggle
  const togglePerformanceMode = useCallback(() => {
    const modes = ["auto", "balanced", "high"] as const
    const currentIndex = modes.indexOf(performanceMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setPerformanceMode(modes[nextIndex])
  }, [performanceMode])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'd':
            e.preventDefault()
            setIsDebugPanelVisible(prev => !prev)
            break
          case 'p':
            e.preventDefault()
            setShowPerformanceMonitor(prev => !prev)
            break
          case 'n':
            e.preventDefault()
            addWidget()
            break
          case 'o':
            e.preventDefault()
            togglePerformanceMode()
            break
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [addWidget, togglePerformanceMode])
  
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-background to-background/80">
      {/* Performance Monitor */}
      {showPerformanceMonitor && (
        <PerformanceMonitor 
          onClose={() => setShowPerformanceMonitor(false)}
          className="absolute top-4 right-4 z-50"
        />
      )}
      
      {/* Debug Panel */}
      {isDebugPanelVisible && (
        <div className="absolute top-4 left-4 z-50 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Debug Panel
            </h3>
            <Button
              onClick={() => setIsDebugPanelVisible(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Widgets:</span>
              <span className="font-mono">{totalWidgets}</span>
            </div>
            <div className="flex justify-between">
              <span>Visible:</span>
              <span className="font-mono">{visibleItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Performance:</span>
              <Badge variant={performanceMode === "high" ? "destructive" : "secondary"} className="text-xs">
                {performanceMode}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={`font-mono ${performanceMetrics.fps < 30 ? 'text-red-500' : 'text-green-500'}`}>
                {performanceMetrics.fps.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className="font-mono">{performanceMetrics.memoryUsage.toFixed(1)}MB</span>
            </div>
            <div className="flex justify-between">
              <span>Virtualized:</span>
              <span className={shouldVirtualize ? "text-blue-500" : "text-muted-foreground"}>
                {shouldVirtualize ? "Yes" : "No"}
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex gap-2">
              <Button
                onClick={togglePerformanceMode}
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
              >
                <Zap className="h-3 w-3 mr-1" />
                {performanceMode}
              </Button>
              <Button
                onClick={() => setShowPerformanceMonitor(true)}
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
              >
                <Activity className="h-3 w-3 mr-1" />
                Monitor
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug Panel Toggle (when hidden) */}
      {!isDebugPanelVisible && (
        <Button
          onClick={() => setIsDebugPanelVisible(true)}
          size="sm"
          variant="ghost"
          className="absolute top-4 left-4 z-50 h-8 w-8 p-0 bg-card/20 hover:bg-card/40 border border-border/50"
          title="Show debug panel (Ctrl+D)"
        >
          <Terminal className="h-4 w-4" />
        </Button>
      )}
      
      {/* Floating Toolbar */}
      <FloatingToolbar
        gridState={gridState}
        viewport={viewport}
        hasUnsavedChanges={lastSaved !== null}
        isAutoSaveEnabled={autoSaveEnabled}
        setIsAutoSaveEnabled={setAutoSaveEnabled}
        autoSaveInterval={2000}
        setAutoSaveInterval={() => {}}
        autoSaveStatus={autoSaveEnabled ? "enabled" : "disabled"}
        lastAutoSave={lastSaved}
        historyIndex={0}
        stateHistory={[]}
        saveGridState={() => {}}
        exportGridState={() => {}}
        importGridState={() => {}}
        undo={() => {}}
        redo={() => {}}
        addWidget={addWidget}
        addNestContainer={() => {}}
        setIsDebugPanelVisible={setIsDebugPanelVisible}
        isDebugPanelVisible={isDebugPanelVisible}
      />
      
      {/* Main Grid Container */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: "0 0"
        }}
      >
        {shouldVirtualize ? (
          <VirtualizedGrid
            items={[...gridState.mainWidgets, ...gridState.nestContainers, ...gridState.mainAriesWidgets]}
            renderItem={renderWidget}
            itemSize={{ width: 200, height: 150 }}
            overscan={5}
            className="w-full h-full"
            onScroll={(x, y) => setViewport(prev => ({ ...prev, x, y }))}
          />
        ) : (
          <div className="relative w-full h-full">
            {/* Grid Background */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(var(--theme-primary), 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(var(--theme-primary), 0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${gridState.gridSize}px ${gridState.gridSize}px`
              }}
            />
            
            {/* Regular Widgets */}
            {gridState.mainWidgets.map((widget, index) => renderWidget(widget, index))}
            
            {/* Nest Containers */}
            {gridState.nestContainers.map((nest, index) => (
              <Card
                key={nest.id}
                className="absolute group bg-muted/20 backdrop-blur border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-all duration-200"
                style={{
                  left: nest.x,
                  top: nest.y,
                  width: nest.w,
                  height: nest.h
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{nest.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeWidget(nest.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-2 overflow-auto">
                  {/* Nested widgets would go here */}
                </CardContent>
              </Card>
            ))}
            
            {/* AriesMods Widgets */}
            {gridState.mainAriesWidgets.map((widget, index) => renderWidget(widget, index))}
          </div>
        )}
      </div>
      
      {/* Performance Status Indicator */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {isOptimizing && (
          <Badge variant="secondary" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Optimizing
          </Badge>
        )}
        {shouldVirtualize && (
          <Badge variant="outline" className="text-xs">
            <Grid3X3 className="h-3 w-3 mr-1" />
            Virtualized
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {totalWidgets} widgets
        </Badge>
      </div>
    </div>
  )
}
