"use client"

import React, { memo, useCallback, useRef, useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Grid3X3, X } from "lucide-react"
import { GridWidget } from "./GridWidget"
import { HardwareAcceleratedWidget } from "../widgets/hardware-accelerated-widget"
import { AriesModWidget } from "../widgets/ariesmod-widget"
import type { 
  NestContainer as NestContainerType, 
  NestedWidget, 
  ResizeHandle 
} from "./types"
import type { NestedAriesWidget } from "@/types/ariesmods"

interface NestContainerProps {
  nest: NestContainerType
  nestedWidgets: NestedWidget[]
  nestedAriesWidgets: NestedAriesWidget[]
  nestedNestContainers?: NestContainerType[]
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
  onUpdate?: (nestId: string, updates: Partial<NestContainerType>) => void
  onWidgetMouseDown: (e: React.MouseEvent, widgetId: string, widgetType: "widget") => void
  onWidgetRemove: (widgetId: string) => void
  onAriesWidgetUpdate: (widgetId: string, updates: any) => void
  onConfigOpen: () => void
  getResizeHandles: (itemId: string, itemType: "widget" | "nest") => React.ReactNode
  className?: string
}

// Enhanced scroll indicators component with directional indicators
const ScrollIndicators = memo<{ 
  hasContent: boolean
  scrollBounds: { minX: number; minY: number; maxX: number; maxY: number }
  nestSize: { w: number; h: number }
}>(({ hasContent, scrollBounds, nestSize }) => {
  if (!hasContent) return null
  
  const showLeftIndicator = scrollBounds.minX < 0
  const showTopIndicator = scrollBounds.minY < 0
  const showRightIndicator = scrollBounds.maxX > nestSize.w
  const showBottomIndicator = scrollBounds.maxY > nestSize.h
  
  return (
    <>
      {/* Top scroll indicator - for negative Y */}
      {showTopIndicator && (
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-orange-500/30 to-transparent pointer-events-none z-20 flex items-center justify-center">
          <div className="text-xs text-orange-400 font-mono">↑ scroll up</div>
        </div>
      )}
      
      {/* Left scroll indicator - for negative X */}
      {showLeftIndicator && (
        <div className="absolute top-0 left-0 bottom-0 w-3 bg-gradient-to-r from-orange-500/30 to-transparent pointer-events-none z-20 flex items-center justify-center">
          <div className="text-xs text-orange-400 font-mono transform -rotate-90">← scroll left</div>
        </div>
      )}
      
      {/* Right scroll indicator - for overflow X */}
      {showRightIndicator && (
        <div className="absolute top-0 right-0 bottom-0 w-3 bg-gradient-to-l from-blue-500/30 to-transparent pointer-events-none z-20 flex items-center justify-center">
          <div className="text-xs text-blue-400 font-mono transform rotate-90">→ scroll right</div>
        </div>
      )}
      
      {/* Bottom scroll indicator - for overflow Y */}
      {showBottomIndicator && (
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-blue-500/30 to-transparent pointer-events-none z-20 flex items-center justify-center">
          <div className="text-xs text-blue-400 font-mono">↓ scroll down</div>
        </div>
      )}
      
      {/* Standard scroll indicators for scrollable content */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-muted/20 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-muted/20 to-transparent pointer-events-none z-10" />
    </>
  )
})

ScrollIndicators.displayName = "ScrollIndicators"

// Enhanced empty state component with scroll information
const EmptyNestState = memo(() => (
  <div className="absolute inset-4 flex flex-col items-center justify-center text-center border-2 border-dashed border-muted-foreground/20 rounded">
    <p className="text-xs text-muted-foreground mb-1">Drop widgets here</p>
    <p className="text-xs text-muted-foreground/60">Widgets can be placed anywhere</p>
    <p className="text-xs text-muted-foreground/40 mt-1">Nest will scroll to show all content</p>
  </div>
))

EmptyNestState.displayName = "EmptyNestState"

// Nest header component with enhanced scroll information
const NestHeader = memo<{
  nest: NestContainerType
  totalWidgets: number
  scrollBounds: { minX: number; minY: number; maxX: number; maxY: number }
  onMouseDown: (e: React.MouseEvent) => void
  onRemove: () => void
  onUpdate?: (nestId: string, updates: Partial<NestContainerType>) => void
}>(({ nest, totalWidgets, scrollBounds, onMouseDown, onRemove, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editingTitle, setEditingTitle] = useState(nest.title)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleTitleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditingTitle(nest.title)
  }, [nest.title])

  const handleTitleSave = useCallback(() => {
    if (editingTitle.trim() && editingTitle !== nest.title && onUpdate) {
      onUpdate(nest.id, { 
        title: editingTitle.trim(),
        updatedAt: new Date().toISOString()
      })
    }
    setIsEditing(false)
  }, [editingTitle, nest.title, nest.id, onUpdate])

  const handleTitleCancel = useCallback(() => {
    setEditingTitle(nest.title)
    setIsEditing(false)
  }, [nest.title])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      handleTitleCancel()
    }
  }, [handleTitleSave, handleTitleCancel])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Calculate scroll area information
  const hasOverflow = scrollBounds.minX < 0 || scrollBounds.minY < 0 || 
                     scrollBounds.maxX > nest.w || scrollBounds.maxY > nest.h
  const scrollAreaWidth = Math.max(nest.w, scrollBounds.maxX - Math.min(0, scrollBounds.minX))
  const scrollAreaHeight = Math.max(nest.h, scrollBounds.maxY - Math.min(0, scrollBounds.minY))

  return (
    <CardHeader
      className="pb-2 cursor-grab active:cursor-grabbing bg-muted/40 border-b border-muted-foreground/20"
      onMouseDown={onMouseDown}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-3 w-3 text-muted-foreground" />
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyDown}
              className="text-sm font-medium bg-transparent border-b border-primary/50 focus:outline-none focus:border-primary min-w-0 flex-1"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <CardTitle 
              className="text-sm font-medium cursor-pointer hover:text-primary/80 transition-colors"
              onClick={handleTitleClick}
              title="Click to edit name"
            >
              {nest.title}
            </CardTitle>
          )}
          <Badge variant="secondary" className="text-xs font-mono">
            {nest.id.split("-").pop()}
          </Badge>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="outline" className="text-xs">
            {totalWidgets} item{totalWidgets !== 1 ? 's' : ''}
          </Badge>
          {totalWidgets > 0 && hasOverflow && (
            <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/20">
              {scrollAreaWidth}×{scrollAreaHeight}
            </Badge>
          )}
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
  )
})

