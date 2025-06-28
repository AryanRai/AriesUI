"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Settings, Hash, GripVertical, Grid3X3, Save, Download, Upload, Eye, EyeOff, Clock } from "lucide-react"
import { useComms } from "@/components/comms-context"
import { AriesModWidget } from "@/components/widgets/ariesmod-widget"
import type { AriesWidget, NestedAriesWidget } from "@/types/ariesmods"
import { useLocalStorage } from "@/hooks/use-local-storage"

interface BaseWidget {
  id: string
  type: string
  title: string
  content: string
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
}

interface MainGridWidget extends BaseWidget {
  container: "main"
}

interface NestedWidget extends BaseWidget {
  container: "nest"
  nestId: string
}

interface NestContainer {
  id: string
  title: string
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
}

interface GridState {
  mainWidgets: MainGridWidget[]
  nestContainers: NestContainer[]
  nestedWidgets: NestedWidget[]
  mainAriesWidgets: AriesWidget[]
  nestedAriesWidgets: NestedAriesWidget[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  gridSize: number
  lastSaved: string | null
  version: string
}

interface MainContentProps {
  gridState: GridState
  setGridState: React.Dispatch<React.SetStateAction<GridState>>
}

type Widget = MainGridWidget | NestedWidget
type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

// Utility function to generate unique IDs
const generateUniqueId = (prefix: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}-${timestamp}-${random}`
}

// Enhanced collision detection utilities with push physics
const checkCollision = (
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number },
): boolean => {
  return !(
    rect1.x + rect1.w <= rect2.x ||
    rect2.x + rect2.w <= rect1.x ||
    rect1.y + rect1.h <= rect2.y ||
    rect2.y + rect2.h <= rect1.y
  )
}

const getCollisionOverlap = (
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number },
): { overlapX: number; overlapY: number; direction: "horizontal" | "vertical" } => {
  const overlapX = Math.min(rect1.x + rect1.w, rect2.x + rect2.w) - Math.max(rect1.x, rect2.x)
  const overlapY = Math.min(rect1.y + rect1.h, rect2.y + rect2.h) - Math.max(rect1.y, rect2.y)

  // Determine primary push direction based on smaller overlap
  const direction = overlapX < overlapY ? "horizontal" : "vertical"

  return { overlapX, overlapY, direction }
}

const calculatePushDirection = (
  draggedWidget: { x: number; y: number; w: number; h: number },
  targetWidget: { x: number; y: number; w: number; h: number },
): { dx: number; dy: number } => {
  const draggedCenterX = draggedWidget.x + draggedWidget.w / 2
  const draggedCenterY = draggedWidget.y + draggedWidget.h / 2
  const targetCenterX = targetWidget.x + targetWidget.w / 2
  const targetCenterY = targetWidget.y + targetWidget.h / 2

  const deltaX = targetCenterX - draggedCenterX
  const deltaY = targetCenterY - draggedCenterY

  const overlap = getCollisionOverlap(draggedWidget, targetWidget)

  if (overlap.direction === "horizontal") {
    // Push horizontally
    const pushDistance = overlap.overlapX + 10 // Add small buffer
    return {
      dx: deltaX > 0 ? pushDistance : -pushDistance,
      dy: 0,
    }
  } else {
    // Push vertically
    const pushDistance = overlap.overlapY + 10 // Add small buffer
    return {
      dx: 0,
      dy: deltaY > 0 ? pushDistance : -pushDistance,
    }
  }
}

const findNonCollidingPosition = (
  newWidget: { x: number; y: number; w: number; h: number },
  existingWidgets: { x: number; y: number; w: number; h: number }[],
  gridSize: number,
  containerBounds?: { x: number; y: number; w: number; h: number },
): { x: number; y: number } => {
  let { x, y } = newWidget
  const maxAttempts = 1000
  let attempts = 0

  while (attempts < maxAttempts) {
    const testRect = { x, y, w: newWidget.w, h: newWidget.h }
    let hasCollision = false

    // Check collision with existing widgets
    for (const widget of existingWidgets) {
      if (checkCollision(testRect, widget)) {
        hasCollision = true
        break
      }
    }

    if (!hasCollision) {
      // Ensure within container bounds if specified
      if (containerBounds) {
        if (
          x >= containerBounds.x &&
          y >= containerBounds.y &&
          x + newWidget.w <= containerBounds.x + containerBounds.w &&
          y + newWidget.h <= containerBounds.y + containerBounds.h
        ) {
          return { x, y }
        }
      } else {
        return { x, y }
      }
    }

    // Try next position
    x += gridSize
    if (containerBounds && x + newWidget.w > containerBounds.x + containerBounds.w) {
      x = containerBounds?.x || 0
      y += gridSize
    } else if (!containerBounds && x > 2000) {
      x = 0
      y += gridSize
    }

    attempts++
  }

  // Fallback to original position if no valid position found
  return { x: newWidget.x, y: newWidget.y }
}

const applyPushPhysics = (
  draggedWidget: { id: string; x: number; y: number; w: number; h: number },
  widgets: Array<{ id: string; x: number; y: number; w: number; h: number }>,
  gridSize: number,
  containerBounds?: { x: number; y: number; w: number; h: number },
): Array<{ id: string; x: number; y: number; w: number; h: number; pushed?: boolean }> => {
  const result = widgets.map((w) => ({ ...w, pushed: false }))
  const pushedWidgets = new Set<string>()

  // Find widgets that collide with the dragged widget
  const collidingWidgets = result.filter(
    (widget) => widget.id !== draggedWidget.id && checkCollision(draggedWidget, widget),
  )

  // Apply push physics to colliding widgets
  for (const collidingWidget of collidingWidgets) {
    if (pushedWidgets.has(collidingWidget.id)) continue

    const pushDirection = calculatePushDirection(draggedWidget, collidingWidget)
    let newX = collidingWidget.x + pushDirection.dx
    let newY = collidingWidget.y + pushDirection.dy

    // Snap to grid
    newX = Math.round(newX / gridSize) * gridSize
    newY = Math.round(newY / gridSize) * gridSize

    // Ensure within bounds
    if (containerBounds) {
      newX = Math.max(containerBounds.x, Math.min(newX, containerBounds.x + containerBounds.w - collidingWidget.w))
      newY = Math.max(containerBounds.y, Math.min(newY, containerBounds.y + containerBounds.h - collidingWidget.h))
    } else {
      newX = Math.max(0, newX)
      newY = Math.max(0, newY)
    }

    // Update the widget position
    const widgetIndex = result.findIndex((w) => w.id === collidingWidget.id)
    if (widgetIndex !== -1) {
      result[widgetIndex] = {
        ...result[widgetIndex],
        x: newX,
        y: newY,
        pushed: true,
      }
      pushedWidgets.add(collidingWidget.id)
    }

    // Check for chain reactions - if the pushed widget now collides with others
    const pushedWidgetRect = { ...result[widgetIndex] }
    const secondaryCollisions = result.filter(
      (widget) =>
        widget.id !== pushedWidgetRect.id &&
        widget.id !== draggedWidget.id &&
        !pushedWidgets.has(widget.id) &&
        checkCollision(pushedWidgetRect, widget),
    )

    // Apply secondary pushes (chain reaction)
    for (const secondaryWidget of secondaryCollisions) {
      const secondaryPush = calculatePushDirection(pushedWidgetRect, secondaryWidget)
      let secondaryX = secondaryWidget.x + secondaryPush.dx
      let secondaryY = secondaryWidget.y + secondaryPush.dy

      // Snap to grid
      secondaryX = Math.round(secondaryX / gridSize) * gridSize
      secondaryY = Math.round(secondaryY / gridSize) * gridSize

      // Ensure within bounds
      if (containerBounds) {
        secondaryX = Math.max(
          containerBounds.x,
          Math.min(secondaryX, containerBounds.x + containerBounds.w - secondaryWidget.w),
        )
        secondaryY = Math.max(
          containerBounds.y,
          Math.min(secondaryY, containerBounds.y + containerBounds.h - secondaryWidget.h),
        )
      } else {
        secondaryX = Math.max(0, secondaryX)
        secondaryY = Math.max(0, secondaryY)
      }

      const secondaryIndex = result.findIndex((w) => w.id === secondaryWidget.id)
      if (secondaryIndex !== -1) {
        result[secondaryIndex] = {
          ...result[secondaryIndex],
          x: secondaryX,
          y: secondaryY,
          pushed: true,
        }
        pushedWidgets.add(secondaryWidget.id)
      }
    }
  }

  return result
}

const calculateNestAutoSize = (
  nestWidgets: NestedWidget[],
  minWidth = 400,
  minHeight = 300,
  padding = 20,
): { w: number; h: number } => {
  if (nestWidgets.length === 0) {
    return { w: minWidth, h: minHeight }
  }

  let maxX = 0
  let maxY = 0

  nestWidgets.forEach((widget) => {
    const rightEdge = widget.x + widget.w
    const bottomEdge = widget.y + widget.h
    if (rightEdge > maxX) maxX = rightEdge
    if (bottomEdge > maxY) maxY = bottomEdge
  })

  const calculatedWidth = Math.max(minWidth, maxX + padding)
  const calculatedHeight = Math.max(minHeight, maxY + padding + 40) // +40 for header

  return { w: calculatedWidth, h: calculatedHeight }
}

export function MainContent({ gridState, setGridState }: MainContentProps) {
  const { 
    state,
    dispatch, 
    loadProfile, 
    updateProfiles 
  } = useComms()
  const { profiles, activeProfile } = state;

  // Viewport state for infinite scrolling
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    zoom: 1,
  })

  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })

  // Initialize nested widgets after nest containers are set
  // REMOVED: Auto-adding default widgets to nests - nests should start empty

  const [dragState, setDragState] = useState<{
    isDragging: boolean
    draggedId: string | null
    draggedType: "widget" | "nest" | null
    sourceContainer: "main" | "nest" | null
    sourceNestId?: string
    offset: { x: number; y: number }
  }>({
    isDragging: false,
    draggedId: null,
    draggedType: null,
    sourceContainer: null,
    offset: { x: 0, y: 0 },
  })

  const [resizeState, setResizeState] = useState<{
    isResizing: boolean
    resizedId: string | null
    resizedType: "widget" | "nest" | null
    handle: ResizeHandle | null
    startPos: { x: number; y: number }
    startSize: { w: number; h: number }
    startPosition: { x: number; y: number }
  }>({
    isResizing: false,
    resizedId: null,
    resizedType: null,
    handle: null,
    startPos: { x: 0, y: 0 },
    startSize: { w: 0, h: 0 },
    startPosition: { x: 0, y: 0 },
  })

  const [dropState, setDropState] = useState<{
    isDragOver: boolean
    targetNestId: string | null
  }>({
    isDragOver: false,
    targetNestId: null,
  })

  const [dragOverNest, setDragOverNest] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  const [isViewportInfoVisible, setIsViewportInfoVisible] = useLocalStorage("aries-show-viewport-info", true)
  const [actionsToolbarPosition, setActionsToolbarPosition] = useLocalStorage("aries-actions-toolbar-pos", { top: 80, right: 20 })
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false)
  const [toolbarDragStart, setToolbarDragStart] = useState({ x: 0, y: 0, top: 0, right: 0 })
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useLocalStorage("aries-auto-save-enabled", true)

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingToolbar(true)
    setToolbarDragStart({
      x: e.clientX,
      y: e.clientY,
      top: actionsToolbarPosition.top,
      right: actionsToolbarPosition.right,
    })
  }

  // Update grid state helper
  const updateGridState = useCallback((updater: (prev: GridState) => GridState) => {
    setGridState((prev) => {
      const newState = updater(prev)
      setHasUnsavedChanges(true)
      return newState
    })
  }, [])

  // Save grid state to localStorage and current profile
  const saveGridState = useCallback(() => {
    try {
      const stateToSave = {
        ...gridState,
        viewport,
        lastSaved: new Date().toISOString(),
      }
      localStorage.setItem("comms-grid-state", JSON.stringify(stateToSave))
      
      // Also save to the current active profile if it exists
      if (state.activeProfile && state.profiles[state.activeProfile]) {
        const updatedProfiles = { ...state.profiles, [state.activeProfile]: stateToSave }
        updateProfiles(updatedProfiles)
        dispatch({ type: "ADD_LOG", payload: `Grid state saved to profile "${state.activeProfile}"` })
      } else {
        dispatch({ type: "ADD_LOG", payload: "Grid state saved to localStorage" })
      }
      
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Failed to save grid state:", error)
      dispatch({ type: "ADD_LOG", payload: "Failed to save grid state" })
    }
  }, [gridState, viewport, dispatch, state.activeProfile, state.profiles, updateProfiles])

  // Load grid state from localStorage
  const loadGridState = useCallback(() => {
    try {
      const savedState = localStorage.getItem("comms-grid-state")
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        setGridState(parsedState)
        setViewport(parsedState.viewport || { x: 0, y: 0, zoom: 1 })
        setHasUnsavedChanges(false)
        dispatch({ type: "ADD_LOG", payload: "Grid state loaded successfully" })
      }
    } catch (error) {
      console.error("Failed to load grid state:", error)
      dispatch({ type: "ADD_LOG", payload: "Failed to load grid state" })
    }
  }, [dispatch])

  // Export grid state as JSON file
  const exportGridState = useCallback(() => {
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
  }, [gridState, viewport, dispatch])

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
          setViewport(importedState.viewport || { x: 0, y: 0, zoom: 1 })
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

  // Auto-save every 30 seconds if there are unsaved changes and auto-save is enabled
  useEffect(() => {
    if (!isAutoSaveEnabled) return

    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        saveGridState()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [hasUnsavedChanges, saveGridState, isAutoSaveEnabled])

  // Initialize default profile if none exists
  useEffect(() => {
    if (Object.keys(state.profiles).length === 0) {
      // Create a default profile with the current grid state
      const currentState = {
        ...gridState,
        viewport,
        lastSaved: new Date().toISOString(),
      }
      
      const defaultProfiles = { default: currentState }
      updateProfiles(defaultProfiles)
      
      // Also save to localStorage
      localStorage.setItem("comms-grid-state", JSON.stringify(currentState))
      
      dispatch({ type: "ADD_LOG", payload: "Default profile created" })
    }
  }, [state.profiles, gridState, viewport, updateProfiles, dispatch])

  // Load grid state from localStorage on component mount
  useEffect(() => {
    loadGridState()
  }, [loadGridState])

  // Add keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault()
            setViewport(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.25) }))
            break
          case '-':
            e.preventDefault()
            setViewport(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }))
            break
          case '0':
            e.preventDefault()
            setViewport({ x: 0, y: 0, zoom: 1 })
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Save current grid state before loading a new profile
  const saveCurrentStateToProfile = useCallback(() => {
    try {
      const stateToSave = {
        ...gridState,
        viewport,
        lastSaved: new Date().toISOString(),
      }
      localStorage.setItem("comms-grid-state", JSON.stringify(stateToSave))
      return true
    } catch (error) {
      console.error("Failed to save current state:", error)
      return false
    }
  }, [gridState, viewport])

  // Listen for profile changes and reload grid state
  useEffect(() => {
    const handleProfileChange = (event: CustomEvent) => {
      const { profileName } = event.detail || {}
      
      if (profileName) {
        // Load the new profile's grid state
        loadGridState()
        dispatch({ type: "ADD_LOG", payload: `Switched to profile: ${profileName}` })
      }
    }
    
    window.addEventListener("profileChanged", handleProfileChange as EventListener)
    return () => window.removeEventListener("profileChanged", handleProfileChange as EventListener)
  }, [loadGridState, dispatch])

  // Auto-save current state when switching profiles
  useEffect(() => {
    const handleBeforeProfileChange = () => {
      saveCurrentStateToProfile()
    }
    
    window.addEventListener("beforeProfileChange", handleBeforeProfileChange)
    return () => window.removeEventListener("beforeProfileChange", handleBeforeProfileChange)
  }, [saveCurrentStateToProfile])

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => {
    const target = e.target as HTMLElement
    if (target.closest(".resize-handle")) return

    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()

    // Determine source container
    let sourceContainer: "main" | "nest" = "main"
    let sourceNestId: string | undefined

    if (itemType === "widget") {
      // Check both regular widgets and AriesWidgets
      const nestedWidget = gridState.nestedWidgets.find((w) => w.id === itemId)
      const nestedAriesWidget = gridState.nestedAriesWidgets.find((w) => w.id === itemId)
      
      if (nestedWidget) {
        sourceContainer = "nest"
        sourceNestId = nestedWidget.nestId
      } else if (nestedAriesWidget) {
        sourceContainer = "nest"
        sourceNestId = nestedAriesWidget.nestId
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
  }

  // Handle panning
  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+Left click
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }

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

  // Handle resize mouse down
  const handleResizeMouseDown = (
    e: React.MouseEvent,
    itemId: string,
    itemType: "widget" | "nest",
    handle: ResizeHandle,
  ) => {
    e.preventDefault()
    e.stopPropagation()

    let item: any = null
    if (itemType === "widget") {
      item = gridState.mainWidgets.find((w) => w.id === itemId) || 
             gridState.nestedWidgets.find((w) => w.id === itemId) ||
             gridState.mainAriesWidgets.find((w) => w.id === itemId) ||
             gridState.nestedAriesWidgets.find((w) => w.id === itemId)
    } else {
      item = gridState.nestContainers.find((n) => n.id === itemId)
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
  }

  // Handle drag over for drop zones
  const handleDragOver = (e: React.DragEvent, targetNestId?: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setDropState({ isDragOver: true, targetNestId: targetNestId || null })
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropState({ isDragOver: false, targetNestId: null })
    }
  }

  // Handle drop from widget palette
  const handleDrop = (e: React.DragEvent, targetNestId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDropState({ isDragOver: false, targetNestId: null })

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

        if (template.type === 'ariesmods') {
          // Create AriesWidget for nest
          const newAriesWidget: NestedAriesWidget = {
            id: generateUniqueId("arieswidget"),
            type: 'ariesmods',
            ariesModType: template.ariesModType,
            title: template.title,
            x: dropX,
            y: dropY,
            w: template.defaultSize.w,
            h: template.defaultSize.h,
            config: {},
            nestId: targetNestId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          // Apply push physics to existing AriesWidgets in the nest
          const existingNestAriesWidgets = gridState.nestedAriesWidgets.filter((w) => w.nestId === targetNestId)
          const containerBounds = { x: 0, y: 0, w: nest.w, h: nest.h - 40 }
          const pushedAriesWidgets = applyPushPhysics(newAriesWidget, existingNestAriesWidgets, gridSize, containerBounds)

          updateGridState((prev) => ({
            ...prev,
            nestedAriesWidgets: [
              ...prev.nestedAriesWidgets.map((widget) => {
                if (widget.nestId !== targetNestId) return widget
                const pushedWidget = pushedAriesWidgets.find((p) => p.id === widget.id)
                if (pushedWidget && pushedWidget.pushed) {
                  return { ...widget, x: pushedWidget.x, y: pushedWidget.y, updatedAt: new Date().toISOString() }
                }
                return widget
              }),
              newAriesWidget,
            ],
          }))
          dispatch({ type: "ADD_LOG", payload: `AriesWidget ${newAriesWidget.id} dropped into nest ${targetNestId}` })
        } else {
          // Create regular widget for nest
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
        }
      } else {
        // Dropping into main grid
        const rawX = Math.max(0, worldX - template.defaultSize.w / 2)
        const rawY = Math.max(0, worldY - template.defaultSize.h / 2)

        dropX = Math.round(rawX / gridSize) * gridSize
        dropY = Math.round(rawY / gridSize) * gridSize

        if (template.type === 'ariesmods') {
          // Create AriesWidget for main grid
          const newAriesWidget: AriesWidget = {
            id: generateUniqueId("arieswidget"),
            type: 'ariesmods',
            ariesModType: template.ariesModType,
            title: template.title,
            x: dropX,
            y: dropY,
            w: template.defaultSize.w,
            h: template.defaultSize.h,
            config: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          // Apply push physics to existing main AriesWidgets and nests
          const existingMainAriesWidgets = gridState.mainAriesWidgets
          const existingNests = gridState.nestContainers
          const pushedMainAriesWidgets = applyPushPhysics(newAriesWidget, existingMainAriesWidgets, gridSize)
          const pushedNests = applyPushPhysics(newAriesWidget, existingNests, gridSize)

          updateGridState((prev) => ({
            ...prev,
            mainAriesWidgets: [
              ...prev.mainAriesWidgets.map((widget) => {
                const pushedWidget = pushedMainAriesWidgets.find((p) => p.id === widget.id)
                if (pushedWidget && pushedWidget.pushed) {
                  return { ...widget, x: pushedWidget.x, y: pushedWidget.y, updatedAt: new Date().toISOString() }
                }
                return widget
              }),
              newAriesWidget,
            ],
            nestContainers: prev.nestContainers.map((nest) => {
              const pushedNest = pushedNests.find((p) => p.id === nest.id)
              if (pushedNest && pushedNest.pushed) {
                return { ...nest, x: pushedNest.x, y: pushedNest.y, updatedAt: new Date().toISOString() }
              }
              return nest
            }),
          }))
          dispatch({ type: "ADD_LOG", payload: `AriesWidget ${newAriesWidget.id} dropped on main grid` })
        } else {
          // Create regular widget for main grid
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
      }
    } catch (error) {
      console.error("Failed to parse dropped widget data:", error)
    }
  }

  const getDefaultContent = (type: string): string => {
    switch (type) {
      case "sensor":
        return "23.5°C"
      case "chart":
      case "line-chart":
        return "Chart Data"
      case "pie-chart":
        return "Pie Chart"
      case "trend-chart":
        return "Trend Data"
      case "status":
        return "Online"
      case "gauge":
        return "75%"
      case "monitor":
        return "CPU: 45%"
      case "power":
        return "120W"
      case "network-status":
        return "Connected"
      case "bandwidth":
        return "1.2 Mbps"
      case "data-table":
        return "Data Table"
      default:
        return "No Data"
    }
  }

  // Mouse move and mouse up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const gridSize = gridState.gridSize

      // Handle toolbar dragging
      if (isDraggingToolbar) {
        const deltaX = e.clientX - toolbarDragStart.x
        const deltaY = e.clientY - toolbarDragStart.y
        
        const newTop = toolbarDragStart.top + deltaY
        const newRight = toolbarDragStart.right - deltaX

        setActionsToolbarPosition({
          top: Math.max(80, Math.min(newTop, window.innerHeight - 80)),
          right: Math.max(20, Math.min(newRight, window.innerWidth - 300)),
        })
        return
      }

      // Handle panning
      if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x
        const deltaY = e.clientY - lastPanPoint.y
        setViewport((prev) => ({
          ...prev,
          x: prev.x + deltaX / viewport.zoom,
          y: prev.y + deltaY / viewport.zoom,
        }))
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
            // Check both regular widgets and AriesWidgets
            draggedWidget = gridState.mainWidgets.find((w) => w.id === dragState.draggedId) ||
                           gridState.mainAriesWidgets.find((w) => w.id === dragState.draggedId)
            
            if (draggedWidget) {
              const draggedRect = { ...draggedWidget, x: newX, y: newY }

              // Apply push physics to other main widgets and AriesWidgets
              const otherMainWidgets = gridState.mainWidgets.filter((w) => w.id !== dragState.draggedId)
              const otherMainAriesWidgets = gridState.mainAriesWidgets.filter((w) => w.id !== dragState.draggedId)
              const pushedMainWidgets = applyPushPhysics(draggedRect, otherMainWidgets, gridSize)
              const pushedMainAriesWidgets = applyPushPhysics(draggedRect, otherMainAriesWidgets, gridSize)

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
                mainAriesWidgets: prev.mainAriesWidgets.map((widget) => {
                  if (widget.id === dragState.draggedId) {
                    return { ...widget, x: newX, y: newY, updatedAt: new Date().toISOString() }
                  }
                  const pushedWidget = pushedMainAriesWidgets.find((p) => p.id === widget.id)
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

              // Check both regular nested widgets and AriesWidgets
              draggedWidget = gridState.nestedWidgets.find((w) => w.id === dragState.draggedId) ||
                             gridState.nestedAriesWidgets.find((w) => w.id === dragState.draggedId)
              
              if (draggedWidget) {
                const draggedRect = { ...draggedWidget, x: relativeX, y: relativeY }

                // Apply push physics to other widgets in the same nest
                const otherNestedWidgets = gridState.nestedWidgets.filter(
                  (w) => w.id !== dragState.draggedId && w.nestId === dragState.sourceNestId,
                )
                const otherNestedAriesWidgets = gridState.nestedAriesWidgets.filter(
                  (w) => w.id !== dragState.draggedId && w.nestId === dragState.sourceNestId,
                )

                const containerBounds = { x: 0, y: 0, w: nest.w, h: nest.h - 40 }
                const pushedNestedWidgets = applyPushPhysics(draggedRect, otherNestedWidgets, gridSize, containerBounds)
                const pushedNestedAriesWidgets = applyPushPhysics(draggedRect, otherNestedAriesWidgets, gridSize, containerBounds)

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
                  nestedAriesWidgets: prev.nestedAriesWidgets.map((widget) => {
                    if (widget.id === dragState.draggedId) {
                      return { ...widget, x: relativeX, y: relativeY, updatedAt: new Date().toISOString() }
                    }
                    const pushedWidget = pushedNestedAriesWidgets.find((p) => p.id === widget.id)
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
          const isNestedWidget = gridState.nestedWidgets.some((w) => w.id === resizeState.resizedId)
          const isNestedAriesWidget = gridState.nestedAriesWidgets.some((w) => w.id === resizeState.resizedId)
          const isMainAriesWidget = gridState.mainAriesWidgets.some((w) => w.id === resizeState.resizedId)
          
          if (isNestedWidget) {
            updateGridState((prev) => ({
              ...prev,
              nestedWidgets: prev.nestedWidgets.map((widget) =>
                widget.id === resizeState.resizedId ? updateItem(widget) : widget,
              ),
            }))
          } else if (isNestedAriesWidget) {
            updateGridState((prev) => ({
              ...prev,
              nestedAriesWidgets: prev.nestedAriesWidgets.map((widget) =>
                widget.id === resizeState.resizedId ? updateItem(widget) : widget,
              ),
            }))
          } else if (isMainAriesWidget) {
            updateGridState((prev) => ({
              ...prev,
              mainAriesWidgets: prev.mainAriesWidgets.map((widget) =>
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
            ? gridState.mainWidgets.find((w) => w.id === dragState.draggedId) ||
              gridState.mainAriesWidgets.find((w) => w.id === dragState.draggedId)
            : gridState.nestedWidgets.find((w) => w.id === dragState.draggedId) ||
              gridState.nestedAriesWidgets.find((w) => w.id === dragState.draggedId)

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
          const ariesWidget = gridState.mainAriesWidgets.find((w) => w.id === dragState.draggedId)
          
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
          } else if (ariesWidget) {
            const relativeX = Math.max(10, ariesWidget.x - targetNest.x)
            const relativeY = Math.max(10, ariesWidget.y - targetNest.y - 40)

            const nestedAriesWidget: NestedAriesWidget = {
              ...ariesWidget,
              x: relativeX,
              y: relativeY,
              nestId: targetNest.id,
              updatedAt: new Date().toISOString(),
            }

            updateGridState((prev) => ({
              ...prev,
              mainAriesWidgets: prev.mainAriesWidgets.filter((w) => w.id !== dragState.draggedId),
              nestedAriesWidgets: [...prev.nestedAriesWidgets, nestedAriesWidget],
            }))
            dispatch({ type: "ADD_LOG", payload: `AriesWidget ${ariesWidget.id} moved to nest ${targetNest.id}` })
          }
        } else if (dragState.sourceContainer === "nest" && !targetNest) {
          // Move from nest to main
          const widget = gridState.nestedWidgets.find((w) => w.id === dragState.draggedId)
          const ariesWidget = gridState.nestedAriesWidgets.find((w) => w.id === dragState.draggedId)
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
          } else if (ariesWidget && sourceNest) {
            const absoluteX = sourceNest.x + ariesWidget.x
            const absoluteY = sourceNest.y + ariesWidget.y + 40

            const mainAriesWidget: AriesWidget = {
              id: ariesWidget.id,
              type: ariesWidget.type,
              ariesModType: ariesWidget.ariesModType,
              title: ariesWidget.title,
              x: absoluteX,
              y: absoluteY,
              w: ariesWidget.w,
              h: ariesWidget.h,
              config: ariesWidget.config,
              data: ariesWidget.data,
              createdAt: ariesWidget.createdAt,
              updatedAt: new Date().toISOString(),
            }

            updateGridState((prev) => ({
              ...prev,
              nestedAriesWidgets: prev.nestedAriesWidgets.filter((w) => w.id !== dragState.draggedId),
              mainAriesWidgets: [...prev.mainAriesWidgets, mainAriesWidget],
            }))
            dispatch({ type: "ADD_LOG", payload: `AriesWidget ${ariesWidget.id} moved to main grid` })
          }
        }
      }

      setDragState({
        isDragging: false,
        draggedId: null,
        draggedType: null,
        sourceContainer: null,
        offset: { x: 0, y: 0 },
      })

      setResizeState({
        isResizing: false,
        resizedId: null,
        resizedType: null,
        handle: null,
        startPos: { x: 0, y: 0 },
        startSize: { w: 0, h: 0 },
        startPosition: { x: 0, y: 0 },
      })

      setIsPanning(false)
      setDragOverNest(null)
      setIsDraggingToolbar(false)
    }

    if (dragState.isDragging || resizeState.isResizing || isPanning || isDraggingToolbar) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragState, resizeState, isPanning, lastPanPoint, viewport, gridState, updateGridState, dispatch, isDraggingToolbar, toolbarDragStart, setActionsToolbarPosition])

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
      return () => container.removeEventListener("wheel", handleWheel)
    }
  }, [handleWheel])

  // Widget removal functions
  const removeWidget = (id: string) => {
    updateGridState((prev) => ({
      ...prev,
      mainWidgets: prev.mainWidgets.filter((w) => w.id !== id),
      nestedWidgets: prev.nestedWidgets.filter((w) => w.id !== id),
    }))
    dispatch({ type: "REMOVE_WIDGET", payload: id })
    dispatch({ type: "ADD_LOG", payload: `Widget ${id} removed` })
  }

  const removeAriesWidget = (id: string) => {
    updateGridState((prev) => ({
      ...prev,
      mainAriesWidgets: prev.mainAriesWidgets.filter((w) => w.id !== id),
      nestedAriesWidgets: prev.nestedAriesWidgets.filter((w) => w.id !== id),
    }))
    dispatch({ type: "ADD_LOG", payload: `AriesWidget ${id} removed` })
  }

  const updateAriesWidget = (id: string, updates: Partial<AriesWidget | NestedAriesWidget>) => {
    updateGridState((prev) => ({
      ...prev,
      mainAriesWidgets: prev.mainAriesWidgets.map((w) => 
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ),
      nestedAriesWidgets: prev.nestedAriesWidgets.map((w) => 
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ),
    }))
  }

  const removeNestContainer = (id: string) => {
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
  }

  // Add functions with collision detection
  const addWidget = () => {
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
  }

  const addNestContainer = () => {
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
  }

  // Auto-resize nests based on content
  useEffect(() => {
    updateGridState((prev) => ({
      ...prev,
      nestContainers: prev.nestContainers.map((nest) => {
        const nestWidgets = prev.nestedWidgets.filter((w) => w.nestId === nest.id)
        const autoSize = calculateNestAutoSize(nestWidgets)

        // Only update if size actually changed to prevent infinite loops
        if (nest.w !== autoSize.w || nest.h !== autoSize.h) {
          return {
            ...nest,
            w: autoSize.w,
            h: autoSize.h,
            updatedAt: new Date().toISOString(),
          }
        }
        return nest
      }),
    }))
  }, [gridState.nestedWidgets, updateGridState])

  // Listen for nest creation from toolbar
  useEffect(() => {
    const handleAddNest = () => addNestContainer()
    window.addEventListener("addNestContainer", handleAddNest)
    return () => window.removeEventListener("addNestContainer", handleAddNest)
  }, [])

  // Clear all widgets from the grid if the global widget list in context is cleared
  useEffect(() => {
    if (state.widgets.length === 0) {
      setGridState((prev) => ({
        ...prev,
        mainWidgets: [],
        mainAriesWidgets: [],
        nestedWidgets: [],
        nestedAriesWidgets: [],
        nestContainers: [],
      }));
    }
  }, [state.widgets.length]);

  // Resize handles component
  const getResizeHandles = (itemId: string, itemType: "widget" | "nest") => {
    const handles: { handle: ResizeHandle; className: string; cursor: string }[] = [
      { handle: "nw", className: "top-0 left-0 -translate-x-1/2 -translate-y-1/2", cursor: "nw-resize" },
      { handle: "n", className: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "n-resize" },
      { handle: "ne", className: "top-0 right-0 translate-x-1/2 -translate-y-1/2", cursor: "ne-resize" },
      { handle: "e", className: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2", cursor: "e-resize" },
      { handle: "se", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2", cursor: "se-resize" },
      { handle: "s", className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", cursor: "s-resize" },
      { handle: "sw", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", cursor: "sw-resize" },
      { handle: "w", className: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2", cursor: "w-resize" },
    ]

    return handles.map(({ handle, className, cursor }) => (
      <div
        key={handle}
        className={`resize-handle absolute w-3 h-3 bg-primary border border-primary-foreground rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 ${className}`}
        style={{ cursor }}
        onMouseDown={(e) => handleResizeMouseDown(e, itemId, itemType, handle)}
      />
    ))
  }

  // Update widget count and broadcast to status bar
  useEffect(() => {
    const totalWidgets = gridState.mainWidgets.length + gridState.nestedWidgets.length + 
                        gridState.mainAriesWidgets.length + gridState.nestedAriesWidgets.length
    window.dispatchEvent(new CustomEvent("widgetCountUpdate", { detail: { count: totalWidgets } }))
  }, [gridState.mainWidgets.length, gridState.nestedWidgets.length, gridState.mainAriesWidgets.length, gridState.nestedAriesWidgets.length])

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-background to-background/80">
      {/* Floating Action Buttons */}
      <div
        className="absolute z-50"
        style={{
          top: actionsToolbarPosition.top,
          right: actionsToolbarPosition.right,
        }}
      >
        <Card className="bg-background/90 backdrop-blur-sm border-border/50 shadow-lg">
          <CardHeader
            className="py-1 px-2 cursor-grab active:cursor-grabbing text-center"
            onMouseDown={handleToolbarMouseDown}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
          </CardHeader>
          <CardContent className="p-2 flex gap-2">
            <Button
              onClick={saveGridState}
              size="sm"
              variant="default"
              className={`gap-2 ${hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700" : ""}`}
            >
              <Save className="h-4 w-4" />
              Save {hasUnsavedChanges && "*"}
            </Button>
            <Button
              onClick={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)}
              size="sm"
              variant={isAutoSaveEnabled ? "default" : "outline"}
              className="gap-2"
              title={isAutoSaveEnabled ? "Auto-save enabled (30s)" : "Auto-save disabled"}
            >
              <Clock className="h-4 w-4" />
              Auto
            </Button>
            <Button onClick={exportGridState} size="sm" variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <label className="cursor-pointer">
              <input type="file" accept=".json" onChange={importGridState} className="hidden" />
              <Button size="sm" variant="outline" className="gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Import
                </span>
              </Button>
            </label>
            <Button onClick={addNestContainer} size="sm" variant="outline" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Add Nest
            </Button>
            <Button onClick={addWidget} size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Widget
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Zoom Toolbar */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 flex gap-1 bg-background/90 backdrop-blur-sm border border-border/50 rounded-md p-1 shadow-lg">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }))}
          title="Zoom Out"
        >
          <span className="text-sm">-</span>
        </Button>
        <div className="flex items-center px-2 text-xs text-muted-foreground min-w-[50px] justify-center">
          {Math.round(viewport.zoom * 100)}%
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.25) }))}
          title="Zoom In"
        >
          <span className="text-sm">+</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}
          title="Reset View"
        >
          <span className="text-xs">⌂</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setIsViewportInfoVisible(!isViewportInfoVisible)}
          title={isViewportInfoVisible ? "Hide Viewport Info" : "Show Viewport Info"}
        >
          {isViewportInfoVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {/* Viewport Info */}
      {isViewportInfoVisible && (
        <div className="absolute top-16 left-4 z-50 text-xs text-muted-foreground bg-background/90 px-3 py-2 rounded backdrop-blur-sm border border-border/50 shadow-lg">
          <div>Zoom: {(viewport.zoom * 100).toFixed(0)}%</div>
          <div>
            Position: ({Math.round(viewport.x)}, {Math.round(viewport.y)})
          </div>
          <div className="text-xs opacity-75 mt-1">Ctrl+Wheel: Zoom • Middle Click: Pan • Ctrl+Click: Pan</div>
        </div>
      )}

      {/* Infinite Grid Container */}
      <div
        ref={containerRef}
        className={`absolute inset-0 cursor-${isPanning ? "grabbing" : "grab"} ${
          dropState.isDragOver && !dropState.targetNestId ? "border-primary/50 bg-primary/5 border-2 border-dashed" : ""
        }`}
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: `${gridState.gridSize * viewport.zoom}px ${gridState.gridSize * viewport.zoom}px`,
          backgroundPosition: `${viewport.x * viewport.zoom}px ${viewport.y * viewport.zoom}px`,
        }}
        onMouseDown={handlePanStart}
        onDragOver={(e) => handleDragOver(e)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e)}
      >
        <div
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Nest Containers */}
          {gridState.nestContainers.map((nest) => {
            const nestWidgets = gridState.nestedWidgets.filter((w) => w.nestId === nest.id)

            return (
              <Card
                key={nest.id}
                className={`absolute group bg-muted/20 backdrop-blur border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-all duration-200 select-none ${
                  dragState.draggedId === nest.id ? "shadow-lg scale-105 z-10" : ""
                } ${resizeState.resizedId === nest.id ? "shadow-lg z-10" : ""} ${
                  dropState.isDragOver && dropState.targetNestId === nest.id ? "border-primary/50 bg-primary/10" : ""
                } ${dragOverNest === nest.id ? "border-green-500/50 bg-green-500/10 scale-102" : ""}`}
                style={{
                  left: nest.x,
                  top: nest.y,
                  width: nest.w,
                  height: nest.h,
                  cursor: dragState.draggedId === nest.id ? "grabbing" : "default",
                }}
                onDragOver={(e) => handleDragOver(e, nest.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, nest.id)}
              >
                {/* Resize Handles */}
                {getResizeHandles(nest.id, "nest")}

                <CardHeader
                  className="pb-2 cursor-grab active:cursor-grabbing bg-muted/40 border-b border-muted-foreground/20"
                  onMouseDown={(e) => handleMouseDown(e, nest.id, "nest")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid3X3 className="h-3 w-3 text-muted-foreground" />
                      <CardTitle className="text-sm font-medium">{nest.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {nest.id.split("-").pop()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="outline" className="text-xs">
                        {nestWidgets.length} widgets
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeNestContainer(nest.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-2 h-full overflow-hidden relative">
                  {/* Nested Widgets */}
                  {nestWidgets.map((widget) => (
                    <Card
                      key={widget.id}
                      className="absolute group bg-card/80 backdrop-blur border-border/50 hover:border-border transition-all duration-200 select-none"
                      style={{
                        left: widget.x,
                        top: widget.y,
                        width: widget.w,
                        height: widget.h,
                      }}
                    >
                      {/* Resize Handles */}
                      {getResizeHandles(widget.id, "widget")}

                      <CardHeader
                        className="pb-1 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleMouseDown(e, widget.id, "widget")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-2 w-2 text-muted-foreground" />
                            <CardTitle className="text-xs font-medium">{widget.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs font-mono opacity-0 group-hover:opacity-100">
                              {widget.id.split("-").pop()}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100"
                              onClick={() => removeWidget(widget.id)}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 text-xs text-center">{widget.content}</CardContent>
                    </Card>
                  ))}

                  {/* Nested AriesWidgets */}
                  {gridState.nestedAriesWidgets.filter((w) => w.nestId === nest.id).map((widget) => (
                    <div
                      key={widget.id}
                      className="absolute group select-none"
                      style={{
                        left: widget.x,
                        top: widget.y,
                        width: widget.w,
                        height: widget.h,
                      }}
                    >
                      {/* Resize Handles */}
                      {getResizeHandles(widget.id, "widget")}

                      {/* Drag Handle */}
                      <div
                        className="absolute top-0 left-0 right-0 h-6 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/20 backdrop-blur-sm rounded-t-md flex items-center justify-between px-1"
                        onMouseDown={(e) => handleMouseDown(e, widget.id, "widget")}
                      >
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-2 w-2 text-white" />
                          <span className="text-xs text-white font-medium">{widget.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 text-white hover:text-red-400"
                          onClick={() => removeAriesWidget(widget.id)}
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </div>

                      <AriesModWidget
                        widget={widget}
                        onUpdate={(updates) => updateAriesWidget(widget.id, updates)}
                        className="w-full h-full rounded-md overflow-hidden"
                      />
                    </div>
                  ))}

                  {/* Empty nest state */}
                  {nestWidgets.length === 0 && (
                    <div className="absolute inset-4 flex items-center justify-center text-center border-2 border-dashed border-muted-foreground/20 rounded">
                      <p className="text-xs text-muted-foreground">Drop widgets here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {/* Main Grid Widgets */}
          {gridState.mainWidgets.map((widget) => (
            <Card
              key={widget.id}
              className={`absolute group bg-card/80 backdrop-blur border-border/50 hover:border-border transition-all duration-200 select-none ${
                dragState.draggedId === widget.id ? "shadow-lg scale-105 z-10" : ""
              } ${resizeState.resizedId === widget.id ? "shadow-lg z-10" : ""}`}
              style={{
                left: widget.x,
                top: widget.y,
                width: widget.w,
                height: widget.h,
                cursor: dragState.draggedId === widget.id ? "grabbing" : "default",
              }}
            >
              {/* Resize Handles */}
              {getResizeHandles(widget.id, "widget")}

              <CardHeader
                className="pb-2 cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => handleMouseDown(e, widget.id, "widget")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs font-mono opacity-0 group-hover:opacity-100">
                      {widget.id.split("-").pop()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => dispatch({ type: "SET_MODAL", payload: "widget-config" })}
                    >
                      <Hash className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => dispatch({ type: "SET_MODAL", payload: "widget-config" })}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeWidget(widget.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 h-full overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {widget.type}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {widget.w}×{widget.h}
                  </div>
                </div>
                <div className="text-lg font-mono text-center">{widget.content}</div>
              </CardContent>
            </Card>
          ))}

          {/* Main Grid AriesWidgets */}
          {gridState.mainAriesWidgets.map((widget) => (
            <div
              key={widget.id}
              className={`absolute group select-none ${
                dragState.draggedId === widget.id ? "shadow-lg scale-105 z-10" : ""
              } ${resizeState.resizedId === widget.id ? "shadow-lg z-10" : ""}`}
              style={{
                left: widget.x,
                top: widget.y,
                width: widget.w,
                height: widget.h,
                cursor: dragState.draggedId === widget.id ? "grabbing" : "default",
              }}
            >
              {/* Resize Handles */}
              {getResizeHandles(widget.id, "widget")}

              {/* Drag Handle */}
              <div
                className="absolute top-0 left-0 right-0 h-8 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/20 backdrop-blur-sm rounded-t-md flex items-center justify-between px-2"
                onMouseDown={(e) => handleMouseDown(e, widget.id, "widget")}
              >
                <div className="flex items-center gap-1">
                  <GripVertical className="h-3 w-3 text-white" />
                  <span className="text-xs text-white font-medium">{widget.title}</span>
        </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-white hover:text-red-400"
                  onClick={() => removeAriesWidget(widget.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <AriesModWidget
                widget={widget}
                onUpdate={(updates) => updateAriesWidget(widget.id, updates)}
                className="w-full h-full rounded-md overflow-hidden"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
