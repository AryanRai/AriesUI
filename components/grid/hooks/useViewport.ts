import { useState, useCallback } from "react"
import { ViewportState } from "../types"

export const useViewport = () => {
  const [viewport, setViewport] = useState<ViewportState>({
    x: 0,
    y: 0,
    zoom: 1,
  })

  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })

  // Handle panning
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+Left click
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [])

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      setViewport((prev) => ({
        ...prev,
        zoom: Math.max(0.1, Math.min(3, prev.zoom * zoomFactor)),
      }))
    } else {
      // Scroll to pan
      setViewport((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }))
    }
  }, [])

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
  }
}