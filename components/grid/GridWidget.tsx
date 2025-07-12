"use client"

import React, { memo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Settings, Hash, GripVertical } from "lucide-react"
import { AriesModWidget } from "../widgets/ariesmod-widget"
import { EditableTitle } from "../widgets/editable-title"
import type { MainGridWidget, NestedWidget } from "./types"
import type { AriesWidget, NestedAriesWidget } from "@/types/ariesmods"

interface GridWidgetProps {
  widget: MainGridWidget | NestedWidget | AriesWidget | NestedAriesWidget
  isDragging: boolean
  isResizing: boolean
  isPushed: boolean
  onMouseDown: (e: React.MouseEvent, widgetId: string, widgetType: "widget") => void
  onRemove: (widgetId: string) => void
  onUpdate?: (widgetId: string, updates: Partial<AriesWidget | NestedAriesWidget>) => void
  onConfigOpen?: () => void
  getResizeHandles: (itemId: string, itemType: "widget") => React.ReactNode
  className?: string
}

// Memoized regular widget component
const RegularWidget = memo<{
  widget: MainGridWidget | NestedWidget
  isDragging: boolean
  isResizing: boolean
  isPushed: boolean
  onMouseDown: (e: React.MouseEvent, widgetId: string, widgetType: "widget") => void
  onRemove: (widgetId: string) => void
  onConfigOpen?: () => void
  getResizeHandles: (itemId: string, itemType: "widget") => React.ReactNode
  onUpdate?: (widgetId: string, updates: Partial<AriesWidget | NestedAriesWidget>) => void
}>(({ widget, isDragging, isResizing, isPushed, onMouseDown, onRemove, onConfigOpen, getResizeHandles, onUpdate }) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    onMouseDown(e, widget.id, "widget")
  }, [onMouseDown, widget.id])

  const handleRemove = useCallback(() => {
    onRemove(widget.id)
  }, [onRemove, widget.id])

  const handleUpdate = useCallback((updates: Partial<AriesWidget | NestedAriesWidget>) => {
    if (onUpdate) {
      onUpdate(widget.id, updates)
    }
  }, [onUpdate, widget.id])

  const handleTitleChange = useCallback((newTitle: string) => {
    handleUpdate({ title: newTitle })
  }, [handleUpdate])

  return (
    <Card
      className={`absolute group bg-card/80 backdrop-blur border-border/50 hover:border-border transition-all duration-200 select-none aries-widget-card ${
        isDragging ? "aries-widget-dragging aries-widget-smooth-drag" : ""
      } ${isResizing ? "aries-widget-resizing" : ""} ${
        isPushed ? "aries-widget-pushed" : ""
      }`}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.w,
        height: widget.h,
        cursor: isDragging ? "grabbing" : "default",
        willChange: isDragging || isResizing ? 'transform' : 'auto',
      }}
    >
      {/* Resize Handles */}
      {getResizeHandles(widget.id, "widget")}

      <CardHeader
        className="pb-2 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        data-drag-handle="true"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-3 w-3 text-muted-foreground" data-drag-handle="true" />
            <EditableTitle
              title={widget.title}
              onTitleChange={handleTitleChange}
              className="text-sm font-medium"
            />
            <Badge variant="secondary" className="text-xs font-mono opacity-0 group-hover:opacity-100">
              {widget.id.split("-").pop()}
            </Badge>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onConfigOpen}
            >
              <Hash className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onConfigOpen}
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {widget.type}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {widget.w}×{widget.h}
          </div>
        </div>
        <div className="text-lg font-mono text-center">{widget.content}</div>
      </CardContent>
    </Card>
  )
})

RegularWidget.displayName = "RegularWidget"

