"use client"

import React, { useState, useRef, useCallback } from "react"
import { useComms } from "@/components/comms-context"
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useViewportManager } from "@/hooks/use-viewport-manager"
import { useVirtualGrid } from "@/hooks/use-virtual-grid"

// Import optimized components
import { GridWidget } from "@/components/grid/GridWidget"
import { NestContainer } from "@/components/grid/NestContainer"
import { FloatingToolbar } from "@/components/floating-toolbar-merged"
import { EnhancedSensorWidget } from "@/components/widgets/enhanced-sensor-widget"

// Import utilities
import { 
  generateUniqueId, 
  checkCollision, 
  applyPushPhysics, 
  findNonCollidingPosition 
} from "@/components/grid/utils"

import type { 
  MainGridWidget, 
  NestContainer as NestContainerType, 
  GridState as GridStateType, 
  AriesWidget,
  NestedAriesWidget
} from "@/components/grid/types"

interface MainContentOptimizedProps {
  gridState: GridStateType
  setGridState: React.Dispatch<React.SetStateAction<GridStateType>>
}

export function MainContentOptimized({ gridState, setGridState }: MainContentOptimizedProps) {
  const { state, dispatch } = useComms()
  const { animationsEnabled } = useAnimationPreferences()
  const containerRef = useRef<HTMLDivElement>(null)

  // Optimized viewport management
  const { viewport, setViewport, handleWheel, handlePanStart, isPanning } = useViewportManager()

  // Virtual grid for performance
  const { visibleItems, visibleBounds } = useVirtualGrid(
    [...gridState.mainWidgets, ...gridState.nestContainers, ...gridState.mainAriesWidgets],
    {
      containerWidth: containerRef.current?.clientWidth || 1920,
      containerHeight: containerRef.current?.clientHeight || 1080,
      viewport,
      buffer: 300
    }
  )

  // Simplified state management
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useLocalStorage("aries-show-debug-panel", false)

  // Optimized grid state updater with hardware acceleration
  const updateGridState = useCallback((updater: (prev: GridStateType) => GridStateType) => {
    requestAnimationFrame(() => {
      setGridState(updater)
      setHasUnsavedChanges(true)
    })
  }, [setGridState])

  // Simplified drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => {
    e.preventDefault()
    e.stopPropagation()
    
    // Apply hardware acceleration immediately
    const element = e.currentTarget as HTMLElement
    element.style.willChange = 'transform'
    element.style.transform = 'translate3d(0, 0, 0)'
    
    console.log('Drag started:', itemId, itemType)
  }, [])

  // Widget management functions
  const removeWidget = useCallback((id: string) => {
    updateGridState((prev) => ({
      ...prev,
      mainWidgets: prev.mainWidgets.filter((w) => w.id !== id),
      nestedWidgets: prev.nestedWidgets.filter((w) => w.id !== id),
    }))
    dispatch({ type: "ADD_LOG", payload: `Widget ${id} removed` })
  }, [updateGridState, dispatch])

  const removeAriesWidget = useCallback((id: string) => {
    updateGridState((prev) => ({
      ...prev,
      mainAriesWidgets: prev.mainAriesWidgets.filter((w) => w.id !== id),
      nestedAriesWidgets: prev.nestedAriesWidgets.filter((w) => w.id !== id),
    }))
    dispatch({ type: "ADD_LOG", payload: `AriesWidget ${id} removed` })
  }, [updateGridState, dispatch])

  const updateAriesWidget = useCallback((id: string, updates: Partial<AriesWidget | NestedAriesWidget>) => {
    updateGridState((prev) => ({
      ...prev,
      mainAriesWidgets: prev.mainAriesWidgets.map((w) => 
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ),
      nestedAriesWidgets: prev.nestedAriesWidgets.map((w) => 
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ),
    }))
  }, [updateGridState])

  const removeNestContainer = useCallback((id: string) => {
    updateGridState((prev) => ({
      ...prev,
      nestedWidgets: prev.nestedWidgets.filter((w) => w.nestId !== id),
      nestedAriesWidgets: prev.nestedAriesWidgets.filter((w) => w.nestId !== id),
      nestContainers: prev.nestContainers.filter((n) => n.id !== id),
    }))
    dispatch({ type: "ADD_LOG", payload: `Nest container ${id} removed` })
  }, [updateGridState, dispatch])

  const addWidget = useCallback(() => {
    const newWidget: MainGridWidget = {
      id: generateUniqueId("widget"),
      type: "basic",
      title: "New Widget",
      content: "Widget content",
      x: Math.round(Math.random() * 400 / gridState.gridSize) * gridState.gridSize,
      y: Math.round(Math.random() * 300 / gridState.gridSize) * gridState.gridSize,
      w: 200,
      h: 150,
      container: "main",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    updateGridState((prev) => ({
      ...prev,
      mainWidgets: [...prev.mainWidgets, newWidget],
    }))
    dispatch({ type: "ADD_LOG", payload: `New widget created: ${newWidget.id}` })
  }, [gridState.gridSize, updateGridState, dispatch])

  const addNestContainer = useCallback(() => {
    const newNest: NestContainerType = {
      id: generateUniqueId("nest"),
      type: "nest",
      title: "Nest Container",
      x: Math.round(Math.random() * 200 / gridState.gridSize) * gridState.gridSize,
      y: Math.round(Math.random() * 150 / gridState.gridSize) * gridState.gridSize,
      w: 400,
      h: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    updateGridState((prev) => ({
      ...prev,
      nestContainers: [...prev.nestContainers, newNest],
    }))
    dispatch({ type: "ADD_LOG", payload: `Nest container created: ${newNest.id}` })
  }, [gridState.gridSize, updateGridState, dispatch])

  // Dummy functions for toolbar
  const saveGridState = useCallback(() => {
    console.log('Save grid state')
    setHasUnsavedChanges(false)
  }, [])

  const exportGridState = useCallback(() => {
    console.log('Export grid state')
  }, [])

  const importGridState = useCallback(() => {
    console.log('Import grid state')
  }, [])

  const undo = useCallback(() => {
    console.log('Undo')
  }, [])

  const redo = useCallback(() => {
    console.log('Redo')
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-background to-background/80">
      
      {/* Floating Toolbar */}
      <FloatingToolbar
        gridState={gridState}
        viewport={viewport}
        hasUnsavedChanges={hasUnsavedChanges}
        isAutoSaveEnabled={true}
        setIsAutoSaveEnabled={() => {}}
        autoSaveInterval={30000}
        setAutoSaveInterval={() => {}}
        autoSaveStatus="idle"
        lastAutoSave={null}
        historyIndex={0}
        stateHistory={[]}
        saveGridState={saveGridState}
        exportGridState={exportGridState}
        importGridState={importGridState}
        undo={undo}
        redo={redo}
        addWidget={addWidget}
        addNestContainer={addNestContainer}
        setIsDebugPanelVisible={setIsDebugPanelVisible}
        isDebugPanelVisible={isDebugPanelVisible}
      />

      {/* Optimized Grid Container with Hardware Acceleration */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: `${gridState.gridSize * viewport.zoom}px ${gridState.gridSize * viewport.zoom}px`,
          backgroundPosition: `${viewport.x * viewport.zoom}px ${viewport.y * viewport.zoom}px`,
          willChange: 'transform, background-position',
          transform: 'translate3d(0, 0, 0)', // Force hardware layer
        }}
        onMouseDown={handlePanStart}
        onWheel={handleWheel}
      >
        {/* Viewport Transform Container with Hardware Acceleration */}
        <div
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
            position: "relative",
            willChange: 'transform',
          }}
        >
          {/* Only render visible nest containers */}
          {gridState.nestContainers
            .filter(nest => {
              return (
                nest.x < visibleBounds.right &&
                nest.x + nest.w > visibleBounds.left &&
                nest.y < visibleBounds.bottom &&
                nest.y + nest.h > visibleBounds.top
              )
            })
            .map((nest) => (
              <NestContainer
                key={nest.id}
                nest={nest}
                nestedWidgets={gridState.nestedWidgets}
                nestedAriesWidgets={gridState.nestedAriesWidgets}
                isDragging={false}
                isResizing={false}
                dragOverNest={null}
                dropState={{ isDragOver: false, targetNestId: null }}
                pushedWidgets={new Set()}
                dragState={{ isDragging: false, draggedId: null, draggedType: null, sourceContainer: null, offset: { x: 0, y: 0 } }}
                resizeState={{ isResizing: false, resizedId: null, resizedType: null, handle: null, startPos: { x: 0, y: 0 }, startSize: { w: 0, h: 0 }, startPosition: { x: 0, y: 0 } }}
                onMouseDown={handleMouseDown}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                onDragOver={() => {}}
                onDragLeave={() => {}}
                onDrop={() => {}}
                onRemove={() => removeNestContainer(nest.id)}
                onWidgetMouseDown={handleMouseDown}
                onWidgetRemove={removeWidget}
                onAriesWidgetUpdate={updateAriesWidget}
                onConfigOpen={() => {}}
                getResizeHandles={() => null}
              />
            ))}

          {/* Only render visible main widgets */}
          {gridState.mainWidgets
            .filter(widget => {
              return (
                widget.x < visibleBounds.right &&
                widget.x + widget.w > visibleBounds.left &&
                widget.y < visibleBounds.bottom &&
                widget.y + widget.h > visibleBounds.top
              )
            })
            .map((widget) => (
              <div
                key={widget.id}
                data-widget-id={widget.id}
                style={{
                  position: 'absolute',
                  left: widget.x,
                  top: widget.y,
                  width: widget.w,
                  height: widget.h,
                  willChange: 'transform',
                  transform: 'translate3d(0, 0, 0)',
                }}
                onMouseDown={(e) => handleMouseDown(e, widget.id, "widget")}
              >
                <EnhancedSensorWidget
                  widgetId={widget.id}
                  title={widget.title}
                  sensorType="generic"
                  streamMappings={[]}
                  onStreamMappingsChange={() => {}}
                  className="w-full h-full"
                />
              </div>
            ))}

          {/* Only render visible AriesWidgets */}
          {gridState.mainAriesWidgets
            .filter(widget => {
              return (
                widget.x < visibleBounds.right &&
                widget.x + widget.w > visibleBounds.left &&
                widget.y < visibleBounds.bottom &&
                widget.y + widget.h > visibleBounds.top
              )
            })
            .map((widget) => (
              <div
                key={widget.id}
                data-widget-id={widget.id}
                style={{
                  position: 'absolute',
                  left: widget.x,
                  top: widget.y,
                  width: widget.w,
                  height: widget.h,
                  willChange: 'transform',
                  transform: 'translate3d(0, 0, 0)',
                }}
                onMouseDown={(e) => handleMouseDown(e, widget.id, "widget")}
              >
                <EnhancedSensorWidget
                  widgetId={widget.id}
                  title={widget.title}
                  sensorType="generic"
                  streamMappings={[]}
                  onStreamMappingsChange={(mappings) => updateAriesWidget(widget.id, { streamMappings: mappings } as any)}
                  className="w-full h-full"
                />
              </div>
            ))}
        </div>
      </div>

      {/* Performance Debug Info */}
      {isDebugPanelVisible && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 text-green-400 p-3 rounded font-mono text-xs">
          <div>Viewport: {viewport.x.toFixed(0)}, {viewport.y.toFixed(0)}, {(viewport.zoom * 100).toFixed(0)}%</div>
          <div>Total Items: {gridState.mainWidgets.length + gridState.nestContainers.length + gridState.mainAriesWidgets.length}</div>
          <div>Visible Items: {visibleItems.length}</div>
          <div>Performance: {isPanning ? 'PANNING' : 'IDLE'}</div>
          <div>Hardware Accel: ENABLED</div>
        </div>
      )}
    </div>
  )
} 