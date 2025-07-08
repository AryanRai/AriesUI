"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import { useGridState } from "./hooks/useGridState"
import { useViewport } from "./hooks/useViewport"
import { useDragAndDrop } from "./hooks/useDragAndDrop"
import { useResize } from "./hooks/useResize"
import { useGridOperations } from "./hooks/useGridOperations"
import { useMouseEvents } from "./hooks/useMouseEvents"
import { calculateNestAutoSize } from "./utils"
import { FloatingActionButtons } from "./components/FloatingActionButtons"
import { ViewportInfo } from "./components/ViewportInfo"
import { NestContainerComponent } from "./components/NestContainer"
import { MainWidget } from "./components/MainWidget"

export function MainContentModular() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize all hooks
  const {
    gridState,
    updateGridState,
    hasUnsavedChanges,
    saveGridState,
    loadGridState,
    exportGridState,
    importGridState,
  } = useGridState()

  const {
    viewport,
    setViewport,
    isPanning,
    setIsPanning,
    lastPanPoint,
    setLastPanPoint,
    handlePanStart,
    handleWheel,
  } = useViewport()

  const {
    dragState,
    setDragState,
    dropState,
    setDropState,
    dragOverNest,
    setDragOverNest,
    handleMouseDown,
    handleDragOver,
    handleDragLeave,
    resetDragState,
  } = useDragAndDrop()

  const {
    resizeState,
    setResizeState,
    handleResizeMouseDown,
    resetResizeState,
  } = useResize()

  const {
    addWidget,
    addNestContainer,
    removeWidget,
    removeNestContainer,
  } = useGridOperations(gridState, updateGridState)

  // Mouse events handler
  const { handleDrop } = useMouseEvents({
    gridState,
    updateGridState,
    dragState,
    setDragState,
    resizeState,
    setResizeState,
    viewport,
    setViewport,
    isPanning,
    setIsPanning,
    lastPanPoint,
    setLastPanPoint,
    setDragOverNest,
    containerRef,
    resetDragState,
    resetResizeState,
  })

  // Auto-resize nests based on content
  useEffect(() => {
    updateGridState((prev) => ({
      ...prev,
      nestContainers: prev.nestContainers.map((nest) => {
        const nestWidgets = prev.nestedWidgets.filter((w) => w.nestId === nest.id)
        const autoSize = calculateNestAutoSize(nestWidgets)

        // Only update if size actually changed to prevent infinite loops
        if (nest.w !== autoSize.w || nest.h !== autoSize.h) {
          return {
            ...nest,
            w: autoSize.w,
            h: autoSize.h,
            updatedAt: new Date().toISOString(),
          }
        }
        return nest
      }),
    }))
  }, [gridState.nestedWidgets, updateGridState])

  // Load state on component mount
  useEffect(() => {
    const loadedViewport = loadGridState()
    if (loadedViewport) {
      setViewport(loadedViewport)
    }
  }, [loadGridState, setViewport])

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
      return () => container.removeEventListener("wheel", handleWheel)
    }
  }, [handleWheel])

  // Wrap save functions to include viewport
  const handleSave = () => saveGridState(viewport)
  const handleExport = () => exportGridState(viewport)

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-background to-background/80">
      {/* Floating Action Buttons */}
      <FloatingActionButtons
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        onExport={handleExport}
        onImport={importGridState}
        onAddNest={addNestContainer}
        onAddWidget={addWidget}
      />

      {/* Viewport Info */}
      <ViewportInfo viewport={viewport} />

      {/* Infinite Grid Container */}
      <div
        ref={containerRef}
        className={`absolute inset-0 cursor-${isPanning ? "grabbing" : "grab"} ${
          dropState.isDragOver && !dropState.targetNestId ? "border-primary/50 bg-primary/5 border-2 border-dashed" : ""
        }`}
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: `${gridState.gridSize * viewport.zoom}px ${gridState.gridSize * viewport.zoom}px`,
          backgroundPosition: `${viewport.x * viewport.zoom}px ${viewport.y * viewport.zoom}px`,
          transform: `scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        }}
        onMouseDown={handlePanStart}
        onDragOver={(e) => handleDragOver(e)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e)}
      >
        <div
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px)`,
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Nest Containers */}
          {gridState.nestContainers.map((nest) => {
            const nestWidgets = gridState.nestedWidgets.filter((w) => w.nestId === nest.id)
            
            return (
              <NestContainerComponent
                key={nest.id}
                nest={nest}
                nestWidgets={nestWidgets}
                dragState={dragState}
                resizeState={resizeState}
                dropState={dropState}
                dragOverNest={dragOverNest}
                onMouseDown={(e, itemId, itemType) => handleMouseDown(e, itemId, itemType, gridState)}
                onResizeMouseDown={(e, itemId, itemType, handle) => handleResizeMouseDown(e, itemId, itemType, handle, gridState)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onRemoveNest={removeNestContainer}
                onRemoveWidget={removeWidget}
              />
            )
          })}

          {/* Main Grid Widgets */}
          {gridState.mainWidgets.map((widget) => (
            <MainWidget
              key={widget.id}
              widget={widget}
              dragState={dragState}
              resizeState={resizeState}
              onMouseDown={(e, itemId, itemType) => handleMouseDown(e, itemId, itemType, gridState)}
              onResizeMouseDown={(e, itemId, itemType, handle) => handleResizeMouseDown(e, itemId, itemType, handle, gridState)}
              onRemoveWidget={removeWidget}
            />
          ))}
        </div>
      </div>
    </div>
  )
}