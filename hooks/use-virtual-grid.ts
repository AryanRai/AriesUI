"use client"

import { useMemo, useCallback } from 'react'
import type { GridState } from '@/components/grid/types'

interface VirtualGridConfig {
  bufferSize?: number // Extra buffer around viewport in pixels
  minRenderDistance?: number // Minimum distance before culling
  maxRenderCount?: number // Maximum widgets to render at once
}

interface VirtualGridResult {
  visibleMainWidgets: any[]
  visibleMainAriesWidgets: any[]
  visibleNestContainers: any[]
  visibleNestedWidgets: any[]
  visibleNestedAriesWidgets: any[]
  totalWidgets: number
  renderedWidgets: number
  culledWidgets: number
  isVirtualizationActive: boolean
}

export function useVirtualGrid(
  gridState: GridState,
  viewport: { x: number; y: number; zoom: number },
  containerSize: { width: number; height: number },
  config: VirtualGridConfig = {}
): VirtualGridResult {
  const {
    bufferSize = 200,
    minRenderDistance = 100,
    maxRenderCount = 100
  } = config

  // Calculate visible viewport bounds with buffer
  const viewportBounds = useMemo(() => {
    const buffer = bufferSize / viewport.zoom
    
    return {
      left: -viewport.x - buffer,
      right: (-viewport.x + containerSize.width / viewport.zoom) + buffer,
      top: -viewport.y - buffer,
      bottom: (-viewport.y + containerSize.height / viewport.zoom) + buffer
    }
  }, [viewport, containerSize, bufferSize])

  // Check if an item is visible within the viewport
  const isItemVisible = useCallback((item: { x: number; y: number; w: number; h: number }) => {
    return !(
      item.x + item.w < viewportBounds.left ||
      item.x > viewportBounds.right ||
      item.y + item.h < viewportBounds.top ||
      item.y > viewportBounds.bottom
    )
  }, [viewportBounds])

  // Calculate distance from viewport center for priority rendering
  const getDistanceFromViewportCenter = useCallback((item: { x: number; y: number; w: number; h: number }) => {
    const viewportCenterX = -viewport.x + (containerSize.width / viewport.zoom) / 2
    const viewportCenterY = -viewport.y + (containerSize.height / viewport.zoom) / 2
    
    const itemCenterX = item.x + item.w / 2
    const itemCenterY = item.y + item.h / 2
    
    return Math.sqrt(
      Math.pow(itemCenterX - viewportCenterX, 2) + 
      Math.pow(itemCenterY - viewportCenterY, 2)
    )
  }, [viewport, containerSize])

  // Virtual grid calculation
  const virtualGrid = useMemo(() => {
    const totalWidgets = 
      gridState.mainWidgets.length + 
      gridState.mainAriesWidgets.length + 
      gridState.nestContainers.length +
      gridState.nestedWidgets.length +
      gridState.nestedAriesWidgets.length

    // If total widgets is small, don't virtualize
    if (totalWidgets <= 50) {
      return {
        visibleMainWidgets: gridState.mainWidgets,
        visibleMainAriesWidgets: gridState.mainAriesWidgets,
        visibleNestContainers: gridState.nestContainers,
        visibleNestedWidgets: gridState.nestedWidgets,
        visibleNestedAriesWidgets: gridState.nestedAriesWidgets,
        totalWidgets,
        renderedWidgets: totalWidgets,
        culledWidgets: 0,
        isVirtualizationActive: false
      }
    }

    // Filter main widgets by visibility
    const visibleMainWidgets = gridState.mainWidgets.filter(isItemVisible)
    const visibleMainAriesWidgets = gridState.mainAriesWidgets.filter(isItemVisible)
    
    // Filter nest containers by visibility
    const visibleNestContainers = gridState.nestContainers.filter(isItemVisible)
    
    // For nested widgets, check if their parent nest is visible
    const visibleNestIds = new Set(visibleNestContainers.map(nest => nest.id))
    
    const visibleNestedWidgets = gridState.nestedWidgets.filter(widget => 
      visibleNestIds.has(widget.nestId)
    )
    
    const visibleNestedAriesWidgets = gridState.nestedAriesWidgets.filter(widget => 
      visibleNestIds.has(widget.nestId)
    )

    // If we still have too many widgets, prioritize by distance
    const allVisibleItems = [
      ...visibleMainWidgets,
      ...visibleMainAriesWidgets,
      ...visibleNestContainers
    ]

    let finalVisibleItems = allVisibleItems
    
    if (allVisibleItems.length > maxRenderCount) {
      // Sort by distance from viewport center and take the closest ones
      finalVisibleItems = allVisibleItems
        .map(item => ({
          ...item,
          distance: getDistanceFromViewportCenter(item)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxRenderCount)
    }

    // Separate back into categories
    const finalMainWidgets = finalVisibleItems.filter(item => 
      gridState.mainWidgets.some(w => w.id === item.id)
    )
    const finalMainAriesWidgets = finalVisibleItems.filter(item => 
      gridState.mainAriesWidgets.some(w => w.id === item.id)
    )
    const finalNestContainers = finalVisibleItems.filter(item => 
      gridState.nestContainers.some(n => n.id === item.id)
    )

    const renderedWidgets = 
      finalMainWidgets.length + 
      finalMainAriesWidgets.length + 
      finalNestContainers.length +
      visibleNestedWidgets.length +
      visibleNestedAriesWidgets.length

    return {
      visibleMainWidgets: finalMainWidgets,
      visibleMainAriesWidgets: finalMainAriesWidgets,
      visibleNestContainers: finalNestContainers,
      visibleNestedWidgets,
      visibleNestedAriesWidgets,
      totalWidgets,
      renderedWidgets,
      culledWidgets: totalWidgets - renderedWidgets,
      isVirtualizationActive: true
    }
  }, [
    gridState,
    isItemVisible,
    getDistanceFromViewportCenter,
    maxRenderCount
  ])

  return virtualGrid
}

// Hook for getting virtual grid statistics
export function useVirtualGridStats(virtualGrid: VirtualGridResult) {
  return useMemo(() => {
    const cullingPercentage = virtualGrid.totalWidgets > 0 
      ? Math.round((virtualGrid.culledWidgets / virtualGrid.totalWidgets) * 100)
      : 0

    const performanceGain = virtualGrid.isVirtualizationActive
      ? `${cullingPercentage}% culled`
      : 'No virtualization'

    return {
      cullingPercentage,
      performanceGain,
      memoryReduction: virtualGrid.culledWidgets * 0.1, // Estimated KB saved per widget
      renderingLoad: virtualGrid.renderedWidgets / Math.max(virtualGrid.totalWidgets, 1)
    }
  }, [virtualGrid])
} 