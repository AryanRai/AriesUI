/**
 * useResizeHandling Hook
 * 
 * Manages resize state and operations for widgets and nests.
 * Handles resize handles, constraints, and smooth resize animations.
 */

import { useState, useCallback, useEffect } from "react"
import React from "react"
import { ResizeHandles } from "@/components/grid/ResizeHandles"
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
  containerRef: React.RefObject<HTMLDivElement | null>
}

export interface UseResizeHandlingReturn {
  resizeState: ResizeState
  setResizeState: React.Dispatch<React.SetStateAction<ResizeState>>
  getResizeHandles: (item: any, itemType: "widget" | "nest") => React.ReactNode
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
   * Get position styles for resize handle
   */
  const getHandlePosition = (handle: ResizeHandle, item: any) => {
    const offset = -4 // Half of handle size
    const width = item.w * gridState.gridSize
    const height = item.h * gridState.gridSize
    
    switch (handle) {
      case 'nw': return { top: offset, left: offset }
      case 'n': return { top: offset, left: width / 2 + offset }
      case 'ne': return { top: offset, right: offset }
      case 'w': return { top: height / 2 + offset, left: offset }
      case 'e': return { top: height / 2 + offset, right: offset }
      case 'sw': return { bottom: offset, left: offset }
      case 's': return { bottom: offset, left: width / 2 + offset }
      case 'se': return { bottom: offset, right: offset }
      default: return {}
    }
  }

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
   * Handle mouse move for resize operations
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeState.isResizing || !resizeState.resizedId) return

    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    // Calculate world coordinates
    const worldX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
    const worldY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y

    // Calculate delta from start position
    const deltaX = worldX - resizeState.startPos.x
    const deltaY = worldY - resizeState.startPos.y

    // Calculate new size and position based on handle
    let newX = resizeState.startPosition.x
    let newY = resizeState.startPosition.y
    let newW = resizeState.startSize.w
    let newH = resizeState.startSize.h

    const gridSize = gridState.gridSize
    const minSize = gridSize // Minimum size is one grid unit

    switch (resizeState.handle) {
      case 'nw':
        newW = Math.max(minSize, resizeState.startSize.w - deltaX)
        newH = Math.max(minSize, resizeState.startSize.h - deltaY)
        newX = resizeState.startPosition.x + (resizeState.startSize.w - newW)
        newY = resizeState.startPosition.y + (resizeState.startSize.h - newH)
        break
      case 'n':
        newH = Math.max(minSize, resizeState.startSize.h - deltaY)
        newY = resizeState.startPosition.y + (resizeState.startSize.h - newH)
        break
      case 'ne':
        newW = Math.max(minSize, resizeState.startSize.w + deltaX)
        newH = Math.max(minSize, resizeState.startSize.h - deltaY)
        newY = resizeState.startPosition.y + (resizeState.startSize.h - newH)
        break
      case 'w':
        newW = Math.max(minSize, resizeState.startSize.w - deltaX)
        newX = resizeState.startPosition.x + (resizeState.startSize.w - newW)
        break
      case 'e':
        newW = Math.max(minSize, resizeState.startSize.w + deltaX)
        break
      case 'sw':
        newW = Math.max(minSize, resizeState.startSize.w - deltaX)
        newH = Math.max(minSize, resizeState.startSize.h + deltaY)
        newX = resizeState.startPosition.x + (resizeState.startSize.w - newW)
        break
      case 's':
        newH = Math.max(minSize, resizeState.startSize.h + deltaY)
        break
      case 'se':
        newW = Math.max(minSize, resizeState.startSize.w + deltaX)
        newH = Math.max(minSize, resizeState.startSize.h + deltaY)
        break
    }

    // Snap to grid
    newX = Math.round(newX / gridSize) * gridSize
    newY = Math.round(newY / gridSize) * gridSize
    newW = Math.round(newW / gridSize) * gridSize
    newH = Math.round(newH / gridSize) * gridSize

    // Update the item
    if (resizeState.resizedType === "widget") {
      setGridState(prev => ({
        ...prev,
        mainWidgets: prev.mainWidgets.map(w => 
          w.id === resizeState.resizedId ? { ...w, x: newX, y: newY, w: newW, h: newH } : w
        ),
        nestedWidgets: prev.nestedWidgets.map(w => 
          w.id === resizeState.resizedId ? { ...w, x: newX, y: newY, w: newW, h: newH } : w
        ),
        mainAriesWidgets: prev.mainAriesWidgets.map(w => 
          w.id === resizeState.resizedId ? { ...w, x: newX, y: newY, w: newW, h: newH } : w
        ),
        nestedAriesWidgets: prev.nestedAriesWidgets.map(w => 
          w.id === resizeState.resizedId ? { ...w, x: newX, y: newY, w: newW, h: newH } : w
        ),
      }))
    } else {
      setGridState(prev => ({
        ...prev,
        nestContainers: prev.nestContainers.map(n => 
          n.id === resizeState.resizedId ? { ...n, x: newX, y: newY, w: newW, h: newH } : n
        ),
      }))
    }
  }, [resizeState, containerRef, viewport, gridState, setGridState])

  /**
   * Handle mouse up for resize operations
   */
  const handleMouseUp = useCallback(() => {
    if (resizeState.isResizing) {
      setResizeState(DEFAULT_RESIZE_STATE)
    }
  }, [resizeState.isResizing])

  /**
   * Set up mouse event listeners for resize operations
   */
  useEffect(() => {
    if (resizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [resizeState.isResizing, handleMouseMove, handleMouseUp])

  /**
   * Get resize handles for an item
   */
  const getResizeHandles = useCallback((item: any, itemType: "widget" | "nest") => {
    if (!item) return null
    
    return React.createElement(ResizeHandles, {
      itemId: item.id,
      itemType: itemType,
      onResizeMouseDown: startResize
    })
  }, [startResize])

  /**
   * Remove the old getHandlePosition function since it's now in ResizeHandles component
   */

  return {
    resizeState,
    setResizeState,
    getResizeHandles,
    startResize,
  }
}