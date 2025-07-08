import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GripVertical, Hash, Settings, X } from "lucide-react"
import { useComms } from "@/components/comms-context"
import { MainGridWidget, DragState, ResizeState } from "../types"
import { ResizeHandles } from "./ResizeHandles"

interface MainWidgetProps {
  widget: MainGridWidget
  dragState: DragState
  resizeState: ResizeState
  onMouseDown: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => void
  onResizeMouseDown: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest", handle: any) => void
  onRemoveWidget: (id: string) => void
}

export const MainWidget: React.FC<MainWidgetProps> = ({
  widget,
  dragState,
  resizeState,
  onMouseDown,
  onResizeMouseDown,
  onRemoveWidget,
}) => {
  const { dispatch } = useComms()

  return (
    <Card
      key={widget.id}
      className={`absolute group bg-card/80 backdrop-blur border-border/50 hover:border-border transition-all duration-200 select-none ${
        dragState.draggedId === widget.id ? "shadow-lg scale-105 z-10" : ""
      } ${resizeState.resizedId === widget.id ? "shadow-lg z-10" : ""}`}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.w,
        height: widget.h,
        cursor: dragState.draggedId === widget.id ? "grabbing" : "default",
      }}
    >
      {/* Resize Handles */}
      <ResizeHandles itemId={widget.id} itemType="widget" onResizeMouseDown={onResizeMouseDown} />

      <CardHeader
        className="pb-2 cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => onMouseDown(e, widget.id, "widget")}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            <Badge variant="secondary" className="text-xs font-mono opacity-0 group-hover:opacity-100">
              {widget.id.split("-").pop()}
            </Badge>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => dispatch({ type: "SET_MODAL", payload: "widget-config" })}
            >
              <Hash className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => dispatch({ type: "SET_MODAL", payload: "widget-config" })}
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onRemoveWidget(widget.id)}
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
}