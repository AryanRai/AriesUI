/**
 * useResizeHandling Hook
 * 
 * Manages resize state and operations for widgets and nests.
 * Handles resize handles, constraints, and smooth resize animations.
 */

import { useState, useCallback } from "react"
import type { GridState as GridStateType, ResizeHandle } from "@/components/grid/types"
import type { ViewportState } from "./use-viewport-controls"

export interface ResizeState {
  isResizing: boolean
  resizedId: string | null
  resizedType: "widget" | "nest" | null
  handle: ResizeHandle | null
  startPos: { x: number; y: number }
  startSize: { w: number; h: number }
  startPosition: { x: number; y: number }
  lastUpdateTime: number
  animationFrameId?: number
}

export interface UseResizeHandlingProps {
  gridState: GridStateType
  setGridState: React.Dispatch<React.SetStateAction<GridStateType>>
  viewport: ViewportState
  containerRef: React.RefObject<HTMLDivElement>
}

export interface UseResizeHandlingReturn {
  resizeState: ResizeState
  setResizeState: React.Dispatch<React.SetStateAction<ResizeState>>
  getResizeHandles: (item: any, itemType: "widget" | "nest") => JSX.Element | null
  startResize: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest", handle: ResizeHandle) => void
}

const DEFAULT_RESIZE_STATE: ResizeState = {
  isResizing: false,
  resizedId: null,
  resizedType: null,
  handle: null,
  startPos: { x: 0, y: 0 },
  startSize: { w: 0, h: 0 },
  startPosition: { x: 0, y: 0 },
  lastUpdateTime: 0,
}

export const useResizeHandling = ({
  gridState,
  setGridState,
  viewport,
  containerRef,
}: UseResizeHandlingProps): UseResizeHandlingReturn => {
  const [resizeState, setResizeState] = useState<ResizeState>(DEFAULT_RESIZE_STATE)

  /**
   * Start resize operation
   */
  const startResize = useCallback((
    e: React.MouseEvent, 
    itemId: string, 
    itemType: "widget" | "nest", 
    handle: ResizeHandle
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    // Get the item being resized
    let item: any = null
    if (itemType === "widget") {
      item = gridState.mainWidgets.find((w) => w.id === itemId) || 
             gridState.nestedWidgets.find((w) => w.id === itemId) ||
             gridState.mainAriesWidgets.find((w) => w.id === itemId) ||
             gridState.nestedAriesWidgets.find((w) => w.id === itemId)
    } else {
      item = gridState.nestContainers.find((n) => n.id === itemId)
    }

    if (!item) return

    // Convert screen coordinates to world coordinates
    const worldX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
    const worldY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y

    setResizeState({
      isResizing: true,
      resizedId: itemId,
      resizedType: itemType,
      handle,
      startPos: { x: worldX, y: worldY },
      startSize: { w: item.w, h: item.h },
      startPosition: { x: item.x, y: item.y },
      lastUpdateTime: Date.now(),
    })

    console.log("Starting resize for:", itemType, itemId, "handle:", handle)
  }, [containerRef, viewport, gridState])

  /**
   * Get resize handles for an item
   */
  const getResizeHandles = useCallback((item: any, itemType: "widget" | "nest"): React.ReactNode => {
    // This would be implemented by the parent component
    // For now, return null since the parent should handle resize handles
    return null
  }, [startResize])

  return {
    resizeState,
    setResizeState,
    getResizeHandles,
    startResize,
  }
}