// Memoized AriesWidget component
const AriesWidgetComponent = memo<{
  widget: AriesWidget | NestedAriesWidget
  isDragging: boolean
  isResizing: boolean
  isPushed: boolean
  onMouseDown: (e: React.MouseEvent, widgetId: string, widgetType: "widget") => void
  onRemove: (widgetId: string) => void
  onUpdate?: (widgetId: string, updates: Partial<AriesWidget | NestedAriesWidget>) => void
  getResizeHandles: (itemId: string, itemType: "widget") => React.ReactNode
  isNested?: boolean
}>(({ widget, isDragging, isResizing, isPushed, onMouseDown, onRemove, onUpdate, getResizeHandles, isNested = false }) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    onMouseDown(e, widget.id, "widget")
  }, [onMouseDown, widget.id])

  const handleRemove = useCallback(() => {
    onRemove(widget.id)
  }, [onRemove, widget.id])

  const handleUpdate = useCallback((updates: Partial<AriesWidget | NestedAriesWidget>) => {
    if (onUpdate) {
      onUpdate(widget.id, updates)
    }
  }, [onUpdate, widget.id])

  const handleTitleChange = useCallback((newTitle: string) => {
    handleUpdate({ title: newTitle })
  }, [handleUpdate])

  return (
    <div
      className={`absolute group select-none aries-widget-card ${
        isDragging ? "aries-widget-dragging aries-widget-smooth-drag" : ""
      } ${isResizing ? "aries-widget-resizing" : ""} ${
        isPushed ? "aries-widget-pushed" : ""
      }`}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.w,
        height: widget.h,
        cursor: isDragging ? "grabbing" : "default",
        willChange: isDragging || isResizing ? 'transform' : 'auto',
      }}
    >
      {/* Resize Handles */}
      {getResizeHandles(widget.id, "widget")}

      {/* Drag Handle */}
      <div
        className={`absolute top-0 left-0 right-0 ${isNested ? 'h-6' : 'h-8'} cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/20 backdrop-blur-sm rounded-t-md flex items-center justify-between ${isNested ? 'px-1' : 'px-2'}`}
        onMouseDown={handleMouseDown}
        data-drag-handle="true"
      >
        <div className="flex items-center gap-1">
          <GripVertical className={`${isNested ? 'h-2 w-2' : 'h-3 w-3'} text-white`} data-drag-handle="true" />
          <EditableTitle
            title={widget.title}
            onTitleChange={handleTitleChange}
            className={`${isNested ? 'text-xs' : 'text-xs'} text-white font-medium`}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`${isNested ? 'h-4 w-4' : 'h-5 w-5'} text-white hover:text-red-400`}
          onClick={handleRemove}
        >
          <X className={`${isNested ? 'h-2 w-2' : 'h-3 w-3'}`} />
        </Button>
      </div>

      <AriesModWidget
        widget={widget}
        onUpdate={handleUpdate}
        className="w-full h-full rounded-md overflow-hidden"
      />
    </div>
  )
})

AriesWidgetComponent.displayName = "AriesWidgetComponent"

// Main GridWidget component with type discrimination
export const GridWidget = memo<GridWidgetProps>(({ 
  widget, 
  isDragging, 
  isResizing, 
  isPushed, 
  onMouseDown, 
  onRemove, 
  onUpdate, 
  onConfigOpen, 
  getResizeHandles,
  className 
}) => {
  // Type discrimination
  const isAriesWidget = widget.type === 'ariesmods'
  const isNested = 'nestId' in widget

  if (isAriesWidget) {
    return (
      <AriesWidgetComponent
        widget={widget as AriesWidget | NestedAriesWidget}
        isDragging={isDragging}
        isResizing={isResizing}
        isPushed={isPushed}
        onMouseDown={onMouseDown}
        onRemove={onRemove}
        onUpdate={onUpdate}
        getResizeHandles={getResizeHandles}
        isNested={isNested}
      />
    )
  }

  return (
    <RegularWidget
      widget={widget as MainGridWidget | NestedWidget}
      isDragging={isDragging}
      isResizing={isResizing}
      isPushed={isPushed}
      onMouseDown={onMouseDown}
      onRemove={onRemove}
      onConfigOpen={onConfigOpen}
      getResizeHandles={getResizeHandles}
      onUpdate={onUpdate}
    />
  )
})

GridWidget.displayName = "GridWidget" 