NestHeader.displayName = "NestHeader"

interface WidgetContainerProps {
  nestedWidgets: NestedWidget[]
  nestedAriesWidgets: NestedAriesWidget[]
  nestedNestContainers: NestContainerType[]
  nestId: string
  scrollBounds: { minX: number; minY: number; maxX: number; maxY: number }
  pushedWidgets: Set<string>
  dragState: any
  resizeState: any
  onWidgetMouseDown: (e: React.MouseEvent, widgetId: string, widgetType: "widget") => void
  onWidgetRemove: (widgetId: string) => void
  onAriesWidgetUpdate: (widgetId: string, updates: any) => void
  onConfigOpen: () => void
  getResizeHandles: (itemId: string, itemType: "widget" | "nest") => React.ReactNode
  onMouseDown: (e: React.MouseEvent, nestId: string, nestType: "nest") => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  onDragOver: (e: React.DragEvent, nestId: string) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, nestId: string) => void
  onRemove: (nestId: string) => void
  onUpdate?: (nestId: string, updates: Partial<NestContainerType>) => void
}

// Enhanced virtualized widget container with dynamic bounds
const WidgetContainer = memo<WidgetContainerProps>(({ 
  nestedWidgets, 
  nestedAriesWidgets, 
  nestedNestContainers = [],
  nestId, 
  scrollBounds,
  pushedWidgets, 
  dragState, 
  resizeState, 
  onWidgetMouseDown, 
  onWidgetRemove, 
  onAriesWidgetUpdate, 
  onConfigOpen, 
  getResizeHandles,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
  onUpdate
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

  const childNests = useMemo(() => 
    nestedNestContainers.filter(n => n.parentNestId === nestId), 
    [nestedNestContainers, nestId]
  )

  // Calculate container size to accommodate all widgets including negative positions
  const containerStyle = useMemo(() => {
    const padding = 20 // Extra padding around content
    const width = Math.max(300, scrollBounds.maxX - Math.min(0, scrollBounds.minX) + padding * 2)
    const height = Math.max(200, scrollBounds.maxY - Math.min(0, scrollBounds.minY) + padding * 2)
    
    return {
      width: `${width}px`,
      height: `${height}px`,
      position: 'relative' as const,
      // Offset content to accommodate negative positions
      paddingLeft: Math.max(0, -scrollBounds.minX + padding),
      paddingTop: Math.max(0, -scrollBounds.minY + padding),
    }
  }, [scrollBounds])

  return (
    <div style={containerStyle}>
      {/* Nested nest containers */}
      {childNests.map((childNest) => (
        <NestContainer
          key={childNest.id}
          nest={childNest}
          nestedWidgets={nestedWidgets}
          nestedAriesWidgets={nestedAriesWidgets}
          nestedNestContainers={nestedNestContainers}
          isDragging={dragState.draggedId === childNest.id}
          isResizing={resizeState.resizedId === childNest.id}
          dragOverNest={dragState.draggedId}
          dropState={{
            isDragOver: false,
            targetNestId: null
          }}
          pushedWidgets={pushedWidgets}
          dragState={dragState}
          resizeState={resizeState}
          onMouseDown={(e) => onMouseDown(e, childNest.id, "nest")}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onDragOver={(e) => onDragOver(e, childNest.id)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, childNest.id)}
          onRemove={onRemove}
          onUpdate={onUpdate}
          onWidgetMouseDown={onWidgetMouseDown}
          onWidgetRemove={onWidgetRemove}
          onAriesWidgetUpdate={onAriesWidgetUpdate}
          onConfigOpen={onConfigOpen}
          getResizeHandles={getResizeHandles}
        />
      ))}

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

      {/* AriesWidget nested widgets - Fixed to use proper AriesModWidget rendering */}
      {nestAriesWidgets.map((widget) => (
        <GridWidget
          key={widget.id}
          widget={widget}
          isDragging={dragState.draggedId === widget.id}
          isResizing={resizeState.resizedId === widget.id}
          isPushed={pushedWidgets.has(widget.id)}
          onMouseDown={onWidgetMouseDown}
          onRemove={onAriesWidgetUpdate ? () => onAriesWidgetUpdate(widget.id, { deleted: true }) : onWidgetRemove}
          onUpdate={onAriesWidgetUpdate ? (updates) => onAriesWidgetUpdate(widget.id, updates) : undefined}
          getResizeHandles={getResizeHandles}
        />
      ))}
    </div>
  )
})

