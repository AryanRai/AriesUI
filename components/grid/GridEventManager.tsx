"use client"

import { useEffect, useCallback, useRef } from 'react'
import { usePerformanceDrag } from '@/hooks/use-performance-drag'
import { useVirtualGrid } from '@/hooks/use-virtual-grid'
import type { GridState as GridStateType } from './types'

interface GridEventManagerProps {
  gridState: GridStateType
  updateGridState: (updater: (prev: GridStateType) => GridStateType) => void
  viewport: { x: number; y: number; zoom: number }
  containerRef: React.RefObject<HTMLDivElement>
  dragState: any
  setDragState: (state: any) => void
  resizeState: any
  setResizeState: (state: any) => void
  isPanning: boolean
  setIsPanning: (panning: boolean) => void
  children: React.ReactNode
}

export function GridEventManager({
  gridState,
  updateGridState,
  viewport,
  containerRef,
  dragState,
  setDragState,
  resizeState,
  setResizeState,
  isPanning,
  setIsPanning,
  children
}: GridEventManagerProps) {
  
  // Use virtual grid for performance
  const { visibleItems, getCollisions } = useVirtualGrid(
    [...gridState.mainWidgets, ...gridState.nestContainers, ...gridState.mainAriesWidgets],
    {
      containerWidth: containerRef.current?.clientWidth || 1920,
      containerHeight: containerRef.current?.clientHeight || 1080,
      viewport,
      buffer: 300
    }
  )

  // Performance drag handlers
  const dragHandlers = usePerformanceDrag({
    onDragStart: useCallback((id: string, type: "widget" | "nest") => {
      console.log('Drag start:', id, type)
      // Apply hardware acceleration
      const element = document.querySelector(`[data-widget-id="${id}"], [data-nest-id="${id}"]`) as HTMLElement
      if (element) {
        element.style.willChange = 'transform'
        element.style.transform = 'translate3d(0, 0, 0)' // Force hardware layer
      }
    }, []),
    
    onDragMove: useCallback((id: string, x: number, y: number) => {
      // Ultra-smooth dragging with RAF
      const element = document.querySelector(`[data-widget-id="${id}"], [data-nest-id="${id}"]`) as HTMLElement
      if (element) {
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
    }, []),
    
    onDragEnd: useCallback((id: string, x: number, y: number) => {
      // Snap to grid and update state
      const gridSize = gridState.gridSize
      const snappedX = Math.round(x / gridSize) * gridSize
      const snappedY = Math.round(y / gridSize) * gridSize
      
      // Reset hardware acceleration
      const element = document.querySelector(`[data-widget-id="${id}"], [data-nest-id="${id}"]`) as HTMLElement
      if (element) {
        element.style.willChange = 'auto'
        element.style.transform = ''
      }
      
      // Update grid state
      updateGridState((prev) => ({
        ...prev,
        mainWidgets: prev.mainWidgets.map((widget) =>
          widget.id === id
            ? { ...widget, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
            : widget
        ),
        mainAriesWidgets: prev.mainAriesWidgets.map((widget) =>
          widget.id === id
            ? { ...widget, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
            : widget
        ),
        nestContainers: prev.nestContainers.map((nest) =>
          nest.id === id
            ? { ...nest, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
            : nest
        ),
      }))
    }, [gridState.gridSize, updateGridState])
  })

  // Enhanced mouse down handler with hardware acceleration
  const handleMouseDown = useCallback((e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => {
    e.preventDefault()
    e.stopPropagation()
    
    dragHandlers.startDrag(e, itemId, itemType)
  }, [dragHandlers])

  // Enhanced wheel handler
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    // Smooth zooming with RAF
    requestAnimationFrame(() => {
      if (e.ctrlKey) {
        const zoomDelta = e.deltaY > 0 ? 0.95 : 1.05
        const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * zoomDelta))
        // Viewport update will be handled by parent
      }
    })
  }, [viewport.zoom])

  // Set up wheel event listener with hardware acceleration
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      // Enable hardware acceleration on container
      container.style.willChange = 'transform'
      container.style.transform = 'translate3d(0, 0, 0)'
      
      container.addEventListener('wheel', handleWheel, { passive: false })
      
      return () => {
        container.removeEventListener('wheel', handleWheel)
        container.style.willChange = 'auto'
        container.style.transform = ''
      }
    }
  }, [handleWheel])

  return (
    <div className="relative w-full h-full">
      {children}
    </div>
  )
} 