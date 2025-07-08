import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GripVertical, X } from "lucide-react"
import { NestedWidget, DragState, ResizeState } from "../types"
import { ResizeHandles } from "./ResizeHandles"

interface NestedWidgetComponentProps {
  widget: NestedWidget
  dragState: DragState
  resizeState: ResizeState
  onMouseDown: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => void
  onResizeMouseDown: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest", handle: any) => void
  onRemoveWidget: (id: string) => void
}

export const NestedWidgetComponent: React.FC<NestedWidgetComponentProps> = ({
  widget,
  dragState,
  resizeState,
  onMouseDown,
  onResizeMouseDown,
  onRemoveWidget,
}) => {
  return (
    <Card
      key={widget.id}
      className="absolute group bg-card/80 backdrop-blur border-border/50 hover:border-border transition-all duration-200 select-none"
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.w,
        height: widget.h,
      }}
    >
      {/* Resize Handles */}
      <ResizeHandles itemId={widget.id} itemType="widget" onResizeMouseDown={onResizeMouseDown} />

      <CardHeader
        className="pb-1 cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => onMouseDown(e, widget.id, "widget")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <GripVertical className="h-2 w-2 text-muted-foreground" />
            <CardTitle className="text-xs font-medium">{widget.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs font-mono opacity-0 group-hover:opacity-100">
              {widget.id.split("-").pop()}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100"
              onClick={() => onRemoveWidget(widget.id)}
            >
              <X className="h-2 w-2" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-center">{widget.content}</CardContent>
    </Card>
  )
}