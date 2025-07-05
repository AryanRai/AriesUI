"use client"

import React, { useEffect, useRef, useCallback, memo } from 'react'
import { StreamConfigurator } from './stream-configurator'
import { EnhancedWidgetBase } from './enhanced-widget-base'

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
      className={`absolute select-none ${className} ${
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