"use client"

import React, { memo, useState, useRef, useEffect, useCallback } from "react"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { useAppPerformance } from "@/components/app-performance-provider"
import { useThemeColors } from "@/hooks/use-theme-colors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GripVertical, X, Settings, Eye, EyeOff, Clock, MemoryStick } from "lucide-react"

interface PerformantWidgetProps {
  widget: any
  children: React.ReactNode
  onUpdate?: (updates: any) => void
  onRemove?: () => void
  onVisibilityChange?: (visible: boolean) => void
  className?: string
  priority?: "high" | "medium" | "low"
  lazy?: boolean
  virtualDistance?: number
}

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  LAZY_RENDER_DISTANCE: 1000,
  UPDATE_DEBOUNCE_TIME: 16,
  VISIBILITY_THRESHOLD: 0.1,
  MAX_CONCURRENT_RENDERS: 10
}

// Global render queue management
let renderQueue: Set<string> = new Set()
let frameId: number | null = null

const processRenderQueue = () => {
  if (renderQueue.size === 0) {
    frameId = null
    return
  }
  
  // Process limited number of renders per frame
  const batch = Array.from(renderQueue).slice(0, PERFORMANCE_THRESHOLDS.MAX_CONCURRENT_RENDERS)
  batch.forEach(id => {
    renderQueue.delete(id)
    // Trigger component updates
    const element = document.querySelector(`[data-widget-id="${id}"]`)
    if (element) {
      element.dispatchEvent(new CustomEvent('performantRender'))
    }
  })
  
  frameId = requestAnimationFrame(processRenderQueue)
}

const queueRender = (id: string) => {
  renderQueue.add(id)
  if (!frameId) {
    frameId = requestAnimationFrame(processRenderQueue)
  }
}

