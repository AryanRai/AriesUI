import { useState, useCallback } from "react"
import { DragState, GridState, DropState } from "../types"

export const useDragAndDrop = () => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    draggedType: null,
    sourceContainer: null,
    offset: { x: 0, y: 0 },
  })

  const [dropState, setDropState] = useState<DropState>({
    isDragOver: false,
    targetNestId: null,
  })

  const [dragOverNest, setDragOverNest] = useState<string | null>(null)

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, itemId: string, itemType: "widget" | "nest", gridState: GridState) => {
    const target = e.target as HTMLElement
    if (target.closest(".resize-handle")) return

    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()

    // Determine source container
    let sourceContainer: "main" | "nest" = "main"
    let sourceNestId: string | undefined

    if (itemType === "widget") {
      const nestedWidget = gridState.nestedWidgets.find((w) => w.id === itemId)
      if (nestedWidget) {
        sourceContainer = "nest"
        sourceNestId = nestedWidget.nestId
      }
    }

    setDragState({
      isDragging: true,
      draggedId: itemId,
      draggedType: itemType,
      sourceContainer,
      sourceNestId,
      offset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    })
  }, [])

  // Handle drag over for drop zones
  const handleDragOver = useCallback((e: React.DragEvent, targetNestId?: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setDropState({ isDragOver: true, targetNestId: targetNestId || null })
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropState({ isDragOver: false, targetNestId: null })
    }
  }, [])

  const resetDragState = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedId: null,
      draggedType: null,
      sourceContainer: null,
      offset: { x: 0, y: 0 },
    })
    setDragOverNest(null)
  }, [])

  return {
    dragState,
    setDragState,
    dropState,
    setDropState,
    dragOverNest,
    setDragOverNest,
    handleMouseDown,
    handleDragOver,
    handleDragLeave,
    resetDragState,
  }
}