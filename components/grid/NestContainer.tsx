"use client"

import React, { memo, useCallback, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Grid3X3, X } from "lucide-react"
import { GridWidget } from "./GridWidget"
import type { 
  NestContainer as NestContainerType, 
  NestedWidget, 
  NestedAriesWidget,
  ResizeHandle 
} from "./types"

interface NestContainerProps {
  nest: NestContainerType
  nestedWidgets: NestedWidget[]
  nestedAriesWidgets: NestedAriesWidget[]
  isDragging: boolean
  isResizing: boolean
  dragOverNest: string | null
  dropState: {
    isDragOver: boolean
    targetNestId: string | null
  }
  pushedWidgets: Set<string>
  dragState: {
    isDragging: boolean
    draggedId: string | null
    draggedType: "widget" | "nest" | null
  }
  resizeState: {
    isResizing: boolean
    resizedId: string | null
    resizedType: "widget" | "nest" | null
  }
  onMouseDown: (e: React.MouseEvent, nestId: string, nestType: "nest") => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  onDragOver: (e: React.DragEvent, nestId: string) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, nestId: string) => void
  onRemove: (nestId: string) => void
  onWidgetMouseDown: (e: React.MouseEvent, widgetId: string, widgetType: "widget") => void
  onWidgetRemove: (widgetId: string) => void
  onAriesWidgetUpdate: (widgetId: string, updates: any) => void
  onConfigOpen: () => void
  getResizeHandles: (itemId: string, itemType: "widget" | "nest") => React.ReactNode
  className?: string
}

// Optimized scroll indicators component
const ScrollIndicators = memo<{ hasContent: boolean }>(({ hasContent }) => {
  if (!hasContent) return null
  
  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-muted/20 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-muted/20 to-transparent pointer-events-none z-10" />
    </>
  )
})

ScrollIndicators.displayName = "ScrollIndicators"

// Empty state component
const EmptyNestState = memo(() => (
  <div className="absolute inset-4 flex flex-col items-center justify-center text-center border-2 border-dashed border-muted-foreground/20 rounded">
    <p className="text-xs text-muted-foreground mb-1">Drop widgets here</p>
    <p className="text-xs text-muted-foreground/60">Widgets can overflow - nest will scroll</p>
  </div>
))

EmptyNestState.displayName = "EmptyNestState"

