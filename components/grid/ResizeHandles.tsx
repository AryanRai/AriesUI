"use client"

import React, { memo, useCallback } from "react"
import type { ResizeHandle } from "./types"

interface ResizeHandlesProps {
  itemId: string
  itemType: "widget" | "nest"
  onResizeMouseDown: (
    e: React.MouseEvent,
    itemId: string,
    itemType: "widget" | "nest",
    handle: ResizeHandle
  ) => void
  className?: string
}

// Handle configuration with cursor mappings
const RESIZE_HANDLE_CONFIG: Array<{
  handle: ResizeHandle
  className: string
  cursor: string
}> = [
  { handle: "nw", className: "top-0 left-0 -translate-x-1/2 -translate-y-1/2", cursor: "nw-resize" },
  { handle: "n", className: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "n-resize" },
  { handle: "ne", className: "top-0 right-0 translate-x-1/2 -translate-y-1/2", cursor: "ne-resize" },
  { handle: "e", className: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2", cursor: "e-resize" },
  { handle: "se", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2", cursor: "se-resize" },
  { handle: "s", className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", cursor: "s-resize" },
  { handle: "sw", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", cursor: "sw-resize" },
  { handle: "w", className: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2", cursor: "w-resize" },
]

// Individual resize handle component
const ResizeHandleComponent = memo<{
  handle: ResizeHandle
  className: string
  cursor: string
  itemId: string
  itemType: "widget" | "nest"
  onResizeMouseDown: (
    e: React.MouseEvent,
    itemId: string,
    itemType: "widget" | "nest",
    handle: ResizeHandle
  ) => void
}>(({ handle, className, cursor, itemId, itemType, onResizeMouseDown }) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onResizeMouseDown(e, itemId, itemType, handle)
  }, [onResizeMouseDown, itemId, itemType, handle])

  return (
    <div
      className={`resize-handle absolute w-3 h-3 bg-primary border border-primary-foreground rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 ${className}`}
      style={{ cursor }}
      onMouseDown={handleMouseDown}
      data-handle={handle}
      data-testid={`resize-handle-${handle}`}
    />
  )
})

ResizeHandleComponent.displayName = "ResizeHandleComponent"

// Main ResizeHandles component
export const ResizeHandles = memo<ResizeHandlesProps>(({
  itemId,
  itemType,
  onResizeMouseDown,
  className
}) => {
  return (
    <>
      {RESIZE_HANDLE_CONFIG.map(({ handle, className: handleClassName, cursor }) => (
        <ResizeHandleComponent
          key={handle}
          handle={handle}
          className={handleClassName}
          cursor={cursor}
          itemId={itemId}
          itemType={itemType}
          onResizeMouseDown={onResizeMouseDown}
        />
      ))}
    </>
  )
})

ResizeHandles.displayName = "ResizeHandles"

// Export handle configuration for external use
export { RESIZE_HANDLE_CONFIG } 