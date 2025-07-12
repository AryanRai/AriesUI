/**
 * ViewportControls Component
 * 
 * Provides zoom controls, viewport information, and toolbar positioning.
 * Extracted from main-content.tsx for better modularity.
 */

import React from "react"
import { Button } from "@/components/ui/button"
import { GripVertical, Eye, EyeOff } from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { ViewportState } from "@/hooks/use-viewport-controls"

export interface ViewportControlsProps {
  viewport: ViewportState
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>
  onResetView: () => void
  dragState?: {
    isDragging: boolean
    draggedType: string | null
  }
}

interface ToolbarPosition {
  top: number
  left: number
}

export const ViewportControls: React.FC<ViewportControlsProps> = ({
  viewport,
  setViewport,
  onResetView,
  dragState,
}) => {
  const [isViewportInfoVisible, setIsViewportInfoVisible] = useLocalStorage("aries-show-viewport-info", true)
  const [zoomToolbarPosition, setZoomToolbarPosition] = useLocalStorage<ToolbarPosition>("aries-zoom-toolbar-pos", { top: 80, left: 200 })
  
  // Drag state for zoom toolbar
  const [isDraggingZoomToolbar, setIsDraggingZoomToolbar] = React.useState(false)
  const [zoomToolbarDragStart, setZoomToolbarDragStart] = React.useState({ x: 0, y: 0, top: 0, left: 0 })

  /**
   * Handle zoom toolbar drag start
   */
  const handleZoomToolbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingZoomToolbar(true)
    setZoomToolbarDragStart({
      x: e.clientX,
      y: e.clientY,
      top: zoomToolbarPosition.top,
      left: zoomToolbarPosition.left,
    })
  }

  /**
   * Reset toolbar positions to default
   */
  const resetToolbarPositions = React.useCallback(() => {
    setZoomToolbarPosition({ top: 80, left: 200 })
  }, [setZoomToolbarPosition])

  // Handle mouse move for toolbar dragging
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingZoomToolbar) {
        const deltaX = e.clientX - zoomToolbarDragStart.x
        const deltaY = e.clientY - zoomToolbarDragStart.y
        
        const newTop = zoomToolbarDragStart.top + deltaY
        const newLeft = zoomToolbarDragStart.left + deltaX

        setZoomToolbarPosition({
          top: Math.max(16, Math.min(newTop, window.innerHeight - 60)),
          left: Math.max(20, Math.min(newLeft, window.innerWidth - 300)),
        })
      }
    }

    const handleMouseUp = () => {
      setIsDraggingZoomToolbar(false)
    }

    if (isDraggingZoomToolbar) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingZoomToolbar, zoomToolbarDragStart, setZoomToolbarPosition])

  return (
    <>
      {/* Zoom Toolbar */}
      <div 
        className="absolute z-50 flex gap-1 bg-background/90 backdrop-blur-sm border border-border/50 rounded-md p-1 shadow-lg"
        style={{
          top: zoomToolbarPosition.top,
          left: zoomToolbarPosition.left,
        }}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center w-4 cursor-grab active:cursor-grabbing hover:bg-muted/50 rounded-sm transition-colors"
          onMouseDown={handleZoomToolbarMouseDown}
          title="Drag to move zoom toolbar"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }))}
          title="Zoom Out"
        >
          <span className="text-sm">-</span>
        </Button>
        <div className="flex items-center px-2 text-xs text-muted-foreground min-w-[50px] justify-center">
          {Math.round(viewport.zoom * 100)}%
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.25) }))}
          title="Zoom In"
        >
          <span className="text-sm">+</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={onResetView}
          title="Reset View"
        >
          <span className="text-xs">⌂</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setIsViewportInfoVisible(!isViewportInfoVisible)}
          title={isViewportInfoVisible ? "Hide Viewport Info" : "Show Viewport Info"}
        >
          {isViewportInfoVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={resetToolbarPositions}
          title="Reset all toolbar positions to default"
        >
          <span className="text-xs">⌘</span>
        </Button>
      </div>

      {/* Viewport Info */}
      {isViewportInfoVisible && (
        <div className="absolute top-16 left-4 z-50 text-xs text-muted-foreground bg-background/90 px-3 py-2 rounded backdrop-blur-sm border border-border/50 shadow-lg">
          <div>Zoom: {(viewport.zoom * 100).toFixed(0)}%</div>
          <div>
            Position: ({Math.round(viewport.x)}, {Math.round(viewport.y)})
          </div>
          {dragState?.isDragging && (
            <div className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              Smooth Drag: {dragState.draggedType === "nest" ? "Nest" : "Widget"}
            </div>
          )}
          <div className="text-xs opacity-75 mt-1">Ctrl+Wheel: Zoom • Middle Click: Pan • Ctrl+Click: Pan</div>
        </div>
      )}
    </>
  )
}