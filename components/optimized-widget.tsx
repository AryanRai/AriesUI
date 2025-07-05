"use client"

import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, GripVertical, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LazyComponent } from './lazy-component'
import { usePerformanceOptimization } from '@/hooks/use-performance-optimization'

interface WidgetProps {
  id: string
  type: string
  title: string
  content: React.ReactNode | string
  x: number
  y: number
  w: number
  h: number
  isSelected?: boolean
  isHovered?: boolean
  isDragging?: boolean
  isResizing?: boolean
  isVisible?: boolean
  onRemove?: (id: string) => void
  onDragStart?: (id: string, event: React.MouseEvent) => void
  onResizeStart?: (id: string, handle: string, event: React.MouseEvent) => void
  enableAnimations?: boolean
  enableLazyLoading?: boolean
  className?: string
}

/**
 * Optimized widget component with performance optimizations
 */
const OptimizedWidget = memo<WidgetProps>(({
  id,
  type,
  title,
  content,
  x,
  y,
  w,
  h,
  isSelected = false,
  isHovered = false,
  isDragging = false,
  isResizing = false,
  isVisible = true,
  onRemove,
  onDragStart,
  onResizeStart,
  enableAnimations = true,
  enableLazyLoading = true,
  className
}) => {
  const [isContentLoaded, setIsContentLoaded] = useState(!enableLazyLoading)
  const widgetRef = useRef<HTMLDivElement>(null)
  
  const {
    isPerformanceMode,
    adaptiveThrottle,
    config
  } = usePerformanceOptimization()

  // Memoized styles for better performance
  const widgetStyles = useMemo(() => ({
    position: 'absolute' as const,
    left: x,
    top: y,
    width: w,
    height: h,
    transform: 'translateZ(0)', // Force hardware acceleration
    willChange: isDragging || isResizing ? 'transform' : 'auto'
  }), [x, y, w, h, isDragging, isResizing])

  // Memoized class names
  const widgetClasses = useMemo(() => cn(
    "group bg-card/80 backdrop-blur border-border/50 transition-all duration-200 select-none",
    "hover:border-border hover:shadow-md",
    isSelected && "ring-2 ring-primary ring-offset-1",
    isDragging && "shadow-lg scale-105 z-10 rotate-1",
    isResizing && "shadow-lg z-10",
    isHovered && !isDragging && !isResizing && "shadow-md scale-102",
    config.shouldReduceAnimations && "transition-none transform-none",
    className
  ), [isSelected, isDragging, isResizing, isHovered, config.shouldReduceAnimations, className])

  // Throttled event handlers
  const handleDragStart = useCallback(
    adaptiveThrottle((e: React.MouseEvent) => {
      e.preventDefault()
      onDragStart?.(id, e)
    }, 16),
    [id, onDragStart, adaptiveThrottle]
  )

  const handleRemove = useCallback(
    adaptiveThrottle((e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove?.(id)
    }, 200),
    [id, onRemove, adaptiveThrottle]
  )

  // Resize handles
  const renderResizeHandles = useMemo(() => {
    if (!isVisible || isPerformanceMode) return null

    const handles = [
      { handle: "nw", className: "top-0 left-0 -translate-x-1/2 -translate-y-1/2", cursor: "nw-resize" },
      { handle: "n", className: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "n-resize" },
      { handle: "ne", className: "top-0 right-0 translate-x-1/2 -translate-y-1/2", cursor: "ne-resize" },
      { handle: "e", className: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2", cursor: "e-resize" },
      { handle: "se", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2", cursor: "se-resize" },
      { handle: "s", className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", cursor: "s-resize" },
      { handle: "sw", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", cursor: "sw-resize" },
      { handle: "w", className: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2", cursor: "w-resize" },
    ]

    return handles.map(({ handle, className, cursor }) => (
      <div
        key={handle}
        className={cn(
          "resize-handle absolute w-3 h-3 bg-primary border border-primary-foreground rounded-sm",
          "opacity-0 group-hover:opacity-100 transition-opacity z-20",
          className
        )}
        style={{ cursor }}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onResizeStart?.(id, handle, e)
        }}
      />
    ))
  }, [id, onResizeStart, isVisible, isPerformanceMode])

  // Widget header
  const renderHeader = useMemo(() => (
    <CardHeader className="p-2 cursor-move" onMouseDown={handleDragStart}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <CardTitle className="text-xs truncate">{title}</CardTitle>
          <Badge variant="outline" className="text-xs px-1 py-0 flex-shrink-0">
            {type}
          </Badge>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardHeader>
  ), [title, type, handleDragStart, handleRemove])

  // Widget content with lazy loading
  const renderContent = useCallback(() => {
    if (!isContentLoaded && enableLazyLoading) {
      return (
        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
          Loading...
        </div>
      )
    }

    if (typeof content === 'string') {
      return (
        <div className="text-xs text-center p-2">
          {content}
        </div>
      )
    }

    return content
  }, [content, isContentLoaded, enableLazyLoading])

  // Lazy load content when widget becomes visible
  useEffect(() => {
    if (isVisible && enableLazyLoading && !isContentLoaded) {
      const timer = setTimeout(() => setIsContentLoaded(true), 100)
      return () => clearTimeout(timer)
    }
  }, [isVisible, enableLazyLoading, isContentLoaded])

  const widgetElement = (
    <Card
      ref={widgetRef}
      className={widgetClasses}
      style={widgetStyles}
      data-widget-id={id}
      data-widget-type={type}
    >
      {renderHeader}
      <CardContent className="p-2 pt-0 text-xs text-center overflow-hidden">
        {renderContent()}
      </CardContent>
      {renderResizeHandles}
    </Card>
  )

  // Wrap with lazy component if needed
  if (enableLazyLoading && !isVisible) {
    return (
      <LazyComponent
        minHeight={h}
        onVisible={() => setIsContentLoaded(true)}
        placeholder={
          <div 
            className="absolute bg-muted/30 rounded animate-pulse"
            style={widgetStyles}
          />
        }
      >
        {widgetElement}
      </LazyComponent>
    )
  }

  // Wrap with motion if animations are enabled
  if (enableAnimations && !config.shouldReduceAnimations) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
        }}
      >
        {widgetElement}
      </motion.div>
    )
  }

  return widgetElement
})

OptimizedWidget.displayName = 'OptimizedWidget'

export default OptimizedWidget

// Higher-order component for additional optimizations
export const withPerformanceOptimizations = <P extends WidgetProps>(
  Component: React.ComponentType<P>
) => {
  const OptimizedComponent = memo((props: P) => {
    const { config } = usePerformanceOptimization()
    
    return (
      <Component
        {...props}
        enableAnimations={props.enableAnimations && !config.shouldReduceAnimations}
        enableLazyLoading={props.enableLazyLoading && config.shouldLazyLoad}
      />
    )
  })

  OptimizedComponent.displayName = `withPerformanceOptimizations(${Component.displayName || Component.name})`
  
  return OptimizedComponent
}
