import { useState, useCallback, useRef, useEffect } from 'react'

interface ViewportState {
  x: number
  y: number
  zoom: number
}

interface ViewportManager {
  viewport: ViewportState
  setViewport: (viewport: ViewportState) => void
  handleWheel: (e: WheelEvent) => void
  handlePanStart: (e: React.MouseEvent) => void
  isPanning: boolean
}

export function useViewportManager(initialViewport: ViewportState = { x: 0, y: 0, zoom: 1 }): ViewportManager {
  const [viewport, setViewport] = useState<ViewportState>(initialViewport)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const rafRef = useRef<number>()

  // Smooth viewport updates with hardware acceleration
  const updateViewportSmooth = useCallback((newViewport: ViewportState) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = requestAnimationFrame(() => {
      setViewport(newViewport)
    })
  }, [])

  // Optimized wheel handler for smooth zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    if (e.ctrlKey) {
      // Zoom with smooth scaling
      let zoomDelta: number
      if (Math.abs(e.deltaY) < 50) {
        // Trackpad - smaller, more granular steps
        zoomDelta = e.deltaY > 0 ? 0.98 : 1.02
      } else {
        // Mouse wheel - larger steps
        zoomDelta = e.deltaY > 0 ? 0.9 : 1.1
      }
      
      updateViewportSmooth({
        ...viewport,
        zoom: Math.max(0.1, Math.min(3, viewport.zoom * zoomDelta))
      })
    } else {
      // Pan with momentum
      updateViewportSmooth({
        ...viewport,
        x: viewport.x - e.deltaX * 0.5,
        y: viewport.y - e.deltaY * 0.5
      })
    }
  }, [viewport, updateViewportSmooth])

  // Pan start handler
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [])

  // Mouse move handler for panning
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return

      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      updateViewportSmooth({
        ...viewport,
        x: viewport.x + deltaX / viewport.zoom,
        y: viewport.y + deltaY / viewport.zoom
      })
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp, { passive: true })
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning, lastPanPoint, viewport, updateViewportSmooth])

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return {
    viewport,
    setViewport: updateViewportSmooth,
    handleWheel,
    handlePanStart,
    isPanning
  }
} 