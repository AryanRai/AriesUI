/**
 * useViewportControls Hook
 * 
 * Manages viewport state including zoom, pan, and viewport transformations.
 * Handles wheel events, pan operations, and smooth zoom animations.
 */

import { useState, useEffect, useCallback, useRef } from "react"

export interface ViewportState {
  x: number
  y: number
  zoom: number
}

export interface UseViewportControlsProps {
  initialViewport?: ViewportState
  containerRef?: React.RefObject<HTMLDivElement | null>
}

export interface UseViewportControlsReturn {
  viewport: ViewportState
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>
  isPanning: boolean
  setIsPanning: React.Dispatch<React.SetStateAction<boolean>>
  panStart: { x: number; y: number }
  setPanStart: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  lastPanPoint: { x: number; y: number }
  setLastPanPoint: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  handlePanStart: (e: React.MouseEvent) => void
  handleWheel: (e: WheelEvent) => void
  zoomVelocity: number
  setZoomVelocity: React.Dispatch<React.SetStateAction<number>>
  resetViewport: () => void
}

const DEFAULT_VIEWPORT: ViewportState = {
  x: 0,
  y: 0,
  zoom: 1,
}

export const useViewportControls = ({
  initialViewport = DEFAULT_VIEWPORT,
  containerRef,
}: UseViewportControlsProps = {}): UseViewportControlsReturn => {
  // Viewport state for infinite scrolling
  const [viewport, setViewport] = useState<ViewportState>(initialViewport)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })

  // Enhanced wheel handling for smooth zooming like Miro
  const [zoomVelocity, setZoomVelocity] = useState(0)
  const [lastWheelTime, setLastWheelTime] = useState(0)
  const zoomAnimationRef = useRef<number | null>(null)

  /**
   * Handle panning start with middle mouse or Ctrl+click
   */
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [])

  /**
   * Reset viewport to default state
   */
  const resetViewport = useCallback(() => {
    setViewport(DEFAULT_VIEWPORT)
  }, [])

  // Smooth zoom animation with momentum
  useEffect(() => {
    if (Math.abs(zoomVelocity) > 0.001) {
      const animate = () => {
        setZoomVelocity(prev => {
          const newVelocity = prev * 0.85 // Friction/damping
          
          if (Math.abs(newVelocity) > 0.001) {
            setViewport(current => ({
              ...current,
              zoom: Math.max(0.05, Math.min(10, current.zoom * (1 + newVelocity)))
            }))
            zoomAnimationRef.current = requestAnimationFrame(animate)
            return newVelocity
          } else {
            zoomAnimationRef.current = null
            return 0
          }
        })
      }
      
      zoomAnimationRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current)
      }
    }
  }, [zoomVelocity])

  /**
   * Handle wheel events for zoom and pan
   */
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      
      const currentTime = Date.now()
      const timeDelta = currentTime - lastWheelTime
      setLastWheelTime(currentTime)

      // Enhanced trackpad vs mouse wheel detection
      const isTrackpad = Math.abs(e.deltaY) < 50 && timeDelta < 100
      const isPinch = e.ctrlKey && Math.abs(e.deltaY) < 5
      
      // Get mouse position for zoom-to-cursor
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const mouseX = e.clientX - containerRect.left
      const mouseY = e.clientY - containerRect.top

      let zoomDelta: number
      
      if (isPinch) {
        // Pinch gesture - very fine control
        zoomDelta = -e.deltaY * 0.005 // Reduced from 0.01 for stability
      } else if (isTrackpad) {
        // Trackpad - smooth, continuous zooming with improved stability
        zoomDelta = -e.deltaY * 0.002 // Further reduced from 0.003 for smoothness
      } else {
        // Mouse wheel - discrete steps
        zoomDelta = e.deltaY > 0 ? -0.08 : 0.08 // Slightly reduced from 0.1
      }
      
      setViewport((prev) => {
        const newZoom = Math.max(0.05, Math.min(10, prev.zoom * (1 + zoomDelta)))
        
        // CORRECT zoom-to-cursor calculation:
        // 1. Convert mouse position to world coordinates BEFORE zoom
        const worldPointX = (mouseX / prev.zoom) - prev.x
        const worldPointY = (mouseY / prev.zoom) - prev.y
        
        // 2. Calculate new viewport position so the same world point appears under cursor AFTER zoom
        const newX = (mouseX / newZoom) - worldPointX
        const newY = (mouseY / newZoom) - worldPointY
        
        return {
          x: newX,
          y: newY,
          zoom: newZoom
        }
      })
    } else {
      // Enhanced smooth panning
      const panSpeed = 1.0 // Reduced from 1.2 for smoother trackpad panning
      const deltaX = e.deltaX * panSpeed
      const deltaY = e.deltaY * panSpeed
      
      setViewport((prev) => ({
        ...prev,
        x: prev.x - deltaX / prev.zoom,
        y: prev.y - deltaY / prev.zoom,
      }))
    }
  }, [lastWheelTime, containerRef])

  return {
    viewport,
    setViewport,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    lastPanPoint,
    setLastPanPoint,
    handlePanStart,
    handleWheel,
    zoomVelocity,
    setZoomVelocity,
    resetViewport,
  }
}