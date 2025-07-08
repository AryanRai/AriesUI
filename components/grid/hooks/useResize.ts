import { useState, useCallback } from "react"
import { ResizeState, ResizeHandle } from "../types"

export const useResize = () => {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizedId: null,
    resizedType: null,
    handle: null,
    startPos: { x: 0, y: 0 },
    startSize: { w: 0, h: 0 },
    startPosition: { x: 0, y: 0 },
  })

  // Handle resize mouse down
  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent,
    itemId: string,
    itemType: "widget" | "nest",
    handle: ResizeHandle,
    gridState: any,
  ) => {
    e.preventDefault()
    e.stopPropagation()

    let item: any = null
    if (itemType === "widget") {
      item = gridState.mainWidgets.find((w: any) => w.id === itemId) || gridState.nestedWidgets.find((w: any) => w.id === itemId)
    } else {
      item = gridState.nestContainers.find((n: any) => n.id === itemId)
    }

    if (!item) return

    setResizeState({
      isResizing: true,
      resizedId: itemId,
      resizedType: itemType,
      handle,
      startPos: { x: e.clientX, y: e.clientY },
      startSize: { w: item.w, h: item.h },
      startPosition: { x: item.x, y: item.y },
    })
  }, [])

  const resetResizeState = useCallback(() => {
    setResizeState({
      isResizing: false,
      resizedId: null,
      resizedType: null,
      handle: null,
      startPos: { x: 0, y: 0 },
      startSize: { w: 0, h: 0 },
      startPosition: { x: 0, y: 0 },
    })
  }, [])

  return {
    resizeState,
    setResizeState,
    handleResizeMouseDown,
    resetResizeState,
  }
}