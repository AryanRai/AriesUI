import { useState, useEffect, useCallback, useMemo } from 'react'

interface GridItem {
  id: string
  x: number
  y: number
  w: number
  h: number
}

interface ViewportBounds {
  left: number
  top: number
  right: number
  bottom: number
}

interface VirtualGridOptions {
  containerWidth: number
  containerHeight: number
  viewport: { x: number; y: number; zoom: number }
  buffer?: number // Extra space around viewport to render
}

export function useVirtualGrid<T extends GridItem>(
  items: T[],
  options: VirtualGridOptions
) {
  const { containerWidth, containerHeight, viewport, buffer = 200 } = options

  // Calculate visible bounds with buffer
  const visibleBounds = useMemo<ViewportBounds>(() => {
    const left = -viewport.x - buffer
    const top = -viewport.y - buffer
    const right = left + containerWidth / viewport.zoom + buffer * 2
    const bottom = top + containerHeight / viewport.zoom + buffer * 2

    return { left, top, right, bottom }
  }, [viewport.x, viewport.y, viewport.zoom, containerWidth, containerHeight, buffer])

  // Filter items that are within visible bounds
  const visibleItems = useMemo(() => {
    return items.filter(item => {
      const itemRight = item.x + item.w
      const itemBottom = item.y + item.h

      return (
        item.x < visibleBounds.right &&
        itemRight > visibleBounds.left &&
        item.y < visibleBounds.bottom &&
        itemBottom > visibleBounds.top
      )
    })
  }, [items, visibleBounds])

  // Spatial partitioning for collision detection
  const spatialGrid = useMemo(() => {
    const cellSize = 200 // Grid cell size for spatial partitioning
    const grid = new Map<string, T[]>()

    items.forEach(item => {
      const startX = Math.floor(item.x / cellSize)
      const startY = Math.floor(item.y / cellSize)
      const endX = Math.floor((item.x + item.w) / cellSize)
      const endY = Math.floor((item.y + item.h) / cellSize)

      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          const key = `${x},${y}`
          if (!grid.has(key)) {
            grid.set(key, [])
          }
          grid.get(key)!.push(item)
        }
      }
    })

    return grid
  }, [items])

  // Fast collision detection using spatial partitioning
  const getCollisions = useCallback((item: GridItem) => {
    const cellSize = 200
    const startX = Math.floor(item.x / cellSize)
    const startY = Math.floor(item.y / cellSize)
    const endX = Math.floor((item.x + item.w) / cellSize)
    const endY = Math.floor((item.y + item.h) / cellSize)

    const potentialCollisions = new Set<T>()

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`
        const cellItems = spatialGrid.get(key)
        if (cellItems) {
          cellItems.forEach(cellItem => potentialCollisions.add(cellItem))
        }
      }
    }

    return Array.from(potentialCollisions).filter(other => {
      if (other.id === item.id) return false
      
      return (
        item.x < other.x + other.w &&
        item.x + item.w > other.x &&
        item.y < other.y + other.h &&
        item.y + item.h > other.y
      )
    })
  }, [spatialGrid])

  return {
    visibleItems,
    visibleBounds,
    getCollisions,
    totalItems: items.length,
    visibleCount: visibleItems.length
  }
} 