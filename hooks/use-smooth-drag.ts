import { useState, useRef, useCallback, useEffect } from 'react'

interface Position {
  x: number
  y: number
}

interface DragState {
  isDragging: boolean
  draggedId: string | null
  draggedType: "widget" | "nest" | null
  startPos: Position
  currentPos: Position
  offset: Position
}

interface SmoothDragOptions {
  onDragStart?: (id: string, type: "widget" | "nest") => void
  onDragMove?: (id: string, position: Position) => void
  onDragEnd?: (id: string, position: Position) => void
  gridSize?: number
  enableSmoothing?: boolean
}

export function useSmoothDrag(options: SmoothDragOptions = {}) {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    gridSize = 20,
    enableSmoothing = true
  } = options
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    draggedType: null,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 }
  })

  const rafRef = useRef<number>()
  const lastUpdateTime = useRef<number>(0)
  const smoothPosition = useRef<Position>({ x: 0, y: 0 })
  const targetPosition = useRef<Position>({ x: 0, y: 0 })

  // Smooth interpolation for ultra-fluid dragging
  const updateSmoothPosition = useCallback(function updateSmoothPositionCallback() {
    if (!dragState.isDragging) return

    const now = performance.now()
    const deltaTime = now - lastUpdateTime.current
    lastUpdateTime.current = now

    // Lerp factor for smooth following (higher = more responsive)
    const lerpFactor = Math.min(deltaTime / 8, 1) // 8ms target = 120fps smoothness

    // Interpolate to target position
    smoothPosition.current.x += (targetPosition.current.x - smoothPosition.current.x) * lerpFactor
    smoothPosition.current.y += (targetPosition.current.y - smoothPosition.current.y) * lerpFactor

    // Update drag position
    if (dragState.draggedId && onDragMove) {
      onDragMove(dragState.draggedId, smoothPosition.current)
    }

    // Continue animation
    rafRef.current = requestAnimationFrame(updateSmoothPositionCallback)
  }, [dragState.isDragging, dragState.draggedId, onDragMove])

  const startDrag = useCallback((
    e: React.MouseEvent,
    id: string,
    type: "widget" | "nest",
    elementRect: DOMRect,
    containerRect: DOMRect
  ) => {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX - containerRect.left
    const startY = e.clientY - containerRect.top
    const offsetX = startX - elementRect.left
    const offsetY = startY - elementRect.top

    const newDragState = {
      isDragging: true,
      draggedId: id,
      draggedType: type,
      startPos: { x: startX, y: startY },
      currentPos: { x: startX, y: startY },
      offset: { x: offsetX, y: offsetY }
    }

    setDragState(newDragState)
    
    // Initialize smooth position
    smoothPosition.current = { x: startX - offsetX, y: startY - offsetY }
    targetPosition.current = { x: startX - offsetX, y: startY - offsetY }
    
    // Start smooth animation
    lastUpdateTime.current = performance.now()
    rafRef.current = requestAnimationFrame(updateSmoothPosition)

    onDragStart?.(id, type)
  }, [onDragStart, updateSmoothPosition])

  const updateDrag = useCallback((e: MouseEvent, containerRect: DOMRect) => {
    if (!dragState.isDragging) return

    const currentX = e.clientX - containerRect.left
    const currentY = e.clientY - containerRect.top
    
    // Update target position (what we're smoothly moving towards)
    targetPosition.current = {
      x: currentX - dragState.offset.x,
      y: currentY - dragState.offset.y
    }

    // Update drag state
    setDragState(prev => ({
      ...prev,
      currentPos: { x: currentX, y: currentY }
    }))
  }, [dragState.isDragging, dragState.offset])

  const endDrag = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedId) return

    // Cancel animation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    // Snap to grid
    const snappedX = Math.round(smoothPosition.current.x / gridSize) * gridSize
    const snappedY = Math.round(smoothPosition.current.y / gridSize) * gridSize

    onDragEnd?.(dragState.draggedId, { x: snappedX, y: snappedY })

    setDragState({
      isDragging: false,
      draggedId: null,
      draggedType: null,
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 },
      offset: { x: 0, y: 0 }
    })
  }, [dragState.isDragging, dragState.draggedId, gridSize, onDragEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    smoothPosition: smoothPosition.current
  }
} 