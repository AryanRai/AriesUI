import { useCallback, useEffect } from "react"
import { useComms } from "@/components/comms-context"
import { GridState, MainGridWidget, NestContainer, NestedWidget } from "../types"
import { generateUniqueId, findNonCollidingPosition } from "../utils"

export const useGridOperations = (
  gridState: GridState,
  updateGridState: (updater: (prev: GridState) => GridState) => void,
) => {
  const { state, dispatch } = useComms()

  // Widget removal functions
  const removeWidget = useCallback((id: string) => {
    updateGridState((prev) => ({
      ...prev,
      mainWidgets: prev.mainWidgets.filter((w) => w.id !== id),
      nestedWidgets: prev.nestedWidgets.filter((w) => w.id !== id),
    }))
    dispatch({ type: "REMOVE_WIDGET", payload: id })
    dispatch({ type: "ADD_LOG", payload: `Widget ${id} removed` })
  }, [updateGridState, dispatch])

  const removeNestContainer = useCallback((id: string) => {
    // Move nested widgets to main grid
    const widgetsToMove = gridState.nestedWidgets.filter((w) => w.nestId === id)
    const nest = gridState.nestContainers.find((n) => n.id === id)

    if (nest && widgetsToMove.length > 0) {
      const movedWidgets: MainGridWidget[] = widgetsToMove.map((widget) => ({
        id: widget.id,
        type: widget.type,
        title: widget.title,
        content: widget.content,
        x: nest.x + widget.x,
        y: nest.y + widget.y + 40,
        w: widget.w,
        h: widget.h,
        container: "main",
        createdAt: widget.createdAt,
        updatedAt: new Date().toISOString(),
      }))

      updateGridState((prev) => ({
        ...prev,
        mainWidgets: [...prev.mainWidgets, ...movedWidgets],
        nestedWidgets: prev.nestedWidgets.filter((w) => w.nestId !== id),
        nestContainers: prev.nestContainers.filter((n) => n.id !== id),
      }))
      dispatch({ type: "ADD_LOG", payload: `${widgetsToMove.length} widgets moved from nest ${id} to main grid` })
    } else {
      updateGridState((prev) => ({
        ...prev,
        nestedWidgets: prev.nestedWidgets.filter((w) => w.nestId !== id),
        nestContainers: prev.nestContainers.filter((n) => n.id !== id),
      }))
    }

    dispatch({ type: "ADD_LOG", payload: `Nest container ${id} removed` })
  }, [gridState.nestedWidgets, gridState.nestContainers, updateGridState, dispatch])

  // Add functions with collision detection
  const addWidget = useCallback(() => {
    const gridSize = gridState.gridSize
    const existingItems = [...gridState.mainWidgets, ...gridState.nestContainers]

    const baseWidget = {
      x: Math.round((Math.random() * 400) / gridSize) * gridSize,
      y: Math.round((Math.random() * 300) / gridSize) * gridSize,
      w: 200,
      h: 150,
    }

    const nonCollidingPos = findNonCollidingPosition(baseWidget, existingItems, gridSize)

    const newWidget: MainGridWidget = {
      id: generateUniqueId("widget"),
      type: "basic",
      title: "New Widget",
      content: "Widget content",
      x: nonCollidingPos.x,
      y: nonCollidingPos.y,
      w: 200,
      h: 150,
      container: "main",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    updateGridState((prev) => ({
      ...prev,
      mainWidgets: [...prev.mainWidgets, newWidget],
    }))
    dispatch({ type: "ADD_LOG", payload: `New widget created: ${newWidget.id}` })
  }, [gridState.gridSize, gridState.mainWidgets, gridState.nestContainers, updateGridState, dispatch])

  const addNestContainer = useCallback(() => {
    const gridSize = gridState.gridSize
    const existingItems = [...gridState.mainWidgets, ...gridState.nestContainers]

    const baseNest = {
      x: Math.round((Math.random() * 200) / gridSize) * gridSize,
      y: Math.round((Math.random() * 150) / gridSize) * gridSize,
      w: 400,
      h: 300,
    }

    const nonCollidingPos = findNonCollidingPosition(baseNest, existingItems, gridSize)

    const newNest: NestContainer = {
      id: generateUniqueId("nest"),
      title: "Nest Container",
      x: nonCollidingPos.x,
      y: nonCollidingPos.y,
      w: 400,
      h: 300,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    updateGridState((prev) => ({
      ...prev,
      nestContainers: [...prev.nestContainers, newNest],
    }))
    dispatch({ type: "ADD_LOG", payload: `Nest container created: ${newNest.id}` })
  }, [gridState.gridSize, gridState.mainWidgets, gridState.nestContainers, updateGridState, dispatch])

  // Update widget count and broadcast to status bar
  useEffect(() => {
    const totalWidgets = gridState.mainWidgets.length + gridState.nestedWidgets.length
    window.dispatchEvent(new CustomEvent("widgetCountUpdate", { detail: { count: totalWidgets } }))
  }, [gridState.mainWidgets.length, gridState.nestedWidgets.length])

  // Listen for nest creation from toolbar
  useEffect(() => {
    const handleAddNest = () => addNestContainer()
    window.addEventListener("addNestContainer", handleAddNest)
    return () => window.removeEventListener("addNestContainer", handleAddNest)
  }, [addNestContainer])

  // Clear all widgets
  useEffect(() => {
    if (state.widgets.length === 0) {
      updateGridState((prev) => ({
        ...prev,
        mainWidgets: [],
        nestedWidgets: [],
        nestContainers: [],
      }))
    }
  }, [state.widgets.length, updateGridState])

  return {
    addWidget,
    addNestContainer,
    removeWidget,
    removeNestContainer,
  }
}