export const PerformantWidget = memo<PerformantWidgetProps>(({ 
  widget, 
  children, 
  onUpdate, 
  onRemove, 
  onVisibilityChange,
  className = "",
  priority = "medium",
  lazy = true,
  virtualDistance = PERFORMANCE_THRESHOLDS.LAZY_RENDER_DISTANCE
}) => {
  const { state: performanceState } = useAppPerformance()
  const { themeColors } = useThemeColors()
  
  const widgetRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(!lazy)
  const [isRendered, setIsRendered] = useState(!lazy)
  const [renderTime, setRenderTime] = useState(0)
  const [updateCount, setUpdateCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<number>(0)
  
  // Intersection observer for visibility detection
  const { isIntersecting } = useIntersectionObserver(widgetRef, {
    threshold: PERFORMANCE_THRESHOLDS.VISIBILITY_THRESHOLD,
    rootMargin: `${virtualDistance}px`
  })
  
  // Update visibility state
  useEffect(() => {
    const visible = !lazy || isIntersecting
    setIsVisible(visible)
    onVisibilityChange?.(visible)
    
    // Queue render if becoming visible
    if (visible && !isRendered) {
      queueRender(widget.id)
      setIsRendered(true)
    }
  }, [isIntersecting, lazy, widget.id, isRendered, onVisibilityChange])
  
  // Performance-aware update handler
  const handleUpdate = useCallback((updates: any) => {
    const now = performance.now()
    
    // Debounce updates based on performance mode
    const debounceTime = performanceState.settings.mode === "high" 
      ? PERFORMANCE_THRESHOLDS.UPDATE_DEBOUNCE_TIME / 2
      : PERFORMANCE_THRESHOLDS.UPDATE_DEBOUNCE_TIME
    
    if (now - lastUpdate < debounceTime) {
      return
    }
    
    setLastUpdate(now)
    setUpdateCount(prev => prev + 1)
    onUpdate?.(updates)
  }, [onUpdate, performanceState.settings.mode, lastUpdate])
  
  // Render time measurement
  useEffect(() => {
    if (!isRendered) return
    
    const startTime = performance.now()
    const measureRenderTime = () => {
      const endTime = performance.now()
      setRenderTime(endTime - startTime)
    }
    
    // Use RAF to measure render time
    requestAnimationFrame(measureRenderTime)
  }, [isRendered, children])
  
  // Performance event listener
  useEffect(() => {
    const element = widgetRef.current
    if (!element) return
    
    const handlePerformantRender = () => {
      setIsRendered(true)
    }
    
    element.addEventListener('performantRender', handlePerformantRender)
    return () => element.removeEventListener('performantRender', handlePerformantRender)
  }, [])
  
  // CSS classes based on performance settings
  const getPerformanceClasses = () => {
    const classes = ['aries-widget-card']
    
    if (performanceState.settings.mode === "high") {
      classes.push('aries-high-performance')
    }
    
    if (performanceState.settings.memoryOptimization) {
      classes.push('aries-memory-optimized')
    }
    
    if (performanceState.settings.gpuAcceleration) {
      classes.push('aries-gpu-accelerated')
    }
    
    if (lazy && !isVisible) {
      classes.push('aries-viewport-culled')
    } else {
      classes.push('aries-viewport-visible')
    }
    
    if (priority === "low") {
      classes.push('aries-lazy-render')
    }
    
    // Level of detail based on performance
    if (performanceState.metrics.fps > 50) {
      classes.push('aries-lod-high')
    } else if (performanceState.metrics.fps > 30) {
      classes.push('aries-lod-medium')
    } else {
      classes.push('aries-lod-low')
    }
    
    return classes.join(' ')
  }
  
  // Render placeholder if not visible/rendered
  if (lazy && (!isVisible || !isRendered)) {
    return (
      <div
        ref={widgetRef}
        data-widget-id={widget.id}
        data-component="widget"
        data-culled="true"
        className={`absolute bg-muted/10 border border-muted-foreground/10 rounded-md ${className}`}
        style={{
          left: widget.x,
          top: widget.y,
          width: widget.w,
          height: widget.h
        }}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          <div className="flex flex-col items-center gap-2">
            {isVisible ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span>Rendering...</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Not visible</span>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div
      ref={widgetRef}
      data-widget-id={widget.id}
      data-component="widget"
      data-priority={priority}
      data-render-time={renderTime}
      data-update-count={updateCount}
      className={`absolute group select-none ${getPerformanceClasses()} ${className}`}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.w,
        height: widget.h,
        willChange: 'transform',
        contain: 'layout style paint'
      }}
    >
      {/* Performance debug overlay (only in debug mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/80 text-white text-xs p-1 rounded-bl-md space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{renderTime.toFixed(1)}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <MemoryStick className="h-3 w-3" />
              <span>{updateCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{isVisible ? "V" : "H"}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Drag handle */}
      <div className="absolute top-0 left-0 right-0 h-8 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/20 backdrop-blur-sm rounded-t-md flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <GripVertical className="h-3 w-3 text-white" />
          <span className="text-xs text-white font-medium">{widget.title}</span>
          <Badge variant="secondary" className="text-xs font-mono">
            {widget.id.split("-").pop()}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {priority !== "medium" && (
            <Badge 
              variant={priority === "high" ? "destructive" : "outline"} 
              className="text-xs"
            >
              {priority}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-white hover:text-red-400"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Widget content */}
      <div className="w-full h-full overflow-hidden rounded-md">
        {children}
      </div>
      
      {/* Performance indicators */}
      {renderTime > 50 && (
        <div className="absolute bottom-1 right-1 z-10">
          <Badge variant="destructive" className="text-xs">
            Slow render
          </Badge>
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.widget.id === nextProps.widget.id &&
    prevProps.widget.x === nextProps.widget.x &&
    prevProps.widget.y === nextProps.widget.y &&
    prevProps.widget.w === nextProps.widget.w &&
    prevProps.widget.h === nextProps.widget.h &&
    prevProps.widget.updatedAt === nextProps.widget.updatedAt &&
    prevProps.priority === nextProps.priority &&
    prevProps.lazy === nextProps.lazy
  )
})

PerformantWidget.displayName = "PerformantWidget"

export default PerformantWidget
