/**
 * usePerformanceMonitoring Hook
 * 
 * Monitors and optimizes performance including batched updates,
 * RAF optimization, and virtual rendering metrics.
 */

import { useState, useRef, useCallback, useMemo } from "react"
import type { GridState as GridStateType } from "@/components/grid/types"
import type { ViewportState } from "./use-viewport-controls"

export interface PerformanceMetrics {
  totalWidgets: number
  renderedWidgets: number
  culledWidgets: number
  isVirtualizationActive: boolean
  cullingPercentage: number
  lastUpdateTime: number
  batchedUpdatesCount: number
}

export interface UsePerformanceMonitoringProps {
  gridState: GridStateType
  viewport: ViewportState
  containerSize: { width: number; height: number }
  draggedId?: string | null
  resizedId?: string | null
}

export interface UsePerformanceMonitoringReturn {
  performanceMetrics: PerformanceMetrics
  batchWidgetUpdate: (widgetId: string, updates: any) => void
  virtualGrid: {
    visibleMainWidgets: any[]
    visibleMainAriesWidgets: any[]
    visibleNestContainers: any[]
    visibleNestedWidgets: any[]
    visibleNestedAriesWidgets: any[]
    totalWidgets: number
    renderedWidgets: number
    culledWidgets: number
    isVirtualizationActive: boolean
    cullingPercentage: number
  }
  rafRef: React.MutableRefObject<number | null>
  clearRAF: () => void
}

export const usePerformanceMonitoring = ({
  gridState,
  viewport,
  containerSize,
  draggedId = null,
  resizedId = null,
}: UsePerformanceMonitoringProps): UsePerformanceMonitoringReturn => {
  // Performance tracking
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    totalWidgets: 0,
    renderedWidgets: 0,
    culledWidgets: 0,
    isVirtualizationActive: false,
    cullingPercentage: 0,
    lastUpdateTime: 0,
    batchedUpdatesCount: 0,
  })

  // Batched updates for performance
  const batchedUpdates = useRef<Map<string, any>>(new Map())
  const updateBatchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const rafRef = useRef<number | null>(null)

  /**
   * Clear any pending RAF
   */
  const clearRAF = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  /**
   * Optimized batched widget updates
   */
  const batchWidgetUpdate = useCallback((widgetId: string, updates: any) => {
    batchedUpdates.current.set(widgetId, { 
      ...batchedUpdates.current.get(widgetId), 
      ...updates 
    })
    
    if (updateBatchTimeoutRef.current) {
      clearTimeout(updateBatchTimeoutRef.current)
    }
    
    updateBatchTimeoutRef.current = setTimeout(() => {
      const updates = new Map(batchedUpdates.current)
      batchedUpdates.current.clear()
      
      setPerformanceMetrics(prev => ({
        ...prev,
        batchedUpdatesCount: prev.batchedUpdatesCount + updates.size,
        lastUpdateTime: Date.now(),
      }))
      
      // Note: The actual grid state update would be handled by the parent component
      // since this hook doesn't directly manage grid state
    }, 16) // ~60fps batching
  }, [])

  /**
   * Virtual grid with frustum culling for performance
   */
  const virtualGrid = useMemo(() => {
    const bufferSize = 300
    const viewportBounds = {
      left: -viewport.x - bufferSize,
      top: -viewport.y - bufferSize,
      right: -viewport.x + containerSize.width / viewport.zoom + bufferSize,
      bottom: -viewport.y + containerSize.height / viewport.zoom + bufferSize,
    }

    const isVisible = (item: { x: number; y: number; w: number; h: number }) => {
      return (
        item.x < viewportBounds.right &&
        item.x + item.w > viewportBounds.left &&
        item.y < viewportBounds.bottom &&
        item.y + item.h > viewportBounds.top
      )
    }

    // Always render dragged/resized items regardless of visibility
    const isDraggedOrResized = (id: string) => 
      draggedId === id || resizedId === id

    const visibleMainWidgets = gridState.mainWidgets.filter(
      widget => isVisible(widget) || isDraggedOrResized(widget.id)
    )
    const visibleMainAriesWidgets = gridState.mainAriesWidgets.filter(
      widget => isVisible(widget) || isDraggedOrResized(widget.id)
    )
    const visibleNestContainers = gridState.nestContainers.filter(
      nest => isVisible(nest) || isDraggedOrResized(nest.id)
    )

    // For nested items, include all if parent nest is visible
    const visibleNestedWidgets = gridState.nestedWidgets.filter(widget => {
      const parentNest = gridState.nestContainers.find(nest => nest.id === widget.nestId)
      return parentNest && (isVisible(parentNest) || isDraggedOrResized(widget.id))
    })
    const visibleNestedAriesWidgets = gridState.nestedAriesWidgets.filter(widget => {
      const parentNest = gridState.nestContainers.find(nest => nest.id === widget.nestId)
      return parentNest && (isVisible(parentNest) || isDraggedOrResized(widget.id))
    })

    const totalItems = gridState.mainWidgets.length + gridState.mainAriesWidgets.length + 
                     gridState.nestContainers.length + gridState.nestedWidgets.length + 
                     gridState.nestedAriesWidgets.length
    const renderedItems = visibleMainWidgets.length + visibleMainAriesWidgets.length + 
                         visibleNestContainers.length + visibleNestedWidgets.length + 
                         visibleNestedAriesWidgets.length
    const culledItems = totalItems - renderedItems

    // Update performance metrics
    setPerformanceMetrics(prev => ({
      ...prev,
      totalWidgets: totalItems,
      renderedWidgets: renderedItems,
      culledWidgets: culledItems,
      isVirtualizationActive: culledItems > 0,
      cullingPercentage: totalItems > 0 ? (culledItems / totalItems) * 100 : 0,
    }))

    return {
      visibleMainWidgets,
      visibleMainAriesWidgets,
      visibleNestContainers,
      visibleNestedWidgets,
      visibleNestedAriesWidgets,
      totalWidgets: totalItems,
      renderedWidgets: renderedItems,
      culledWidgets: culledItems,
      isVirtualizationActive: culledItems > 0,
      cullingPercentage: totalItems > 0 ? (culledItems / totalItems) * 100 : 0,
    }
  }, [gridState, viewport, containerSize, draggedId, resizedId])

  return {
    performanceMetrics,
    batchWidgetUpdate,
    virtualGrid,
    rafRef,
    clearRAF,
  }
}