import { useState, useCallback, useEffect } from "react"
import { useComms } from "@/components/comms-context"
import { GridState, MainGridWidget, NestContainer, NestedWidget } from "../types"
import { generateUniqueId } from "../utils"

export const useGridState = () => {
  const { dispatch } = useComms()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Grid state for saving/loading
  const [gridState, setGridState] = useState<GridState>({
    mainWidgets: [
      {
        id: generateUniqueId("widget"),
        type: "sensor",
        title: "Temperature Sensor",
        content: "23.5°C",
        x: 50,
        y: 50,
        w: 200,
        h: 150,
        container: "main",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateUniqueId("widget"),
        type: "chart",
        title: "Data Flow",
        content: "Real-time chart placeholder",
        x: 300,
        y: 80,
        w: 250,
        h: 180,
        container: "main",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    nestContainers: [
      {
        id: generateUniqueId("nest"),
        title: "Demo Nest Container",
        x: 600,
        y: 100,
        w: 350,
        h: 250,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    nestedWidgets: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    gridSize: 20,
    lastSaved: null,
    version: "1.0.0",
  })

  // Initialize nested widgets after nest containers are set
  useEffect(() => {
    if (gridState.nestContainers.length > 0 && gridState.nestedWidgets.length === 0) {
      const initialNestedWidgets: NestedWidget[] = [
        {
          id: generateUniqueId("widget"),
          type: "gauge",
          title: "Nested Gauge",
          content: "85%",
          x: 20,
          y: 20,
          w: 150,
          h: 120,
          container: "nest",
          nestId: gridState.nestContainers[0].id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: generateUniqueId("widget"),
          type: "status",
          title: "Status Monitor",
          content: "Active",
          x: 180,
          y: 50,
          w: 140,
          h: 100,
          container: "nest",
          nestId: gridState.nestContainers[0].id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      setGridState((prev) => ({ ...prev, nestedWidgets: initialNestedWidgets }))
    }
  }, [gridState.nestContainers.length, gridState.nestedWidgets.length])

  // Update grid state helper
  const updateGridState = useCallback((updater: (prev: GridState) => GridState) => {
    setGridState((prev) => {
      const newState = updater(prev)
      setHasUnsavedChanges(true)
      return newState
    })
  }, [])

  // Save grid state to localStorage
  const saveGridState = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    try {
      const stateToSave = {
        ...gridState,
        viewport,
        lastSaved: new Date().toISOString(),
      }
      localStorage.setItem("comms-grid-state", JSON.stringify(stateToSave))
      setHasUnsavedChanges(false)
      dispatch({ type: "ADD_LOG", payload: "Grid state saved successfully" })
    } catch (error) {
      console.error("Failed to save grid state:", error)
      dispatch({ type: "ADD_LOG", payload: "Failed to save grid state" })
    }
  }, [gridState, dispatch])

  // Load grid state from localStorage
  const loadGridState = useCallback(() => {
    try {
      const savedState = localStorage.getItem("comms-grid-state")
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        setGridState(parsedState)
        setHasUnsavedChanges(false)
        dispatch({ type: "ADD_LOG", payload: "Grid state loaded successfully" })
        return parsedState.viewport || { x: 0, y: 0, zoom: 1 }
      }
    } catch (error) {
      console.error("Failed to load grid state:", error)
      dispatch({ type: "ADD_LOG", payload: "Failed to load grid state" })
    }
    return { x: 0, y: 0, zoom: 1 }
  }, [dispatch])

  // Export grid state as JSON file
  const exportGridState = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    try {
      const stateToExport = {
        ...gridState,
        viewport,
        exportedAt: new Date().toISOString(),
      }
      const dataStr = JSON.stringify(stateToExport, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `comms-grid-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      dispatch({ type: "ADD_LOG", payload: "Grid state exported successfully" })
    } catch (error) {
      console.error("Failed to export grid state:", error)
      dispatch({ type: "ADD_LOG", payload: "Failed to export grid state" })
    }
  }, [gridState, dispatch])

  // Import grid state from JSON file
  const importGridState = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedState = JSON.parse(e.target?.result as string)
          setGridState(importedState)
          setHasUnsavedChanges(true)
          dispatch({ type: "ADD_LOG", payload: "Grid state imported successfully" })
        } catch (error) {
          console.error("Failed to import grid state:", error)
          dispatch({ type: "ADD_LOG", payload: "Failed to import grid state" })
        }
      }
      reader.readAsText(file)
      event.target.value = "" // Reset input
    },
    [dispatch],
  )

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    let viewport = { x: 0, y: 0, zoom: 1 }
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        saveGridState(viewport)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [hasUnsavedChanges, saveGridState])

  return {
    gridState,
    setGridState,
    updateGridState,
    hasUnsavedChanges,
    saveGridState,
    loadGridState,
    exportGridState,
    importGridState,
  }
}