WidgetContainer.displayName = "WidgetContainer"

// Main NestContainer component with enhanced scrolling
export const NestContainer = memo<NestContainerProps>(({
  nest,
  nestedWidgets,
  nestedAriesWidgets,
  nestedNestContainers = [],
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
  onUpdate,
  onWidgetMouseDown,
  onWidgetRemove,
  onAriesWidgetUpdate,
  onConfigOpen,
  getResizeHandles,
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Calculate dynamic scroll bounds based on widget positions
  const scrollBounds = useMemo(() => {
    const regularWidgets = nestedWidgets.filter(w => w.nestId === nest.id)
    const ariesWidgets = nestedAriesWidgets.filter(w => w.nestId === nest.id)
    const childNests = nestedNestContainers.filter(n => n.parentNestId === nest.id)
    
    const allItems = [
      ...regularWidgets.map(w => ({ x: w.x, y: w.y, w: w.w, h: w.h })),
      ...ariesWidgets.map(w => ({ x: w.x, y: w.y, w: w.w, h: w.h })),
      ...childNests.map(n => ({ x: n.x, y: n.y, w: n.w, h: n.h }))
    ]
    
    if (allItems.length === 0) {
      return { minX: 0, minY: 0, maxX: nest.w, maxY: nest.h }
    }
    
    const minX = Math.min(0, ...allItems.map(item => item.x))
    const minY = Math.min(0, ...allItems.map(item => item.y))
    const maxX = Math.max(nest.w, ...allItems.map(item => item.x + item.w))
    const maxY = Math.max(nest.h, ...allItems.map(item => item.y + item.h))
    
    return { minX, minY, maxX, maxY }
  }, [nestedWidgets, nestedAriesWidgets, nestedNestContainers, nest.id, nest.w, nest.h])

  // Memoize total widget count including nested nests
  const totalWidgets = useMemo(() => {
    const regularWidgets = nestedWidgets.filter(w => w.nestId === nest.id).length
    const ariesWidgets = nestedAriesWidgets.filter(w => w.nestId === nest.id).length
    const childNests = nestedNestContainers.filter(n => n.parentNestId === nest.id).length
    return regularWidgets + ariesWidgets + childNests
  }, [nestedWidgets, nestedAriesWidgets, nestedNestContainers, nest.id])

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

  // Enhanced wheel event handler with bounds awareness
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
    
    const target = e.currentTarget
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = target
    
    const isScrollableY = scrollHeight > clientHeight
    const isScrollableX = scrollWidth > clientWidth
    
    if (isScrollableY || isScrollableX) {
      const atTop = scrollTop === 0
      const atBottom = scrollTop >= scrollHeight - clientHeight
      const atLeft = scrollLeft === 0
      const atRight = scrollLeft >= scrollWidth - clientWidth
      
      // Allow scrolling if we're not at the boundary or if we're scrolling away from the boundary
      if (isScrollableY && ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0))) {
        e.preventDefault()
      }
      if (isScrollableX && ((atLeft && e.deltaX < 0) || (atRight && e.deltaX > 0))) {
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
        scrollBounds={scrollBounds}
        onMouseDown={handleMouseDown}
        onRemove={handleRemove}
        onUpdate={onUpdate}
      />

      {/* Enhanced Scrollable Content Area */}
      <CardContent 
        ref={scrollRef}
        className="p-0 overflow-auto relative" 
        style={{ 
          scrollBehavior: 'smooth',
          height: 'calc(100% - 68px)' // Account for header height with padding
        }}
        onWheel={handleWheel}
      >
        {/* Enhanced scroll indicators */}
        <ScrollIndicators 
          hasContent={totalWidgets > 0} 
          scrollBounds={scrollBounds}
          nestSize={{ w: nest.w, h: nest.h }}
        />
        
        {/* Widget container with dynamic bounds */}
        {totalWidgets > 0 ? (
          <WidgetContainer
            nestedWidgets={nestedWidgets}
            nestedAriesWidgets={nestedAriesWidgets}
            nestedNestContainers={nestedNestContainers}
            nestId={nest.id}
            scrollBounds={scrollBounds}
            pushedWidgets={pushedWidgets}
            dragState={dragState}
            resizeState={resizeState}
            onWidgetMouseDown={onWidgetMouseDown}
            onWidgetRemove={onWidgetRemove}
            onAriesWidgetUpdate={onAriesWidgetUpdate}
            onConfigOpen={onConfigOpen}
            getResizeHandles={getResizeHandles}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onRemove={onRemove}
            onUpdate={onUpdate}
          />
        ) : (
          <EmptyNestState />
        )}
      </CardContent>
    </Card>
  )
})

NestContainer.displayName = "NestContainer" 