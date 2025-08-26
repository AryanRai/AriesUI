"use client"

import React from 'react'
import { GridWidget } from './GridWidget'
import { NestContainer } from './NestContainer'
import { HardwareAcceleratedWidget } from '@/components/widgets/hardware-accelerated-widget'
import { AriesModWidget } from '@/components/widgets/ariesmod-widget'
import type { GridState, ResizeHandle } from './types'

interface GridContainerProps {
  gridState: GridState
  viewport: { x: number; y: number; zoom: number }
  dragState: {
    isDragging: boolean
    draggedId: string | null
    draggedType: "widget" | "nest" | null
    sourceContainer: "main" | "nest" | null
    sourceNestId?: string
    offset: { x: number; y: number }
  }
  resizeState: {
    isResizing: boolean
    resizedId: string | null
    resizedType: "widget" | "nest" | null
    handle: ResizeHandle | null
    startPos: { x: number; y: number }
    startSize: { w: number; h: number }
    startPosition: { x: number; y: number }
  }
  dropState: {
    isDragOver: boolean
    targetNestId: string | null
  }
  pushedWidgets: Set<string>
  dragOverNest: string | null
  isHoveringOverNest: boolean
  onMouseDown: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  onDragOver: (e: React.DragEvent, targetNestId?: string) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetNestId?: string) => void
  removeWidget: (id: string) => void
  removeAriesWidget: (id: string) => void
  removeNestContainer: (id: string) => void
  updateAriesWidget: (id: string, updates: any) => void
  dispatch: (action: any) => void
  getResizeHandles: (itemId: string, itemType: "widget" | "nest") => React.ReactNode
}

export function GridContainer({
  gridState,
  viewport,
  dragState,
  resizeState,
  dropState,
  pushedWidgets,
  dragOverNest,
  isHoveringOverNest,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDragOver,
  onDragLeave,
  onDrop,
  removeWidget,
  removeAriesWidget,
  removeNestContainer,
  updateAriesWidget,
  dispatch,
  getResizeHandles
}: GridContainerProps) {
  return (
    <div
      className={`absolute inset-0 cursor-grab ${
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
        transform: 'translate3d(0, 0, 0)', // Force hardware layer
      }}
      onDragOver={(e) => onDragOver(e)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e)}
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
        {/* Nest Containers */}
        {gridState.nestContainers.map((nest) => (
          <NestContainer
            key={nest.id}
            nest={nest}
            nestedWidgets={gridState.nestedWidgets}
            nestedAriesWidgets={gridState.nestedAriesWidgets}
            isDragging={dragState.draggedId === nest.id}
            isResizing={resizeState.resizedId === nest.id}
            dragOverNest={dragOverNest}
            dropState={dropState}
            pushedWidgets={pushedWidgets}
            dragState={dragState}
            resizeState={resizeState}
            onMouseDown={(e) => onMouseDown(e, nest.id, "nest")}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onDragOver={(e) => onDragOver(e, nest.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, nest.id)}
            onRemove={() => removeNestContainer(nest.id)}
            onWidgetMouseDown={onMouseDown}
            onWidgetRemove={removeWidget}
            onAriesWidgetUpdate={updateAriesWidget}
            onConfigOpen={() => dispatch({ type: "SET_MODAL", payload: "widget-config" })}
            getResizeHandles={getResizeHandles}
          />
        ))}

        {/* Hardware-Accelerated Main Grid Widgets */}
        {gridState.mainWidgets.map((widget) => (
          <GridWidget
            key={widget.id}
            widget={widget}
            isDragging={dragState.draggedId === widget.id}
            isResizing={resizeState.resizedId === widget.id}
            isPushed={pushedWidgets.has(widget.id)}
            onMouseDown={onMouseDown}
            onRemove={removeWidget}
            onConfigOpen={() => dispatch({ type: "SET_MODAL", payload: "widget-config" })}
            getResizeHandles={getResizeHandles}
          />
        ))}

        {/* Hardware-Accelerated Main Grid AriesWidgets */}
        {gridState.mainAriesWidgets.map((widget) => (
          <HardwareAcceleratedWidget
            key={widget.id}
            id={widget.id}
            x={widget.x}
            y={widget.y}
            width={widget.w}
            height={widget.h}
            isDragging={dragState.draggedId === widget.id}
            isResizing={resizeState.resizedId === widget.id}
            isPushed={pushedWidgets.has(widget.id)}
            onMouseDown={onMouseDown}
            onRemove={removeAriesWidget}
          >
            <AriesModWidget
              widget={widget}
              onUpdate={(updates) => updateAriesWidget(widget.id, updates)}
              className="w-full h-full"
            />
            {getResizeHandles(widget.id, "widget")}
          </HardwareAcceleratedWidget>
        ))}
      </div>
    </div>
  )
} 