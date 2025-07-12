"use client"

import React, { useRef } from "react"
import { MovableDebugPanel } from "@/components/debug/movable-debug-panel"
import { FloatingToolbar } from "@/components/floating-toolbar-merged"
import { GridContainer } from "@/components/grid/grid-container"
import { NestContainer } from "@/components/grid/NestContainer"
import { GridWidget } from "@/components/grid/GridWidget"
import { PerformanceManager } from "./PerformanceManager"
import { StateManager, useStateContext } from "./StateManager"
import { EventHandlers } from "./EventHandlers"
import type { MainContentProps } from "./types"

/**
 * MainContent component - The main grid dashboard orchestrator
 * 
 * This component provides:
 * - State management through StateManager
 * - Performance optimization through PerformanceManager
 * - Event handling through EventHandlers
 * - Grid rendering and widget management
 * 
 * @param gridState - Current grid state containing widgets and nests
 * @param setGridState - Function to update the grid state
 */
export function MainContent({ gridState, setGridState }: MainContentProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <StateManager gridState={gridState} setGridState={setGridState}>
      <MainContentInner containerRef={containerRef} />
    </StateManager>
  )
}

// Inner component that has access to state context
const MainContentInner: React.FC<{ containerRef: React.RefObject<HTMLDivElement> }> = ({ containerRef }) => {
  const stateContext = useStateContext()
  
  if (!stateContext) {
    return <div>Loading...</div>
  }

  const {
    viewport,
    setViewport,
    dragState,
    setDragState,
    resizeState,
    setResizeState,
    dropState,
    setDropState,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    lastPanPoint,
    setLastPanPoint,
    dragOverNest,
    setDragOverNest,
    pushedWidgets,
    setPushedWidgets,
    isHoveringOverNest,
    setIsHoveringOverNest,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    containerSize,
    setContainerSize,
    hardwareConnectionStatus,
    setHardwareConnectionStatus,
    isAutoSaveEnabled,
    setIsAutoSaveEnabled,
    autoSaveInterval,
    setAutoSaveInterval,
    lastAutoSave,
    autoSaveStatus,
    isDebugPanelVisible,
    setIsDebugPanelVisible,
    isViewportInfoVisible,
    setIsViewportInfoVisible,
    stateHistory,
    historyIndex,
    saveGridState,
    exportGridState,
    undo,
    redo,
    saveStateToHistory
  } = stateContext

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-background to-background/80">
      
      {/* Movable Debug Panel */}
      <MovableDebugPanel
        isVisible={isDebugPanelVisible}
        onToggleVisibility={setIsDebugPanelVisible}
        viewport={viewport}
        gridState={gridState}
        dragState={dragState}
        isPanning={isPanning}
        hardwareConnectionStatus={hardwareConnectionStatus}
        isAutoSaveEnabled={isAutoSaveEnabled}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      
      {/* Unified Floating Toolbar */}
      <FloatingToolbar
        gridState={gridState}
        viewport={viewport}
        hasUnsavedChanges={hasUnsavedChanges}
        isAutoSaveEnabled={isAutoSaveEnabled}
        setIsAutoSaveEnabled={setIsAutoSaveEnabled}
        autoSaveInterval={autoSaveInterval}
        setAutoSaveInterval={setAutoSaveInterval}
        autoSaveStatus={autoSaveStatus}
        lastAutoSave={lastAutoSave}
        historyIndex={historyIndex}
        stateHistory={stateHistory}
        saveGridState={saveGridState}
        exportGridState={exportGridState}
        undo={undo}
        redo={redo}
        addWidget={() => {}} // TODO: Implement
        addNestContainer={() => {}} // TODO: Implement
        setIsDebugPanelVisible={setIsDebugPanelVisible}
        isDebugPanelVisible={isDebugPanelVisible}
        onNavigateToHistory={() => {}} // TODO: Implement
      />

      {/* Performance Manager wraps the entire grid system */}
      <PerformanceManager
        gridState={gridState}
        viewport={viewport}
        containerSize={containerSize}
        draggedId={dragState.draggedId}
        resizedId={resizeState.resizedId}
      >
        {/* Event Handlers manage all mouse/keyboard interactions */}
        <EventHandlers
          gridState={gridState}
          setGridState={setGridState}
          viewport={viewport}
          setViewport={setViewport}
          dragState={dragState}
          setDragState={setDragState}
          resizeState={resizeState}
          setResizeState={setResizeState}
          containerRef={containerRef}
        >
          {/* Main Grid Container */}
          <MainGridContainer
            containerRef={containerRef}
            gridState={gridState}
            viewport={viewport}
            dragState={dragState}
            resizeState={resizeState}
            dropState={dropState}
            dragOverNest={dragOverNest}
            pushedWidgets={pushedWidgets}
            isHoveringOverNest={isHoveringOverNest}
            isViewportInfoVisible={isViewportInfoVisible}
          />
        </EventHandlers>
      </PerformanceManager>
    </div>
  )
}

