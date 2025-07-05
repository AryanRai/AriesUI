"use client"

import React, { useEffect, useRef, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { X, Settings, Hash, GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface HardwareAcceleratedWidgetProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  isDragging?: boolean
  isResizing?: boolean
  isPushed?: boolean
  zIndex?: number
  children: React.ReactNode
  onMouseDown?: (e: React.MouseEvent, id: string, type: "widget" | "nest") => void
  onRemove?: (id: string) => void
  getResizeHandles?: (itemId: string, itemType: "widget" | "nest") => React.ReactNode
  className?: string
}

// Memoized component to prevent unnecessary re-renders
export const HardwareAcceleratedWidget = memo<HardwareAcceleratedWidgetProps>(function HardwareAcceleratedWidget({
  id,
  x,
  y,
  width,
  height,
  isDragging = false,
  isResizing = false,
  isPushed = false,
  zIndex = 1,
  children,
  onMouseDown,
  onRemove,
  getResizeHandles,
  className = ""
}: HardwareAcceleratedWidgetProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<string>('')
  const rafRef = useRef<number | undefined>()

  // Hardware-accelerated position and size updates with consistent coordinate system
  const updateTransform = useCallback((newX: number, newY: number, newW: number, newH: number, immediate = false) => {
    const element = elementRef.current
    if (!element) return

    const transform = `translate3d(${newX}px, ${newY}px, 0)`
    
    const updateProps = () => {
      // Use consistent positioning system - always use transform for position
      element.style.transform = transform
      element.style.width = `${newW}px`
      element.style.height = `${newH}px`
      transformRef.current = transform
      
      // During resize, ensure handles stay aligned by forcing immediate layout
      if (isResizing) {
        element.style.left = '0px'
        element.style.top = '0px'
        // Force layout recalculation to prevent handle detachment
        void element.offsetHeight
      }
    }
    
    if (immediate || isResizing) {
      // Immediate updates during resize to prevent detachment
      updateProps()
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      
      rafRef.current = requestAnimationFrame(updateProps)
    }
  }, [isResizing])

  // Update position and size when props change with enhanced resize handling
  useEffect(() => {
    updateTransform(x, y, width, height, isResizing)
  }, [x, y, width, height, isDragging, isResizing, updateTransform])

  // Apply hardware acceleration and performance optimizations
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Enable hardware acceleration with proper will-change
    element.style.willChange = isDragging || isResizing ? 'transform, width, height' : 'auto'
    element.style.backfaceVisibility = 'hidden'
    element.style.perspective = '1000px'
    
    // Force GPU layer creation
    element.style.transformStyle = 'preserve-3d'
    
    // Enhanced resize handling to prevent handle detachment
    if (isResizing) {
      element.style.zIndex = '1001' // Higher than dragging
      element.style.pointerEvents = 'auto' // Ensure resize handles remain interactive
      element.style.contain = 'none' // Disable containment during resize
      element.style.isolation = 'isolate' // Create proper stacking context
      
      // Force consistent positioning during resize
      element.style.position = 'absolute'
      element.style.left = '0px'
      element.style.top = '0px'
    } else {
      // Reset containment after resize
      element.style.contain = 'layout style paint'
    }
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isDragging, isResizing])

  // Handle mouse down with hardware acceleration
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't handle mouse down if we're clicking on interactive elements
    const target = e.target as HTMLElement
    
    // Check for resize handles
    if (target.closest('.resize-handle')) {
      return
    }
    
    // Enhanced button detection - check for button elements, their children, and specific classes
    if (target.closest('button') || 
        target.tagName === 'BUTTON' ||
        target.closest('[role="button"]') ||
        target.closest('.settings-button') ||
        target.closest('[data-settings-button]') ||
        target.closest('[role="dialog"]') || 
        target.closest('.dialog-content')) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    // Check for any interactive elements that should not trigger drag
    if (target.closest('input') || 
        target.closest('select') || 
        target.closest('textarea') ||
        target.closest('[contenteditable]') ||
        target.closest('a[href]')) {
      return
    }
    
    // Check if the click is on a settings icon or similar interactive element
    if (target.closest('[data-lucide]') && target.closest('button')) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    
    if (onMouseDown) {
      // Apply immediate hardware acceleration
      const element = elementRef.current
      if (element) {
        element.style.willChange = 'transform'
        element.style.zIndex = '1000'
      }
      
      onMouseDown(e, id, "widget")
    }
  }, [onMouseDown, id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div
      ref={elementRef}
      data-widget-id={id}
      className={`absolute select-none group ${className} ${
        isDragging ? 'cursor-grabbing opacity-90' : 'cursor-grab'
      } ${
        isPushed ? 'transition-all duration-200 ease-out' : ''
      } ${
        isResizing ? 'resize-active' : ''
      }`}
      style={{
        left: 0, // Position handled by transform
        top: 0,  // Position handled by transform
        width: `${width}px`,
        height: `${height}px`,
        zIndex: isResizing ? 1001 : isDragging ? 1000 : zIndex,
        contain: isResizing ? 'none' : 'layout style paint', // Disable containment during resize
        isolation: 'isolate', // Create stacking context
        transform: `translate3d(${x}px, ${y}px, 0)`, // Initial transform
        position: 'absolute', // Ensure consistent positioning
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Widget Controls - Always visible on hover */}
      <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 bg-background/80 hover:bg-background/90 backdrop-blur-sm"
          onClick={() => onRemove?.(id)}
          title="Remove Widget"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Widget ID Badge */}
      <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Badge variant="secondary" className="text-xs h-5 px-1">
          <Hash className="h-3 w-3 mr-1" />
          {id.split('-')[0]}
        </Badge>
      </div>

      {/* Resize Handles - Enhanced positioning to prevent detachment */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="relative w-full h-full pointer-events-auto"
          style={{
            // Ensure handles stay aligned during resize
            transform: 'translateZ(0)',
            position: 'relative',
            zIndex: isResizing ? 10 : 1,
          }}
        >
          {getResizeHandles && getResizeHandles(id, "widget")}
        </div>
      </div>
      
      {/* Hardware-accelerated content container */}
      <div 
        className="w-full h-full relative z-0"
        style={{
          transform: 'translateZ(0)', // Force hardware layer
          willChange: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  )
})

HardwareAcceleratedWidget.displayName = 'HardwareAcceleratedWidget' 