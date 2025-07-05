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
export const HardwareAcceleratedWidget = memo(function HardwareAcceleratedWidget({
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
  const rafRef = useRef<number>()

  // Hardware-accelerated position updates
  const updatePosition = useCallback((newX: number, newY: number, immediate = false) => {
    const element = elementRef.current
    if (!element) return

    const transform = `translate3d(${newX}px, ${newY}px, 0)`
    
    if (immediate) {
      element.style.transform = transform
      transformRef.current = transform
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      
      rafRef.current = requestAnimationFrame(() => {
        element.style.transform = transform
        transformRef.current = transform
      })
    }
  }, [])

  // Update position when props change
  useEffect(() => {
    updatePosition(x, y, !isDragging)
  }, [x, y, isDragging, updatePosition])

  // Apply hardware acceleration and performance optimizations
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Enable hardware acceleration
    element.style.willChange = isDragging || isResizing ? 'transform, width, height' : 'auto'
    element.style.transform = `translate3d(${x}px, ${y}px, 0)`
    element.style.backfaceVisibility = 'hidden'
    element.style.perspective = '1000px'
    
    // Force GPU layer creation
    element.style.transformStyle = 'preserve-3d'
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isDragging, isResizing, x, y])

  // Handle mouse down with hardware acceleration
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
      }`}
      style={{
        left: 0, // Position handled by transform
        top: 0,  // Position handled by transform
        width: `${width}px`,
        height: `${height}px`,
        zIndex: isDragging ? 1000 : zIndex,
        contain: 'layout style paint', // CSS containment for performance
        isolation: 'isolate', // Create stacking context
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

      {/* Resize Handles */}
      {getResizeHandles && getResizeHandles(id, "widget")}
      
      {/* Hardware-accelerated content container */}
      <div 
        className="w-full h-full"
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