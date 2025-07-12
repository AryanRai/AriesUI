import { useCallback, useRef } from 'react'

interface DragHandlers {
  onDragStart: (id: string, type: "widget" | "nest") => void
  onDragMove: (id: string, x: number, y: number) => void
  onDragEnd: (id: string, x: number, y: number) => void
}

export function usePerformanceDrag(handlers: DragHandlers) {
  const rafRef = useRef<number>()
  const isDragging = useRef(false)
  const dragData = useRef<{
    id: string
    type: "widget" | "nest"
    startX: number
    startY: number
    offsetX: number
    offsetY: number
  }>()

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !dragData.current) return
    
    // Cancel previous frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    
    // Schedule update for next frame
    rafRef.current = requestAnimationFrame(() => {
      if (!dragData.current) return
      
      const x = e.clientX - dragData.current.offsetX
      const y = e.clientY - dragData.current.offsetY
      
      handlers.onDragMove(dragData.current.id, x, y)
    })
  }, [handlers.onDragMove])

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !dragData.current) return
    
    // Cancel any pending frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    
    handlers.onDragEnd(dragData.current.id, 0, 0) // Position will be calculated in component
    
    isDragging.current = false
    dragData.current = undefined
    
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handlers.onDragEnd, handleMouseMove])

  const startDrag = useCallback((
    e: React.MouseEvent,
    id: string,
    type: "widget" | "nest"
  ) => {
    e.preventDefault()
    e.stopPropagation()
    
    isDragging.current = true
    dragData.current = {
      id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: 0, // Will be set by component
      offsetY: 0
    }
    
    handlers.onDragStart(id, type)
    
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseup', handleMouseUp, { passive: true })
  }, [handlers.onDragStart, handleMouseMove, handleMouseUp])

  return { startDrag }
} 