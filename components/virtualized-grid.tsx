"use client"

import React, { useMemo, useCallback, useRef, memo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useVirtualGrid } from '@/hooks/use-virtual-grid'
import { usePerformanceOptimization } from '@/hooks/use-performance-optimization'
import { LazyComponent } from './lazy-component'

interface GridItem {
  id: string
  x: number
  y: number
  w: number
  h: number
  type: string
  content?: React.ReactNode
  data?: any
}

interface VirtualizedGridProps {
  items: GridItem[]
  cellSize: number
  containerWidth: number
  containerHeight: number
  renderItem: (item: GridItem, index: number, isVisible: boolean) => React.ReactNode
  onItemUpdate?: (item: GridItem) => void
  onSelectionChange?: (selectedIds: string[]) => void
  className?: string
  enableAnimations?: boolean
  enableSelection?: boolean
  enableVirtualization?: boolean
  overscan?: number
  gridStyle?: 'dots' | 'lines' | 'none'
  showPerformanceOverlay?: boolean
}

/**
 * High-performance virtualized grid component
 * Only renders visible items and uses spatial indexing for fast lookups
 */
export const VirtualizedGrid = memo<VirtualizedGridProps>(({
  items,
  cellSize,
  containerWidth,
  containerHeight,
  renderItem,
  onItemUpdate,
  onSelectionChange,
  className,
  enableAnimations = true,
  enableSelection = true,
  enableVirtualization = true,
  overscan = 2,
  gridStyle = 'dots',
  showPerformanceOverlay = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Performance optimization
  const {
    performanceMetrics,
    isPerformanceMode,
    adaptiveThrottle,
    batchRender,
    config
  } = usePerformanceOptimization({
    enableVirtualization,
    maxItemsPerFrame: 20,
    throttleMs: 16
  })

  // Virtual grid for efficient rendering
  const {
    visibleItems,
    visibleRange,
    gridBounds,
    handleScroll,
    scrollToItem
  } = useVirtualGrid(
    enableVirtualization ? items : [],
    {
      containerWidth,
      containerHeight,
      cellSize,
      overscan: config.shouldReduceAnimations ? 1 : overscan,
      throttleMs: config.shouldReduceAnimations ? 32 : 16
    }
  )

  // Use all items if virtualization is disabled
  const itemsToRender = useMemo(() => {
    return enableVirtualization ? visibleItems : items
  }, [enableVirtualization, visibleItems, items])

  // Optimized item renderer with memoization
  const renderOptimizedItem = useCallback((item: GridItem, index: number) => {
    const isVisible = !enableVirtualization || visibleItems.includes(item)
    const isSelected = selectedItems.has(item.id)
    const isHovered = hoveredItem === item.id

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      
      if (enableSelection) {
        const newSelection = new Set(selectedItems)
        if (e.ctrlKey || e.metaKey) {
          if (newSelection.has(item.id)) {
            newSelection.delete(item.id)
          } else {
            newSelection.add(item.id)
          }
        } else {
          newSelection.clear()
          newSelection.add(item.id)
        }
        
        setSelectedItems(newSelection)
        onSelectionChange?.(Array.from(newSelection))
      }
    }

    const handleMouseEnter = adaptiveThrottle(() => {
      setHoveredItem(item.id)
    }, 50)

    const handleMouseLeave = adaptiveThrottle(() => {
      setHoveredItem(null)
    }, 50)

    const itemElement = (
      <div
        key={item.id}
        className={cn(
          "absolute cursor-pointer transition-all",
          isSelected && "ring-2 ring-primary ring-offset-1",
          isHovered && "z-10 shadow-lg",
          config.shouldReduceAnimations && "transition-none"
        )}
        style={{
          left: item.x,
          top: item.y,
          width: item.w,
          height: item.h,
          transform: `translateZ(0)`, // Force hardware acceleration
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-item-id={item.id}
      >
        {renderItem(item, index, isVisible)}
      </div>
    )

    // Wrap in lazy component for items outside initial view
    if (config.shouldLazyLoad && !isVisible) {
      return (
        <LazyComponent
          key={item.id}
          minHeight={item.h}
          placeholder={
            <div 
              className="absolute bg-muted/30 rounded animate-pulse"
              style={{
                left: item.x,
                top: item.y,
                width: item.w,
                height: item.h
              }}
            />
          }
        >
          {itemElement}
        </LazyComponent>
      )
    }

    // Use motion for animations only when performance allows
    if (enableAnimations && !config.shouldReduceAnimations) {
      return (
        <motion.div
          key={item.id}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            width: item.w,
            height: item.h,
          }}
          className={cn(
            "cursor-pointer",
            isSelected && "ring-2 ring-primary ring-offset-1",
            isHovered && "z-10 shadow-lg"
          )}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {renderItem(item, index, isVisible)}
        </motion.div>
      )
    }

    return itemElement
  }, [
    enableVirtualization,
    visibleItems,
    selectedItems,
    hoveredItem,
    enableSelection,
    onSelectionChange,
    adaptiveThrottle,
    config,
    enableAnimations,
    renderItem
  ])

  // Grid background pattern
  const renderGridBackground = useMemo(() => {
    if (gridStyle === 'none' || config.shouldReduceAnimations) return null

    const pattern = gridStyle === 'dots' 
      ? `radial-gradient(circle, rgba(var(--theme-primary), 0.1) 1px, transparent 1px)`
      : `linear-gradient(rgba(var(--theme-primary), 0.1) 1px, transparent 1px),
         linear-gradient(90deg, rgba(var(--theme-primary), 0.1) 1px, transparent 1px)`

    return (
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: pattern,
          backgroundSize: `${cellSize}px ${cellSize}px`,
          width: gridBounds.width,
          height: gridBounds.height,
        }}
      />
    )
  }, [gridStyle, cellSize, gridBounds, config.shouldReduceAnimations])

  // Performance overlay
  const renderPerformanceOverlay = () => {
    if (!showPerformanceOverlay) return null

    return (
      <div className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
        <div>FPS: {performanceMetrics.fps}</div>
        <div>Items: {itemsToRender.length}/{items.length}</div>
        <div>Render: {performanceMetrics.renderTime}ms</div>
        <div>Memory: {performanceMetrics.memoryUsage}%</div>
        {isPerformanceMode && <div className="text-yellow-400">PERF MODE</div>}
      </div>
    )
  }

  // Clear selection on background click
  const handleBackgroundClick = useCallback(() => {
    if (enableSelection && selectedItems.size > 0) {
      setSelectedItems(new Set())
      onSelectionChange?.([])
    }
  }, [enableSelection, selectedItems, onSelectionChange])

  // Batch render items for performance
  const renderedItems = useMemo(() => {
    if (config.shouldReduceAnimations) {
      // Render all items at once in performance mode
      return itemsToRender.map(renderOptimizedItem)
    }

    // Batch render items to prevent frame drops
    return itemsToRender.map((item, index) => {
      if (index < config.batchSize) {
        return renderOptimizedItem(item, index)
      }
      
      // Lazy render remaining items
      return (
        <LazyComponent 
          key={item.id}
          onVisible={() => batchRender(() => renderOptimizedItem(item, index))}
        >
          {renderOptimizedItem(item, index)}
        </LazyComponent>
      )
    })
  }, [itemsToRender, renderOptimizedItem, config, batchRender])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-auto border border-border rounded-lg",
        config.shouldReduceAnimations && "aries-performance-mode",
        className
      )}
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
      onScroll={enableVirtualization ? handleScroll : undefined}
      onClick={handleBackgroundClick}
    >
      {/* Grid container */}
      <div
        className="relative"
        style={{
          width: gridBounds.width,
          height: gridBounds.height,
          minWidth: containerWidth,
          minHeight: containerHeight,
        }}
      >
        {/* Grid background */}
        {renderGridBackground}

        {/* Items */}
        {enableAnimations && !config.shouldReduceAnimations ? (
          <AnimatePresence mode="popLayout">
            {renderedItems}
          </AnimatePresence>
        ) : (
          renderedItems
        )}

        {/* Performance overlay */}
        {renderPerformanceOverlay()}
      </div>
    </div>
  )
})

VirtualizedGrid.displayName = 'VirtualizedGrid'

export default VirtualizedGrid
