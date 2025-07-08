import { useEffect, useCallback, useRef } from "react"
import { useComms } from "@/components/comms-context"
import { 
  GridState, 
  DragState, 
  ResizeState, 
  ViewportState, 
  MainGridWidget, 
  NestedWidget, 
  NestContainer,
  ResizeHandle 
} from "../types"
import { 
  applyPushPhysics, 
  getDefaultContent, 
  generateUniqueId 
} from "../utils"

interface UseMouseEventsProps {
  gridState: GridState
  updateGridState: (updater: (prev: GridState) => GridState) => void
  dragState: DragState
  setDragState: (state: DragState) => void
  resizeState: ResizeState
  setResizeState: (state: ResizeState) => void
  viewport: ViewportState
  setViewport: (state: ViewportState) => void
  isPanning: boolean
  setIsPanning: (panning: boolean) => void
  lastPanPoint: { x: number; y: number }
  setLastPanPoint: (point: { x: number; y: number }) => void
  setDragOverNest: (nestId: string | null) => void
  containerRef: React.RefObject<HTMLDivElement>
  resetDragState: () => void
  resetResizeState: () => void
}

export const useMouseEvents = ({
  gridState,
  updateGridState,
  dragState,
  setDragState,
  resizeState,
  setResizeState,
  viewport,
  setViewport,
  isPanning,
  setIsPanning,
  lastPanPoint,
  setLastPanPoint,
  setDragOverNest,
  containerRef,
  resetDragState,
  resetResizeState,
}: UseMouseEventsProps) => {
  const { dispatch } = useComms()

  // Handle drop from widget palette
  const handleDrop = useCallback((e: React.DragEvent, targetNestId?: string) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const templateData = e.dataTransfer.getData("application/json")
      if (!templateData) return

      const template = JSON.parse(templateData)
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const gridSize = gridState.gridSize
      let dropX: number, dropY: number

      // Convert screen coordinates to world coordinates
      const worldX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
      const worldY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y

      if (targetNestId) {
        // Dropping into nest
        const nest = gridState.nestContainers.find((n) => n.id === targetNestId)
        if (!nest) return

        const rawX = Math.max(10, worldX - nest.x - template.defaultSize.w / 2)
        const rawY = Math.max(10, worldY - nest.y - 40 - template.defaultSize.h / 2)

        dropX = Math.round(rawX / gridSize) * gridSize
        dropY = Math.round(rawY / gridSize) * gridSize

        const newWidget: NestedWidget = {
          id: generateUniqueId("widget"),
          type: template.type,
          title: template.title,
          content: getDefaultContent(template.type),
          x: dropX,
          y: dropY,
          w: template.defaultSize.w,
          h: template.defaultSize.h,
          container: "nest",
          nestId: targetNestId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Apply push physics to existing widgets in the nest
        const existingNestWidgets = gridState.nestedWidgets.filter((w) => w.nestId === targetNestId)
        const containerBounds = { x: 0, y: 0, w: nest.w, h: nest.h - 40 }
        const pushedWidgets = applyPushPhysics(newWidget, existingNestWidgets, gridSize, containerBounds)

        updateGridState((prev) => ({
          ...prev,
          nestedWidgets: [
            ...prev.nestedWidgets.map((widget) => {
              if (widget.nestId !== targetNestId) return widget
              const pushedWidget = pushedWidgets.find((p) => p.id === widget.id)
              if (pushedWidget && pushedWidget.pushed) {
                return { ...widget, x: pushedWidget.x, y: pushedWidget.y, updatedAt: new Date().toISOString() }
              }
              return widget
            }),
            newWidget,
          ],
        }))
        dispatch({ type: "ADD_LOG", payload: `Widget ${newWidget.id} dropped into nest ${targetNestId}` })
      } else {
        // Dropping into main grid
        const rawX = Math.max(0, worldX - template.defaultSize.w / 2)
        const rawY = Math.max(0, worldY - template.defaultSize.h / 2)

        dropX = Math.round(rawX / gridSize) * gridSize
        dropY = Math.round(rawY / gridSize) * gridSize

        const newWidget: MainGridWidget = {
          id: generateUniqueId("widget"),
          type: template.type,
          title: template.title,
          content: getDefaultContent(template.type),
          x: dropX,
          y: dropY,
          w: template.defaultSize.w,
          h: template.defaultSize.h,
          container: "main",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Apply push physics to existing main widgets and nests
        const existingMainWidgets = gridState.mainWidgets
        const existingNests = gridState.nestContainers
        const pushedMainWidgets = applyPushPhysics(newWidget, existingMainWidgets, gridSize)
        const pushedNests = applyPushPhysics(newWidget, existingNests, gridSize)

        updateGridState((prev) => ({
          ...prev,
          mainWidgets: [
            ...prev.mainWidgets.map((widget) => {
              const pushedWidget = pushedMainWidgets.find((p) => p.id === widget.id)
              if (pushedWidget && pushedWidget.pushed) {
                return { ...widget, x: pushedWidget.x, y: pushedWidget.y, updatedAt: new Date().toISOString() }
              }
              return widget
            }),
            newWidget,
          ],
          nestContainers: prev.nestContainers.map((nest) => {
            const pushedNest = pushedNests.find((p) => p.id === nest.id)
            if (pushedNest && pushedNest.pushed) {
              return { ...nest, x: pushedNest.x, y: pushedNest.y, updatedAt: new Date().toISOString() }
            }
            return nest
          }),
        }))
        dispatch({ type: "ADD_LOG", payload: `Widget ${newWidget.id} dropped on main grid` })
      }
    } catch (error) {
      console.error("Failed to parse dropped widget data:", error)
    }
  }, [gridState, viewport, containerRef, updateGridState, dispatch])

  // Mouse move and mouse up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const gridSize = gridState.gridSize

      // Handle panning
      if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x
        const deltaY = e.clientY - lastPanPoint.y
        setViewport({
          ...viewport,
          x: viewport.x + deltaX / viewport.zoom,
          y: viewport.y + deltaY / viewport.zoom,
        })
        setLastPanPoint({ x: e.clientX, y: e.clientY })
        return
      }

      // Convert screen coordinates to world coordinates
      const worldX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
      const worldY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y

      // Handle dragging with push physics
      if (dragState.isDragging && dragState.draggedId) {
        const rawX = Math.max(0, worldX - dragState.offset.x / viewport.zoom)
        const rawY = Math.max(0, worldY - dragState.offset.y / viewport.zoom)
        const newX = Math.round(rawX / gridSize) * gridSize
        const newY = Math.round(rawY / gridSize) * gridSize

        // Get the dragged widget for push physics
        let draggedWidget: any = null

        if (dragState.draggedType === "widget") {
          if (dragState.sourceContainer === "main") {
            draggedWidget = gridState.mainWidgets.find((w) => w.id === dragState.draggedId)
            if (draggedWidget) {
              const draggedRect = { ...draggedWidget, x: newX, y: newY }

              // Apply push physics to other main widgets
              const otherMainWidgets = gridState.mainWidgets.filter((w) => w.id !== dragState.draggedId)
              const pushedMainWidgets = applyPushPhysics(draggedRect, otherMainWidgets, gridSize)

              // Apply push physics to nest containers
              const pushedNests = applyPushPhysics(draggedRect, gridState.nestContainers, gridSize)

              // Update state with pushed widgets
              updateGridState((prev) => ({
                ...prev,
                mainWidgets: prev.mainWidgets.map((widget) => {
                  if (widget.id === dragState.draggedId) {
                    return { ...widget, x: newX, y: newY, updatedAt: new Date().toISOString() }
                  }
                  const pushedWidget = pushedMainWidgets.find((p) => p.id === widget.id)
                  if (pushedWidget && pushedWidget.pushed) {
                    return { ...widget, x: pushedWidget.x, y: pushedWidget.y, updatedAt: new Date().toISOString() }
                  }
                  return widget
                }),
                nestContainers: prev.nestContainers.map((nest) => {
                  const pushedNest = pushedNests.find((p) => p.id === nest.id)
                  if (pushedNest && pushedNest.pushed) {
                    return { ...nest, x: pushedNest.x, y: pushedNest.y, updatedAt: new Date().toISOString() }
                  }
                  return nest
                }),
              }))
            }
          } else if (dragState.sourceContainer === "nest" && dragState.sourceNestId) {
            const nest = gridState.nestContainers.find((n) => n.id === dragState.sourceNestId)
            if (nest) {
              const relativeX = Math.max(0, newX - nest.x)
              const relativeY = Math.max(0, newY - nest.y - 40)

              draggedWidget = gridState.nestedWidgets.find((w) => w.id === dragState.draggedId)
              if (draggedWidget) {
                const draggedRect = { ...draggedWidget, x: relativeX, y: relativeY }

                // Apply push physics to other widgets in the same nest
                const otherNestedWidgets = gridState.nestedWidgets.filter(
                  (w) => w.id !== dragState.draggedId && w.nestId === dragState.sourceNestId,
                )

                const containerBounds = { x: 0, y: 0, w: nest.w, h: nest.h - 40 }
                const pushedNestedWidgets = applyPushPhysics(draggedRect, otherNestedWidgets, gridSize, containerBounds)

                updateGridState((prev) => ({
                  ...prev,
                  nestedWidgets: prev.nestedWidgets.map((widget) => {
                    if (widget.id === dragState.draggedId) {
                      return { ...widget, x: relativeX, y: relativeY, updatedAt: new Date().toISOString() }
                    }
                    const pushedWidget = pushedNestedWidgets.find((p) => p.id === widget.id)
                    if (pushedWidget && pushedWidget.pushed) {
                      return { ...widget, x: pushedWidget.x, y: pushedWidget.y, updatedAt: new Date().toISOString() }
                    }
                    return widget
                  }),
                }))
              }
            }
          }
        } else if (dragState.draggedType === "nest") {
          // For nests, apply push physics to other nests and main widgets
          const draggedNest = gridState.nestContainers.find((n) => n.id === dragState.draggedId)
          if (draggedNest) {
            const draggedRect = { ...draggedNest, x: newX, y: newY }
            const otherNests = gridState.nestContainers.filter((n) => n.id !== dragState.draggedId)
            const allMainWidgets = gridState.mainWidgets

            const pushedNests = applyPushPhysics(draggedRect, otherNests, gridSize)
            const pushedMainWidgets = applyPushPhysics(draggedRect, allMainWidgets, gridSize)

            updateGridState((prev) => ({
              ...prev,
              nestContainers: prev.nestContainers.map((nest) => {
                if (nest.id === dragState.draggedId) {
                  return { ...nest, x: newX, y: newY, updatedAt: new Date().toISOString() }
                }
                const pushedNest = pushedNests.find((p) => p.id === nest.id)
                if (pushedNest && pushedNest.pushed) {
                  return { ...nest, x: pushedNest.x, y: pushedNest.y, updatedAt: new Date().toISOString() }
                }
                return nest
              }),
              mainWidgets: prev.mainWidgets.map((widget) => {
                const pushedWidget = pushedMainWidgets.find((p) => p.id === widget.id)
                if (pushedWidget && pushedWidget.pushed) {
                  return { ...widget, x: pushedWidget.x, y: pushedWidget.y, updatedAt: new Date().toISOString() }
                }
                return widget
              }),
            }))
          }
        }

        // Check if dragging over a nest (for visual feedback)
        if (dragState.draggedType === "widget" && dragState.sourceContainer === "main") {
          let hoverNest: string | null = null
          const widgetCenterX = newX + 100
          const widgetCenterY = newY + 75

          for (const nest of gridState.nestContainers) {
            if (
              widgetCenterX >= nest.x &&
              widgetCenterX <= nest.x + nest.w &&
              widgetCenterY >= nest.y &&
              widgetCenterY <= nest.y + nest.h
            ) {
              hoverNest = nest.id
              break
            }
          }
          setDragOverNest(hoverNest)
        }
      }

      // Handle resizing
      if (resizeState.isResizing && resizeState.resizedId) {
        const deltaX = (e.clientX - resizeState.startPos.x) / viewport.zoom
        const deltaY = (e.clientY - resizeState.startPos.y) / viewport.zoom
        const minWidth = resizeState.resizedType === "nest" ? 200 : 120
        const minHeight = resizeState.resizedType === "nest" ? 150 : 80

        const updateItem = (item: any) => {
          let newX = resizeState.startPosition.x
          let newY = resizeState.startPosition.y
          let newW = resizeState.startSize.w
          let newH = resizeState.startSize.h

          switch (resizeState.handle) {
            case "nw":
              newX = Math.round((resizeState.startPosition.x + deltaX) / gridSize) * gridSize
              newY = Math.round((resizeState.startPosition.y + deltaY) / gridSize) * gridSize
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w - deltaX) / gridSize) * gridSize)
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h - deltaY) / gridSize) * gridSize)
              break
            case "n":
              newY = Math.round((resizeState.startPosition.y + deltaY) / gridSize) * gridSize
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h - deltaY) / gridSize) * gridSize)
              break
            case "ne":
              newY = Math.round((resizeState.startPosition.y + deltaY) / gridSize) * gridSize
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w + deltaX) / gridSize) * gridSize)
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h - deltaY) / gridSize) * gridSize)
              break
            case "e":
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w + deltaX) / gridSize) * gridSize)
              break
            case "se":
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w + deltaX) / gridSize) * gridSize)
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h + deltaY) / gridSize) * gridSize)
              break
            case "s":
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h + deltaY) / gridSize) * gridSize)
              break
            case "sw":
              newX = Math.round((resizeState.startPosition.x + deltaX) / gridSize) * gridSize
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w - deltaX) / gridSize) * gridSize)
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h + deltaY) / gridSize) * gridSize)
              break
            case "w":
              newX = Math.round((resizeState.startPosition.x + deltaX) / gridSize) * gridSize
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w - deltaX) / gridSize) * gridSize)
              break
          }

          return {
            ...item,
            x: Math.max(0, newX),
            y: Math.max(0, newY),
            w: newW,
            h: newH,
            updatedAt: new Date().toISOString(),
          }
        }

        if (resizeState.resizedType === "widget") {
          const isNested = gridState.nestedWidgets.some((w) => w.id === resizeState.resizedId)
          if (isNested) {
            updateGridState((prev) => ({
              ...prev,
              nestedWidgets: prev.nestedWidgets.map((widget) =>
                widget.id === resizeState.resizedId ? updateItem(widget) : widget,
              ),
            }))
          } else {
            updateGridState((prev) => ({
              ...prev,
              mainWidgets: prev.mainWidgets.map((widget) =>
                widget.id === resizeState.resizedId ? updateItem(widget) : widget,
              ),
            }))
          }
        } else if (resizeState.resizedType === "nest") {
          updateGridState((prev) => ({
            ...prev,
            nestContainers: prev.nestContainers.map((nest) =>
              nest.id === resizeState.resizedId ? updateItem(nest) : nest,
            ),
          }))
        }
      }
    }

    const handleMouseUp = () => {
      // Handle widget transfer between containers
      if (dragState.isDragging && dragState.draggedType === "widget") {
        const currentWidget =
          dragState.sourceContainer === "main"
            ? gridState.mainWidgets.find((w) => w.id === dragState.draggedId)
            : gridState.nestedWidgets.find((w) => w.id === dragState.draggedId)

        if (!currentWidget) return

        // Check if widget is over a nest based on widget's current position
        let targetNest: NestContainer | null = null
        const widgetCenterX = currentWidget.x + currentWidget.w / 2
        const widgetCenterY = currentWidget.y + currentWidget.h / 2

        for (const nest of gridState.nestContainers) {
          if (
            widgetCenterX >= nest.x &&
            widgetCenterX <= nest.x + nest.w &&
            widgetCenterY >= nest.y &&
            widgetCenterY <= nest.y + nest.h
          ) {
            targetNest = nest
            break
          }
        }

        if (dragState.sourceContainer === "main" && targetNest) {
          // Move from main to nest
          const widget = gridState.mainWidgets.find((w) => w.id === dragState.draggedId)
          if (widget) {
            const relativeX = Math.max(10, widget.x - targetNest.x)
            const relativeY = Math.max(10, widget.y - targetNest.y - 40)

            const nestedWidget: NestedWidget = {
              ...widget,
              x: relativeX,
              y: relativeY,
              container: "nest",
              nestId: targetNest.id,
              updatedAt: new Date().toISOString(),
            }

            updateGridState((prev) => ({
              ...prev,
              mainWidgets: prev.mainWidgets.filter((w) => w.id !== dragState.draggedId),
              nestedWidgets: [...prev.nestedWidgets, nestedWidget],
            }))
            dispatch({ type: "ADD_LOG", payload: `Widget ${widget.id} moved to nest ${targetNest.id}` })
          }
        } else if (dragState.sourceContainer === "nest" && !targetNest) {
          // Move from nest to main
          const widget = gridState.nestedWidgets.find((w) => w.id === dragState.draggedId)
          const sourceNest = gridState.nestContainers.find((n) => n.id === dragState.sourceNestId)

          if (widget && sourceNest) {
            const absoluteX = sourceNest.x + widget.x
            const absoluteY = sourceNest.y + widget.y + 40

            const mainWidget: MainGridWidget = {
              id: widget.id,
              type: widget.type,
              title: widget.title,
              content: widget.content,
              x: absoluteX,
              y: absoluteY,
              w: widget.w,
              h: widget.h,
              container: "main",
              createdAt: widget.createdAt,
              updatedAt: new Date().toISOString(),
            }

            updateGridState((prev) => ({
              ...prev,
              nestedWidgets: prev.nestedWidgets.filter((w) => w.id !== dragState.draggedId),
              mainWidgets: [...prev.mainWidgets, mainWidget],
            }))
            dispatch({ type: "ADD_LOG", payload: `Widget ${widget.id} moved to main grid` })
          }
        }
      }

      resetDragState()
      resetResizeState()
      setIsPanning(false)
    }

    if (dragState.isDragging || resizeState.isResizing || isPanning) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [
    dragState,
    resizeState,
    isPanning,
    lastPanPoint,
    viewport,
    gridState,
    updateGridState,
    dispatch,
    setViewport,
    setLastPanPoint,
    setDragOverNest,
    containerRef,
    resetDragState,
    resetResizeState,
    setIsPanning,
  ])

  return { handleDrop }
}