// Main Grid Container component
const MainGridContainer: React.FC<{
  containerRef: React.RefObject<HTMLDivElement>
  gridState: any
  viewport: any
  dragState: any
  resizeState: any
  dropState: any
  dragOverNest: string | null
  pushedWidgets: Set<string>
  isHoveringOverNest: boolean
  isViewportInfoVisible: boolean
}> = ({
  containerRef,
  gridState,
  viewport,
  dragState,
  resizeState,
  dropState,
  dragOverNest,
  pushedWidgets,
  isHoveringOverNest,
  isViewportInfoVisible
}) => {
  
  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault()
      // Handle panning start
    }
  }

  const handleDragOver = (e: React.DragEvent, targetNestId?: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    // Handle drag over
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    // Handle drag leave
  }

  const handleDrop = (e: React.DragEvent, targetNestId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    // Handle drop
  }

  return (
    <>
      {/* Viewport Info */}
      {isViewportInfoVisible && (
        <div className="absolute top-16 left-4 z-50 text-xs text-muted-foreground bg-background/90 px-3 py-2 rounded backdrop-blur-sm border border-border/50 shadow-lg">
          <div>Zoom: {(viewport.zoom * 100).toFixed(0)}%</div>
          <div>
            Position: ({Math.round(viewport.x)}, {Math.round(viewport.y)})
          </div>
          {dragState.isDragging && (
            <div className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              Smooth Drag: {dragState.draggedType === "nest" ? "Nest" : "Widget"}
            </div>
          )}
          <div className="text-xs opacity-75 mt-1">Ctrl+Wheel: Zoom • Middle Click: Pan • Ctrl+Click: Pan</div>
        </div>
      )}

      {/* Hardware-Accelerated Grid Container */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        onMouseDown={handlePanStart}
      >
        <div
          className={`absolute inset-0 cursor-${isPanning ? "grabbing" : "grab"} ${
            dropState.isDragOver && !dropState.targetNestId ? "border-primary/50 bg-primary/5 border-2 border-dashed" : ""
          } ${
            dragState.isDragging ? "aries-grid-smooth-drag" : ""
          }`}
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: `${gridState.gridSize * viewport.zoom}px ${gridState.gridSize * viewport.zoom}px`,
            backgroundPosition: `${viewport.x * viewport.zoom}px ${viewport.y * viewport.zoom}px`,
            willChange: 'transform, background-position',
            transform: 'translate3d(0, 0, 0)',
          }}
          onDragOver={(e) => handleDragOver(e)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e)}
        >
          {/* Hardware-Accelerated Viewport Transform Container */}
          <div
            className={dragState.isDragging || resizeState.isResizing ? "aries-grid-faded" : ""}
            style={{
              transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
              transformOrigin: "0 0",
              width: "100%",
              height: "100%",
              position: "relative",
              willChange: 'transform',
            }}
          >
            {/* Render grid content here - this will be populated by PerformanceManager's virtual grid */}
            <GridContent
              gridState={gridState}
              dragState={dragState}
              resizeState={resizeState}
              dragOverNest={dragOverNest}
              pushedWidgets={pushedWidgets}
            />
          </div>
        </div>
      </div>
    </>
  )
}

// Grid Content component - renders actual widgets and nests
const GridContent: React.FC<{
  gridState: any
  dragState: any
  resizeState: any
  dragOverNest: string | null
  pushedWidgets: Set<string>
}> = ({ gridState, dragState, resizeState, dragOverNest, pushedWidgets }) => {
  
  const handleMouseDown = (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => {
    // This will be handled by EventHandlers
  }

  const removeWidget = (id: string) => {
    // TODO: Implement widget removal
  }

  const removeAriesWidget = (id: string) => {
    // TODO: Implement AriesWidget removal
  }

  const updateAriesWidget = (id: string, updates: any) => {
    // TODO: Implement AriesWidget updates
  }

  const removeNestContainer = (id: string) => {
    // TODO: Implement nest removal
  }

  const updateNestContainer = (id: string, updates: any) => {
    // TODO: Implement nest updates
  }

  const getResizeHandles = (itemId: string, itemType: "widget" | "nest") => {
    // TODO: Implement resize handles
    return null
  }

  return (
    <>
      {/* Render nest containers */}
      {gridState.nestContainers.filter((nest: any) => !nest.parentNestId).map((nest: any) => (
        <NestContainer
          key={nest.id}
          nest={nest}
          nestedWidgets={gridState.nestedWidgets}
          nestedAriesWidgets={gridState.nestedAriesWidgets}
          nestedNestContainers={gridState.nestContainers.filter((n: any) => n.parentNestId === nest.id)}
          isDragging={dragState.draggedId === nest.id}
          isResizing={resizeState.resizedId === nest.id}
          dragOverNest={dragOverNest}
          dropState={{ isDragOver: false, targetNestId: null }}
          pushedWidgets={pushedWidgets}
          dragState={dragState}
          resizeState={resizeState}
          onMouseDown={(e) => handleMouseDown(e, nest.id, "nest")}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
          onDragOver={() => {}}
          onDragLeave={() => {}}
          onDrop={() => {}}
          onRemove={() => removeNestContainer(nest.id)}
          onUpdate={updateNestContainer}
          onWidgetMouseDown={handleMouseDown}
          onWidgetRemove={removeWidget}
          onAriesWidgetUpdate={updateAriesWidget}
          onConfigOpen={() => {}}
          getResizeHandles={getResizeHandles}
        />
      ))}

      {/* Render main grid widgets */}
      {gridState.mainWidgets.map((widget: any) => (
        <GridWidget
          key={widget.id}
          widget={widget}
          isDragging={dragState.draggedId === widget.id}
          isResizing={resizeState.resizedId === widget.id}
          isPushed={pushedWidgets.has(widget.id)}
          onMouseDown={handleMouseDown}
          onRemove={removeWidget}
          onConfigOpen={() => {}}
          getResizeHandles={getResizeHandles}
        />
      ))}

      {/* Render main grid AriesWidgets */}
      {gridState.mainAriesWidgets.map((widget: any) => (
        <GridWidget
          key={widget.id}
          widget={widget}
          isDragging={dragState.draggedId === widget.id}
          isResizing={resizeState.resizedId === widget.id}
          isPushed={pushedWidgets.has(widget.id)}
          onMouseDown={handleMouseDown}
          onRemove={removeAriesWidget}
          onUpdate={updateAriesWidget}
          getResizeHandles={getResizeHandles}
        />
      ))}
    </>
  )
}

export { MainContent } 