// Nest header component
const NestHeader = memo<{
  nest: NestContainerType
  totalWidgets: number
  onMouseDown: (e: React.MouseEvent) => void
  onRemove: () => void
}>(({ nest, totalWidgets, onMouseDown, onRemove }) => (
  <CardHeader
    className="pb-2 cursor-grab active:cursor-grabbing bg-muted/40 border-b border-muted-foreground/20"
    onMouseDown={onMouseDown}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Grid3X3 className="h-3 w-3 text-muted-foreground" />
        <CardTitle className="text-sm font-medium">{nest.title}</CardTitle>
        <Badge variant="secondary" className="text-xs font-mono">
          {nest.id.split("-").pop()}
        </Badge>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Badge variant="outline" className="text-xs">
          {totalWidgets} widget{totalWidgets !== 1 ? 's' : ''}
        </Badge>
        {totalWidgets > 0 && (
          <Badge variant="secondary" className="text-xs bg-teal-500/10 text-teal-400 border-teal-500/20">
            ↕ scroll
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  </CardHeader>
))

NestHeader.displayName = "NestHeader"

// Virtualized widget container
const WidgetContainer = memo<{
  nestedWidgets: NestedWidget[]
  nestedAriesWidgets: NestedAriesWidget[]
  nestId: string
  pushedWidgets: Set<string>
  dragState: any
  resizeState: any
  onWidgetMouseDown: (e: React.MouseEvent, widgetId: string, widgetType: "widget") => void
  onWidgetRemove: (widgetId: string) => void
  onAriesWidgetUpdate: (widgetId: string, updates: any) => void
  onConfigOpen: () => void
  getResizeHandles: (itemId: string, itemType: "widget") => React.ReactNode
}>(({ 
  nestedWidgets, 
  nestedAriesWidgets, 
  nestId, 
  pushedWidgets, 
  dragState, 
  resizeState, 
  onWidgetMouseDown, 
  onWidgetRemove, 
  onAriesWidgetUpdate, 
  onConfigOpen, 
  getResizeHandles 
}) => {
  // Memoize widget lists to prevent unnecessary re-renders
  const nestWidgets = useMemo(() => 
    nestedWidgets.filter(w => w.nestId === nestId), 
    [nestedWidgets, nestId]
  )
  
  const nestAriesWidgets = useMemo(() => 
    nestedAriesWidgets.filter(w => w.nestId === nestId), 
    [nestedAriesWidgets, nestId]
  )

  return (
    <div className="p-2 relative" style={{ minHeight: '100%' }}>
      {/* Regular nested widgets */}
      {nestWidgets.map((widget) => (
        <GridWidget
          key={widget.id}
          widget={widget}
          isDragging={dragState.draggedId === widget.id}
          isResizing={resizeState.resizedId === widget.id}
          isPushed={pushedWidgets.has(widget.id)}
          onMouseDown={onWidgetMouseDown}
          onRemove={onWidgetRemove}
          onConfigOpen={onConfigOpen}
          getResizeHandles={getResizeHandles}
        />
      ))}

      {/* AriesWidget nested widgets */}
      {nestAriesWidgets.map((widget) => (
        <GridWidget
          key={widget.id}
          widget={widget}
          isDragging={dragState.draggedId === widget.id}
          isResizing={resizeState.resizedId === widget.id}
          isPushed={pushedWidgets.has(widget.id)}
          onMouseDown={onWidgetMouseDown}
          onRemove={onWidgetRemove}
          onUpdate={onAriesWidgetUpdate}
          getResizeHandles={getResizeHandles}
        />
      ))}
    </div>
  )
})

WidgetContainer.displayName = "WidgetContainer"

// Main NestContainer component
export const NestContainer = memo<NestContainerProps>(({
  nest,
  nestedWidgets,
  nestedAriesWidgets,
  isDragging,
  isResizing,
  dragOverNest,
  dropState,
  pushedWidgets,
  dragState,
  resizeState,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
  onWidgetMouseDown,
  onWidgetRemove,
  onAriesWidgetUpdate,
  onConfigOpen,
  getResizeHandles,
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Memoize total widget count
  const totalWidgets = useMemo(() => {
    const regularWidgets = nestedWidgets.filter(w => w.nestId === nest.id).length
    const ariesWidgets = nestedAriesWidgets.filter(w => w.nestId === nest.id).length
    return regularWidgets + ariesWidgets
  }, [nestedWidgets, nestedAriesWidgets, nest.id])

  // Memoized event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    onMouseDown(e, nest.id, "nest")
  }, [onMouseDown, nest.id])

  const handleRemove = useCallback(() => {
    onRemove(nest.id)
  }, [onRemove, nest.id])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    onDragOver(e, nest.id)
  }, [onDragOver, nest.id])

  const handleDrop = useCallback((e: React.DragEvent) => {
    onDrop(e, nest.id)
  }, [onDrop, nest.id])

  // Optimized wheel event handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
    
    const target = e.currentTarget
    const { scrollTop, scrollHeight, clientHeight } = target
    
    const isScrollable = scrollHeight > clientHeight
    
    if (isScrollable) {
      const atTop = scrollTop === 0
      const atBottom = scrollTop >= scrollHeight - clientHeight
      
      if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
        e.preventDefault()
      }
    } else {
      e.preventDefault()
    }
  }, [])

  return (
    <Card
      className={`absolute group bg-muted/20 backdrop-blur border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-all duration-200 select-none ${
        isDragging ? "shadow-lg scale-105 z-10 aries-widget-smooth-drag" : ""
      } ${isResizing ? "shadow-lg z-10" : ""} ${
        dropState.isDragOver && dropState.targetNestId === nest.id ? "border-primary/50 bg-primary/10" : ""
      } ${dragOverNest === nest.id ? "border-green-500/50 bg-green-500/10 scale-102" : ""} ${className || ""}`}
      style={{
        left: nest.x,
        top: nest.y,
        width: nest.w,
        height: nest.h,
        cursor: isDragging ? "grabbing" : "default",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
    >
      {/* Resize Handles */}
      {getResizeHandles(nest.id, "nest")}

      {/* Nest Header */}
      <NestHeader
        nest={nest}
        totalWidgets={totalWidgets}
        onMouseDown={handleMouseDown}
        onRemove={handleRemove}
      />

      {/* Scrollable Content Area */}
      <CardContent 
        ref={scrollRef}
        className="p-0 overflow-auto relative" 
        style={{ 
          scrollBehavior: 'smooth',
          height: 'calc(100% - 68px)' // Account for header height with padding
        }}
        onWheel={handleWheel}
      >
        {/* Scroll indicators */}
        <ScrollIndicators hasContent={totalWidgets > 0} />
        
        {/* Widget container */}
        {totalWidgets > 0 ? (
          <WidgetContainer
            nestedWidgets={nestedWidgets}
            nestedAriesWidgets={nestedAriesWidgets}
            nestId={nest.id}
            pushedWidgets={pushedWidgets}
            dragState={dragState}
            resizeState={resizeState}
            onWidgetMouseDown={onWidgetMouseDown}
            onWidgetRemove={onWidgetRemove}
            onAriesWidgetUpdate={onAriesWidgetUpdate}
            onConfigOpen={onConfigOpen}
            getResizeHandles={getResizeHandles}
          />
        ) : (
          <EmptyNestState />
        )}
      </CardContent>
    </Card>
  )
})

NestContainer.displayName = "NestContainer" 