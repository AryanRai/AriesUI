import { useCallback, useRef, useEffect } from 'react'
import type { GridState as GridStateType } from '@/components/grid/types'

interface OptimizedEventHandlers {
  onDragStart: (id: string, type: "widget" | "nest") => void
  onDragMove: (id: string, x: number, y: number) => void
  onDragEnd: (id: string, x: number, y: number) => void
  onResizeStart: (id: string, type: "widget" | "nest", handle: string) => void
  onResizeMove: (id: string, x: number, y: number, width: number, height: number) => void
  onResizeEnd: (id: string) => void
}

export function useOptimizedEvents(
  gridState: GridStateType,
  updateGridState: (updater: (prev: GridStateType) => GridStateType) => void,
  viewport: { x: number; y: number; zoom: number }
): OptimizedEventHandlers {
  const rafRef = useRef<number>()
  const dragDataRef = useRef<{
    id: string
    type: "widget" | "nest"
    element?: HTMLElement
  }>()

  // Hardware-accelerated transform updates
  const updateElementTransform = useCallback((element: HTMLElement, x: number, y: number) => {
    // Use CSS transforms for hardware acceleration
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`
    element.style.willChange = 'transform'
  }, [])

  const resetElementTransform = useCallback((element: HTMLElement) => {
    element.style.transform = ''
    element.style.willChange = 'auto'
  }, [])

  const onDragStart = useCallback((id: string, type: "widget" | "nest") => {
    const element = document.querySelector(`[data-widget-id="${id}"], [data-nest-id="${id}"]`) as HTMLElement
    if (element) {
      dragDataRef.current = { id, type, element }
      element.style.zIndex = '1000'
      element.style.pointerEvents = 'none'
    }
  }, [])

  const onDragMove = useCallback((id: string, x: number, y: number) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = requestAnimationFrame(() => {
      const element = dragDataRef.current?.element
      if (element && dragDataRef.current?.id === id) {
        updateElementTransform(element, x, y)
      }
    })
  }, [updateElementTransform])

  const onDragEnd = useCallback((id: string, finalX: number, finalY: number) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    const element = dragDataRef.current?.element
    if (element) {
      resetElementTransform(element)
      element.style.zIndex = ''
      element.style.pointerEvents = ''
    }

    // Update grid state with final position
    const gridSize = gridState.gridSize
    const snappedX = Math.round(finalX / gridSize) * gridSize
    const snappedY = Math.round(finalY / gridSize) * gridSize

    updateGridState((prev) => {
      if (dragDataRef.current?.type === "nest") {
        return {
          ...prev,
          nestContainers: prev.nestContainers.map((nest) =>
            nest.id === id
              ? { ...nest, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
              : nest
          ),
        }
      } else {
        return {
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
        }
      }
    })

    dragDataRef.current = undefined
  }, [gridState.gridSize, updateGridState, resetElementTransform])

  const onResizeStart = useCallback((id: string, type: "widget" | "nest", handle: string) => {
    // Resize start logic
  }, [])

  const onResizeMove = useCallback((id: string, x: number, y: number, width: number, height: number) => {
    // Hardware-accelerated resize updates
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = requestAnimationFrame(() => {
      const element = document.querySelector(`[data-widget-id="${id}"], [data-nest-id="${id}"]`) as HTMLElement
      if (element) {
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`
        element.style.width = `${width}px`
        element.style.height = `${height}px`
        element.style.willChange = 'transform, width, height'
      }
    })
  }, [])

  const onResizeEnd = useCallback((id: string) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    const element = document.querySelector(`[data-widget-id="${id}"], [data-nest-id="${id}"]`) as HTMLElement
    if (element) {
      element.style.willChange = 'auto'
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return {
    onDragStart,
    onDragMove,
    onDragEnd,
    onResizeStart,
    onResizeMove,
    onResizeEnd
  }
} 