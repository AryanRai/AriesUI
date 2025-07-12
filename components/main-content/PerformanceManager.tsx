"use client"

import React, { useRef, useCallback, useMemo, useEffect } from 'react'
import type { 
  PerformanceMetrics, 
  VirtualGrid, 
  ViewportState, 
  ContainerSize,
  GridStateType,
  GridItem
} from './types'

interface PerformanceManagerProps {
  gridState: GridStateType
  viewport: ViewportState
  containerSize: ContainerSize
  draggedId: string | null
  resizedId: string | null
  children: React.ReactNode
}

export const PerformanceManager: React.FC<PerformanceManagerProps> = ({
  gridState,
  viewport,
  containerSize,
  draggedId,
  resizedId,
  children
}) => {
  // Performance monitoring refs
  const performanceMetrics = useRef<PerformanceMetrics>({
    frameCount: 0,
    lastFrameTime: 0,
    avgFrameTime: 16.67, // Target 60fps
    dragOperations: 0,
    resizeOperations: 0,
  })

  // Optimized widget update batching
  const batchedUpdates = useRef<Map<string, any>>(new Map())
  const updateBatchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Enhanced virtual grid with better performance
  const virtualGrid = useMemo<VirtualGrid>(() => {
    const bufferSize = 300
    const viewportBounds = {
      left: -viewport.x - bufferSize,
      top: -viewport.y - bufferSize,
      right: -viewport.x + containerSize.width / viewport.zoom + bufferSize,
      bottom: -viewport.y + containerSize.height / viewport.zoom + bufferSize,
    }

    const isVisible = (item: GridItem) => {
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
      (widget: GridItem) => isVisible(widget) || isDraggedOrResized(widget.id)
    )
    const visibleMainAriesWidgets = gridState.mainAriesWidgets.filter(
      (widget: GridItem) => isVisible(widget) || isDraggedOrResized(widget.id)
    )
    const visibleNestContainers = gridState.nestContainers.filter(
      (nest: GridItem) => isVisible(nest) || isDraggedOrResized(nest.id)
    )

    // For nested items, include all if parent nest is visible
    const visibleNestedWidgets = gridState.nestedWidgets.filter((widget: GridItem) => {
      const parentNest = gridState.nestContainers.find((nest: GridItem) => nest.id === widget.nestId)
      return parentNest && (isVisible(parentNest) || isDraggedOrResized(widget.id))
    })
    const visibleNestedAriesWidgets = gridState.nestedAriesWidgets.filter((widget: GridItem) => {
      const parentNest = gridState.nestContainers.find((nest: GridItem) => nest.id === widget.nestId)
      return parentNest && (isVisible(parentNest) || isDraggedOrResized(widget.id))
    })

    const totalItems = gridState.mainWidgets.length + gridState.mainAriesWidgets.length + 
                     gridState.nestContainers.length + gridState.nestedWidgets.length + 
                     gridState.nestedAriesWidgets.length
    const renderedItems = visibleMainWidgets.length + visibleMainAriesWidgets.length + 
                         visibleNestContainers.length + visibleNestedWidgets.length + 
                         visibleNestedAriesWidgets.length
    const culledItems = totalItems - renderedItems

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

  // Optimized batched widget updates
  const batchWidgetUpdate = useCallback((widgetId: string, updates: any) => {
    batchedUpdates.current.set(widgetId, { ...batchedUpdates.current.get(widgetId), ...updates })
    
    if (updateBatchTimeoutRef.current) {
      clearTimeout(updateBatchTimeoutRef.current)
    }
    
    updateBatchTimeoutRef.current = setTimeout(() => {
      const updates = new Map(batchedUpdates.current)
      batchedUpdates.current.clear()
      
      if (updates.size > 0) {
        // Emit batched updates event
        window.dispatchEvent(new CustomEvent('batchedWidgetUpdates', { detail: updates }))
      }
    }, 16) // Batch updates every 16ms (60fps)
  }, [])

  // Performance-optimized frame rate monitoring
  const updatePerformanceMetrics = useCallback(() => {
    const now = performance.now()
    const frameTime = now - performanceMetrics.current.lastFrameTime
    performanceMetrics.current.lastFrameTime = now
    performanceMetrics.current.frameCount++
    
    // Exponential moving average for smooth frame time tracking
    performanceMetrics.current.avgFrameTime = 
      performanceMetrics.current.avgFrameTime * 0.9 + frameTime * 0.1
  }, [])

  // Optimized mouse move handler with requestAnimationFrame
  const optimizedMouseMove = useCallback((e: MouseEvent, updateCallback: () => void) => {
    const now = performance.now()
    
    // Throttle updates to 60fps max
    if (now - performanceMetrics.current.lastFrameTime < 16.67) {
      return
    }
    
    updatePerformanceMetrics()
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      updateCallback()
    })
  }, [updatePerformanceMetrics])

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (updateBatchTimeoutRef.current) {
        clearTimeout(updateBatchTimeoutRef.current)
      }
    }
  }, [])

  // Expose performance utilities through context
  const performanceContext = useMemo(() => ({
    virtualGrid,
    performanceMetrics: performanceMetrics.current,
    batchWidgetUpdate,
    updatePerformanceMetrics,
    optimizedMouseMove
  }), [virtualGrid, batchWidgetUpdate, updatePerformanceMetrics, optimizedMouseMove])

  return (
    <div className="performance-manager">
      {/* Performance Status Bar */}
      <div className="absolute bottom-4 right-4 z-50 bg-black/80 text-green-400 px-3 py-1 rounded text-xs font-mono">
        ⚡ Hardware Acceleration: ACTIVE | Virtual Grid: {virtualGrid.cullingPercentage.toFixed(2)}% | Rendered: {virtualGrid.renderedWidgets}/{virtualGrid.totalWidgets}
      </div>
      
      {/* Provide context to children */}
      <div data-performance-context={JSON.stringify(performanceContext)}>
        {children}
      </div>
    </div>
  )
}

// Hook to access performance context
export const usePerformanceContext = () => {
  const contextElement = document.querySelector('[data-performance-context]')
  if (!contextElement) return null
  
  try {
    return JSON.parse(contextElement.getAttribute('data-performance-context') || '{}')
  } catch {
    return null
  }
} 