import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Grid3X3, X } from "lucide-react"
import { NestContainer, NestedWidget, DragState, ResizeState, DropState } from "../types"
import { ResizeHandles } from "./ResizeHandles"
import { NestedWidgetComponent } from "./NestedWidget"

interface NestContainerComponentProps {
  nest: NestContainer
  nestWidgets: NestedWidget[]
  dragState: DragState
  resizeState: ResizeState
  dropState: DropState
  dragOverNest: string | null
  onMouseDown: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => void
  onResizeMouseDown: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest", handle: any) => void
  onDragOver: (e: React.DragEvent, targetNestId?: string) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetNestId?: string) => void
  onRemoveNest: (id: string) => void
  onRemoveWidget: (id: string) => void
}

export const NestContainerComponent: React.FC<NestContainerComponentProps> = ({
  nest,
  nestWidgets,
  dragState,
  resizeState,
  dropState,
  dragOverNest,
  onMouseDown,
  onResizeMouseDown,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveNest,
  onRemoveWidget,
}) => {
  return (
    <Card
      key={nest.id}
      className={`absolute group bg-muted/20 backdrop-blur border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-all duration-200 select-none ${
        dragState.draggedId === nest.id ? "shadow-lg scale-105 z-10" : ""
      } ${resizeState.resizedId === nest.id ? "shadow-lg z-10" : ""} ${
        dropState.isDragOver && dropState.targetNestId === nest.id ? "border-primary/50 bg-primary/10" : ""
      } ${dragOverNest === nest.id ? "border-green-500/50 bg-green-500/10 scale-102" : ""}`}
      style={{
        left: nest.x,
        top: nest.y,
        width: nest.w,
        height: nest.h,
        cursor: dragState.draggedId === nest.id ? "grabbing" : "default",
      }}
      onDragOver={(e) => onDragOver(e, nest.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, nest.id)}
    >
      {/* Resize Handles */}
      <ResizeHandles itemId={nest.id} itemType="nest" onResizeMouseDown={onResizeMouseDown} />

      <CardHeader
        className="pb-2 cursor-grab active:cursor-grabbing bg-muted/40 border-b border-muted-foreground/20"
        onMouseDown={(e) => onMouseDown(e, nest.id, "nest")}
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
              {nestWidgets.length} widgets
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onRemoveNest(nest.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 h-full overflow-hidden relative">
        {/* Nested Widgets */}
        {nestWidgets.map((widget) => (
          <NestedWidgetComponent
            key={widget.id}
            widget={widget}
            dragState={dragState}
            resizeState={resizeState}
            onMouseDown={onMouseDown}
            onResizeMouseDown={onResizeMouseDown}
            onRemoveWidget={onRemoveWidget}
          />
        ))}

        {/* Empty nest state */}
        {nestWidgets.length === 0 && (
          <div className="absolute inset-4 flex items-center justify-center text-center border-2 border-dashed border-muted-foreground/20 rounded">
            <p className="text-xs text-muted-foreground">Drop widgets here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}