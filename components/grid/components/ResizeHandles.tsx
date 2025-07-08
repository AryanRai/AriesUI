import React from "react"
import { ResizeHandle } from "../types"

interface ResizeHandlesProps {
  itemId: string
  itemType: "widget" | "nest"
  onResizeMouseDown: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest", handle: ResizeHandle) => void
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({ itemId, itemType, onResizeMouseDown }) => {
  const handles: { handle: ResizeHandle; className: string; cursor: string }[] = [
    { handle: "nw", className: "top-0 left-0 -translate-x-1/2 -translate-y-1/2", cursor: "nw-resize" },
    { handle: "n", className: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "n-resize" },
    { handle: "ne", className: "top-0 right-0 translate-x-1/2 -translate-y-1/2", cursor: "ne-resize" },
    { handle: "e", className: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2", cursor: "e-resize" },
    { handle: "se", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2", cursor: "se-resize" },
    { handle: "s", className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", cursor: "s-resize" },
    { handle: "sw", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", cursor: "sw-resize" },
    { handle: "w", className: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2", cursor: "w-resize" },
  ]

  return (
    <>
      {handles.map(({ handle, className, cursor }) => (
        <div
          key={handle}
          className={`resize-handle absolute w-3 h-3 bg-primary border border-primary-foreground rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 ${className}`}
          style={{ cursor }}
          onMouseDown={(e) => onResizeMouseDown(e, itemId, itemType, handle)}
        />
      ))}
    </>
  )
}