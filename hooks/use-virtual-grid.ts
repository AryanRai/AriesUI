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
    bufferSize = 300, // Increased buffer to prevent flickering
    minRenderDistance = 150,
    maxRenderCount = 150 // Increased max render count
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

  // Virtual grid calculation with better preservation
  const virtualGrid = useMemo(() => {
    const totalWidgets = 
      gridState.mainWidgets.length + 
      gridState.mainAriesWidgets.length + 
      gridState.nestContainers.length +
      gridState.nestedWidgets.length +
      gridState.nestedAriesWidgets.length

    // Disable virtualization for smaller grids to prevent data loss
    if (totalWidgets <= 80) {
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

    // Always render visible items first
    const visibleMainWidgets = gridState.mainWidgets.filter(isItemVisible)
    const visibleMainAriesWidgets = gridState.mainAriesWidgets.filter(isItemVisible)
    const visibleNestContainers = gridState.nestContainers.filter(isItemVisible)
    
    // For nested widgets, include them if their parent nest is visible
    const visibleNestIds = new Set(visibleNestContainers.map(nest => nest.id))
    
    // Always include all nested widgets from visible nests to prevent data loss
    const visibleNestedWidgets = gridState.nestedWidgets.filter(widget => 
      visibleNestIds.has(widget.nestId)
    )
    
    const visibleNestedAriesWidgets = gridState.nestedAriesWidgets.filter(widget => 
      visibleNestIds.has(widget.nestId)
    )

    // Calculate total visible items
    const visibleItems = visibleMainWidgets.length + visibleMainAriesWidgets.length + visibleNestContainers.length
    
    // If we have too many visible items, prioritize by distance but keep minimum set
    if (visibleItems > maxRenderCount) {
      const allVisibleItems = [
        ...visibleMainWidgets.map(item => ({ ...item, category: 'mainWidget' })),
        ...visibleMainAriesWidgets.map(item => ({ ...item, category: 'mainAriesWidget' })),
        ...visibleNestContainers.map(item => ({ ...item, category: 'nestContainer' }))
      ]
      
      // Sort by distance and keep the closest ones
      const prioritizedItems = allVisibleItems
        .map(item => ({
          ...item,
          distance: getDistanceFromViewportCenter(item)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, maxRenderCount)
      
      // Separate back into categories
      const finalMainWidgets = prioritizedItems.filter(item => item.category === 'mainWidget')
      const finalMainAriesWidgets = prioritizedItems.filter(item => item.category === 'mainAriesWidget')
      const finalNestContainers = prioritizedItems.filter(item => item.category === 'nestContainer')
      
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
    }

    // No need to prioritize - return all visible items
    const renderedWidgets = 
      visibleMainWidgets.length + 
      visibleMainAriesWidgets.length + 
      visibleNestContainers.length +
      visibleNestedWidgets.length +
      visibleNestedAriesWidgets.length

    return {
      visibleMainWidgets,
      visibleMainAriesWidgets,
      visibleNestContainers,
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