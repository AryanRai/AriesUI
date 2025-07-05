"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Settings, Hash, GripVertical, Grid3X3, Save, Download, Upload, Eye, EyeOff, Clock, Terminal } from "lucide-react"
import { useComms } from "@/components/comms-context"
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"
import { AriesModWidget } from "@/components/widgets/ariesmod-widget"
import type { AriesWidget, NestedAriesWidget } from "@/types/ariesmods"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { FloatingToolbar } from "@/components/floating-toolbar-merged"

// Import enhanced hardware components
import { EnhancedSensorWidget } from "@/components/widgets/enhanced-sensor-widget"
import { HardwareAcceleratedWidget } from "@/components/widgets/hardware-accelerated-widget"
import { commsClient } from "@/lib/comms-stream-client"

// Import new grid components
import { GridWidget } from "@/components/grid/GridWidget"
import { ResizeHandles } from "@/components/grid/ResizeHandles"
import { NestContainer } from "@/components/grid/NestContainer"
import { useGridEvents } from "@/components/grid/useGridEvents"
import { useGridState } from "@/components/grid/useGridState"
import { 
  generateUniqueId, 
  checkCollision, 
  applyPushPhysics, 
  findNonCollidingPosition,
  calculateNestAutoSize 
} from "@/components/grid/utils"
import type { 
  BaseWidget, 
  MainGridWidget, 
  NestedWidget, 
  NestContainer as NestContainerType, 
  GridState as GridStateType, 
  ResizeHandle 
} from "@/components/grid/types"

interface MainContentProps {
  gridState: GridStateType
  setGridState: React.Dispatch<React.SetStateAction<GridStateType>>
}

// Utility functions are now imported from grid/utils

/**
 * MainContent component - The main grid dashboard with drag-and-drop functionality
 * 
 * This component provides:
 * - Grid-based widget layout with drag & drop
 * - Nested containers for organizing widgets
 * - Zoom and pan viewport controls
 * - Resize handles for widgets and nests
 * - Push physics for collision handling
 * - Auto-save functionality
 * - Undo/redo history
 * 
 * @param gridState - Current grid state containing widgets and nests
 * @param setGridState - Function to update the grid state
 */
export function MainContent({ gridState, setGridState }: MainContentProps) {
  const { 
    state,
    dispatch, 
    loadProfile, 
    updateProfiles 
  } = useComms()
  const { profiles, activeProfile } = state;
  const { animationsEnabled } = useAnimationPreferences()

  // Viewport state for infinite scrolling
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    zoom: 1,
  })

  // Nested widgets are initialized empty - widgets can be dragged into nests

  const containerRef = useRef<HTMLDivElement>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // State management for drag, resize, and drop operations
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

  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [dragOverNest, setDragOverNest] = useState<string | null>(null)
  const [pushedWidgets, setPushedWidgets] = useState<Set<string>>(new Set())
  const [isHoveringOverNest, setIsHoveringOverNest] = useState(false)

  const [isViewportInfoVisible, setIsViewportInfoVisible] = useLocalStorage("aries-show-viewport-info", true)
  const [actionsToolbarPosition, setActionsToolbarPosition] = useLocalStorage("aries-actions-toolbar-pos", { top: 80, right: 20 })
  const [zoomToolbarPosition, setZoomToolbarPosition] = useLocalStorage("aries-zoom-toolbar-pos", { top: 80, left: 200 })
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false)
  const [isDraggingZoomToolbar, setIsDraggingZoomToolbar] = useState(false)
  const [toolbarDragStart, setToolbarDragStart] = useState({ x: 0, y: 0, top: 0, right: 0 })
  const [zoomToolbarDragStart, setZoomToolbarDragStart] = useState({ x: 0, y: 0, top: 0, left: 0 })
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useLocalStorage("aries-auto-save-enabled", true)
  const [autoSaveInterval, setAutoSaveInterval] = useLocalStorage("aries-auto-save-interval", 30000) // 30 seconds default
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useLocalStorage("aries-show-debug-panel", true)
  const [hardwareConnectionStatus, setHardwareConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  
  // Track if grid state has been initialized to avoid triggering unsaved changes on initial load
  const isGridStateInitialized = useRef(false)
  
  // State history for undo/redo functionality
  const [stateHistory, setStateHistory] = useState<Array<{ gridState: GridStateType; viewport: { x: number; y: number; zoom: number } }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const maxHistorySize = 50

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

  const handleZoomToolbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingZoomToolbar(true)
    
    setZoomToolbarDragStart({
      x: e.clientX,
      y: e.clientY,
      top: zoomToolbarPosition.top,
      left: zoomToolbarPosition.left,
    })
  }

  // Save state to history for undo/redo
  const saveStateToHistory = useCallback((gridState: GridStateType, viewport: { x: number; y: number; zoom: number }) => {
    setStateHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), { gridState, viewport }]
      // Keep only the last maxHistorySize items
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
      }
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1))
  }, [historyIndex, maxHistorySize])

  // Save grid state to localStorage and current profile
  const saveGridState = useCallback(async (isAutoSave = false) => {
    try {
      if (isAutoSave) {
        setAutoSaveStatus('saving')
        console.log('Starting auto-save...', { gridState, viewport })
      }
      
      const stateToSave = {
        ...gridState,
        viewport,
        lastSaved: new Date().toISOString(),
        autoSaveEnabled: isAutoSaveEnabled,
        autoSaveInterval: autoSaveInterval,
      }
      
      // Force save to localStorage with validation
      const stateString = JSON.stringify(stateToSave)
      
      // Check localStorage quota before saving
      try {
        const testKey = 'comms-grid-state-test'
        localStorage.setItem(testKey, stateString)
        localStorage.removeItem(testKey)
      } catch (quotaError) {
        console.error('localStorage quota exceeded:', quotaError)
        throw new Error('Storage quota exceeded. Please clear some browser data.')
      }
      
      localStorage.setItem("comms-grid-state", stateString)
      
      // Verify the save was successful
      const savedState = localStorage.getItem("comms-grid-state")
      if (!savedState || savedState !== stateString) {
        throw new Error("Failed to verify localStorage save")
      }
      
      // Also save to the current active profile if it exists
      if (state.activeProfile && state.profiles[state.activeProfile]) {
        const updatedProfiles = { ...state.profiles, [state.activeProfile]: stateToSave }
        updateProfiles(updatedProfiles)
        if (!isAutoSave) {
          dispatch({ type: "ADD_LOG", payload: `Grid state saved to profile "${state.activeProfile}"` })
        }
      } else {
        if (!isAutoSave) {
          dispatch({ type: "ADD_LOG", payload: "Grid state saved to localStorage" })
        }
      }
      
      setHasUnsavedChanges(false)
      
      if (isAutoSave) {
        setAutoSaveStatus('saved')
        setLastAutoSave(new Date().toLocaleTimeString())
        console.log('Auto-save completed successfully at', new Date().toLocaleTimeString())
        // Reset status after 2 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
      } else {
        console.log('Manual save completed successfully')
      }
    } catch (error) {
      console.error("Failed to save grid state:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (isAutoSave) {
        setAutoSaveStatus('error')
        setTimeout(() => setAutoSaveStatus('idle'), 3000)
      } else {
        dispatch({ type: "ADD_LOG", payload: `Failed to save grid state: ${errorMessage}` })
      }
      throw error // Re-throw to trigger retry logic
    }
  }, [gridState, viewport, dispatch, state.activeProfile, state.profiles, updateProfiles, isAutoSaveEnabled, autoSaveInterval])

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

  // Update grid state helper
  const updateGridState = useCallback((updater: (prev: GridStateType) => GridStateType) => {
    setGridState((prev) => {
      const newState = updater(prev)
      return newState
    })
  }, [])

  // Undo last action
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      const historyItem = stateHistory[newIndex]
      if (historyItem) {
        setGridState(historyItem.gridState)
        setViewport(historyItem.viewport)
        setHistoryIndex(newIndex)
        setHasUnsavedChanges(true)
        dispatch({ type: "ADD_LOG", payload: "Undo: Reverted to previous state" })
      }
    }
  }, [historyIndex, stateHistory, dispatch])

  // Redo last undone action
  const redo = useCallback(() => {
    if (historyIndex < stateHistory.length - 1) {
      const newIndex = historyIndex + 1
      const historyItem = stateHistory[newIndex]
      if (historyItem) {
        setGridState(historyItem.gridState)
        setViewport(historyItem.viewport)
        setHistoryIndex(newIndex)
        setHasUnsavedChanges(true)
        dispatch({ type: "ADD_LOG", payload: "Redo: Restored next state" })
      }
    }
  }, [historyIndex, stateHistory, dispatch])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z for undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      // Ctrl+Y or Ctrl+Shift+Z for redo
      else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
      // Ctrl+S for save
      else if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        saveGridState(false)
      }
      // Ctrl+E for export
      else if (e.ctrlKey && e.key === 'e') {
        e.preventDefault()
        exportGridState()
      }
      // Ctrl+I to toggle viewport info
      else if (e.ctrlKey && e.key === 'i') {
        e.preventDefault()
        setIsViewportInfoVisible(prev => !prev)
      }
      // Ctrl+D to toggle debug panel
      else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        setIsDebugPanelVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, saveGridState, exportGridState, setIsViewportInfoVisible, setIsDebugPanelVisible])

  // Handle toolbar dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingToolbar) {
        const deltaX = e.clientX - toolbarDragStart.x
        const deltaY = e.clientY - toolbarDragStart.y
        
        setActionsToolbarPosition({
          top: Math.max(0, Math.min(window.innerHeight - 100, toolbarDragStart.top + deltaY)),
          right: Math.max(0, Math.min(window.innerWidth - 100, toolbarDragStart.right - deltaX)),
        })
      }
      
      if (isDraggingZoomToolbar) {
        const deltaX = e.clientX - zoomToolbarDragStart.x
        const deltaY = e.clientY - zoomToolbarDragStart.y
        
        setZoomToolbarPosition({
          top: Math.max(0, Math.min(window.innerHeight - 50, zoomToolbarDragStart.top + deltaY)),
          left: Math.max(0, Math.min(window.innerWidth - 200, zoomToolbarDragStart.left + deltaX)),
        })
      }
    }

    const handleMouseUp = () => {
      setIsDraggingToolbar(false)
      setIsDraggingZoomToolbar(false)
    }

    if (isDraggingToolbar || isDraggingZoomToolbar) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingToolbar, isDraggingZoomToolbar, toolbarDragStart, zoomToolbarDragStart, setActionsToolbarPosition, setZoomToolbarPosition])

  // Track unsaved changes
  useEffect(() => {
    // Only set unsaved changes if the grid state has been initialized
    // This prevents triggering unsaved changes on initial load
    if (isGridStateInitialized.current) {
      setHasUnsavedChanges(true)
      console.log('Grid state changed, marking as unsaved')
    }
  }, [gridState])

  // Also track viewport changes as unsaved changes
  useEffect(() => {
    if (isGridStateInitialized.current) {
      setHasUnsavedChanges(true)
      console.log('Viewport changed, marking as unsaved')
    }
  }, [viewport])

  // Save state to history when grid state changes (but not on initial load)
  useEffect(() => {
    if (isGridStateInitialized.current) {
      // Debounce the history save to avoid saving too frequently
      const timeoutId = setTimeout(() => {
        saveStateToHistory(gridState, viewport)
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [gridState, viewport, saveStateToHistory])

  // Mark grid state as initialized after first load
  useEffect(() => {
    isGridStateInitialized.current = true
  }, [])

  // Load grid state from localStorage
  const loadGridState = useCallback(() => {
    try {
      const savedState = localStorage.getItem("comms-grid-state")
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        setGridState(parsedState)
        setViewport(parsedState.viewport || { x: 0, y: 0, zoom: 1 })
        setHasUnsavedChanges(false)
        
        // Initialize history with the loaded state
        const initialHistory = [{ gridState: parsedState, viewport: parsedState.viewport || { x: 0, y: 0, zoom: 1 } }]
        setStateHistory(initialHistory)
        setHistoryIndex(0)
        
        dispatch({ type: "ADD_LOG", payload: "Grid state loaded successfully" })
      }
    } catch (error) {
      console.error("Failed to load grid state:", error)
      dispatch({ type: "ADD_LOG", payload: "Failed to load grid state" })
    }
  }, [dispatch])

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
          
          // Save imported state to history
          const importedHistory = [{ gridState: importedState, viewport: importedState.viewport || { x: 0, y: 0, zoom: 1 } }]
          setStateHistory(importedHistory)
          setHistoryIndex(0)
          
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

  // Auto-save with enhanced reliability and better error handling
  useEffect(() => {
    if (!isAutoSaveEnabled) {
      setAutoSaveStatus('idle')
      return
    }

    let interval: NodeJS.Timeout | null = null
    let retryCount = 0
    const maxRetries = 3

    const performAutoSave = async () => {
      // Enhanced logging for debugging
      console.log(`Auto-save check: hasUnsavedChanges=${hasUnsavedChanges}, isAutoSaveEnabled=${isAutoSaveEnabled}`)
      
      if (hasUnsavedChanges && isAutoSaveEnabled) {
        try {
          console.log('Performing auto-save...', { gridState, viewport })
          await saveGridState(true)
          retryCount = 0 // Reset retry count on success
          console.log('Auto-save completed successfully')
        } catch (error) {
          retryCount++
          console.warn(`Auto-save failed (attempt ${retryCount}/${maxRetries}):`, error)
          
          if (retryCount >= maxRetries) {
            setAutoSaveStatus('error')
            setIsAutoSaveEnabled(false) // Disable auto-save after max retries
            dispatch({ type: "ADD_LOG", payload: "Auto-save disabled due to repeated failures" })
            return
          }
          
          // Retry with exponential backoff
          setTimeout(() => {
            if (hasUnsavedChanges && isAutoSaveEnabled) {
              performAutoSave()
            }
          }, Math.pow(2, retryCount) * 1000)
        }
      } else {
        console.log('Auto-save skipped: no unsaved changes or auto-save disabled')
      }
    }

    // Perform initial auto-save after a short delay if there are unsaved changes
    if (hasUnsavedChanges) {
      setTimeout(performAutoSave, 1000)
    }

    interval = setInterval(performAutoSave, autoSaveInterval)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [hasUnsavedChanges, saveGridState, isAutoSaveEnabled, autoSaveInterval, dispatch, gridState, viewport])

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

  // Initialize hardware connection
  useEffect(() => {
    const handleConnectionChange = (connected: boolean) => {
      setHardwareConnectionStatus(commsClient.status)
    }

    commsClient.onConnection(handleConnectionChange)
    
    // Auto-connect to hardware backend
    commsClient.connect().then(success => {
      if (success) {
        dispatch({ type: "ADD_LOG", payload: "✅ Connected to Comms StreamHandler" })
      } else {
        dispatch({ type: "ADD_LOG", payload: "❌ Failed to connect to Comms StreamHandler" })
      }
    })

    return () => {
      commsClient.offConnection(handleConnectionChange)
    }
  }, [dispatch])

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

  /**
   * Handle mouse down for dragging widgets and nests
   * @param e - Mouse event
   * @param itemId - ID of the item being dragged
   * @param itemType - Type of item ("widget" or "nest")
   */
  const handleMouseDown = (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => {
    const target = e.target as HTMLElement
    if (target.closest(".resize-handle")) return

    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    // Determine source container
    let sourceContainer: "main" | "nest" = "main"
    let sourceNestId: string | undefined

    if (itemType === "widget") {
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

    // Calculate offset in world coordinates
    const worldMouseX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
    const worldMouseY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y
    
    // Get the item's current position
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

    setDragState({
      isDragging: true,
      draggedId: itemId,
      draggedType: itemType,
      sourceContainer,
      sourceNestId,
      offset: {
        x: worldMouseX - item.x,
        y: worldMouseY - item.y,
      },
    })
  }

  /**
   * Handle panning start with middle mouse or Ctrl+click
   * @param e - Mouse event
   */
  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }

  // Handle wheel zoom with improved trackpad support
  const handleWheel = useCallback((e: WheelEvent) => {
    // If hovering over a nest, do not handle wheel events on main grid
    if (isHoveringOverNest) {
      return
    }

    if (e.ctrlKey) {
      e.preventDefault()
      
      // Improved zoom handling for trackpad vs mouse wheel
      let zoomDelta: number
      if (Math.abs(e.deltaY) < 50) {
        // Likely trackpad - smaller, more granular steps
        zoomDelta = e.deltaY > 0 ? 0.95 : 1.05
      } else {
        // Likely mouse wheel - larger steps
        zoomDelta = e.deltaY > 0 ? 0.85 : 1.15
      }
      
      setViewport((prev) => ({
        ...prev,
        zoom: Math.max(0.1, Math.min(3, prev.zoom * zoomDelta)),
      }))
    } else {
      // Scroll to pan
      setViewport((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }))
    }
  }, [isHoveringOverNest])

  /**
   * Handle resize mouse down for widgets and nests
   * @param e - Mouse event
   * @param itemId - ID of the item being resized
   * @param itemType - Type of item ("widget" or "nest")
   * @param handle - Resize handle being used
   */
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

    // Set proper cursor based on handle
    const cursorMap: Record<ResizeHandle, string> = {
      'nw': 'nw-resize',
      'n': 'n-resize',
      'ne': 'ne-resize',
      'e': 'e-resize',
      'se': 'se-resize',
      's': 's-resize',
      'sw': 'sw-resize',
      'w': 'w-resize'
    }
    document.body.style.cursor = cursorMap[handle]

    // Convert to world coordinates
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    const worldMouseX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
    const worldMouseY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y

    setResizeState({
      isResizing: true,
      resizedId: itemId,
      resizedType: itemType,
      handle,
      startPos: { x: worldMouseX, y: worldMouseY },
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
        // Dropping into nest with auto-accommodation
        const nest = gridState.nestContainers.find((n) => n.id === targetNestId)
        if (!nest) return

        // Don't constrain to nest bounds - allow overflow for scrollable content
        const rawX = worldX - nest.x - template.defaultSize.w / 2
        const rawY = worldY - nest.y - 40 - template.defaultSize.h / 2

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

          // Apply push physics without container bounds for overflow support
          const existingNestAriesWidgets = gridState.nestedAriesWidgets.filter((w) => w.nestId === targetNestId)
          const pushedAriesWidgets = applyPushPhysics(newAriesWidget, existingNestAriesWidgets, gridSize)

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

        // Apply push physics without container bounds for overflow support
        const existingNestWidgets = gridState.nestedWidgets.filter((w) => w.nestId === targetNestId)
        const pushedWidgets = applyPushPhysics(newWidget, existingNestWidgets, gridSize)

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
        // Dropping into main grid - remove boundary constraints
        const rawX = worldX - template.defaultSize.w / 2
        const rawY = worldY - template.defaultSize.h / 2

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

  // Hardware-accelerated mouse movement with RequestAnimationFrame
  const [lastMouseMoveTime, setLastMouseMoveTime] = useState(0)
  const throttleInterval = 4 // 4ms throttle for ultra-responsive dragging (240fps)
  const rafRef = useRef<number | null>(null)
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      // Skip throttling for nest dragging - instant response
      if (dragState.draggedType !== "nest" && now - lastMouseMoveTime < throttleInterval) {
        return // Skip this frame to maintain performance for widgets only
      }
      setLastMouseMoveTime(now)
      
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

      // Handle zoom toolbar dragging
      if (isDraggingZoomToolbar) {
        const deltaX = e.clientX - zoomToolbarDragStart.x
        const deltaY = e.clientY - zoomToolbarDragStart.y
        
        const newTop = zoomToolbarDragStart.top + deltaY
        const newLeft = zoomToolbarDragStart.left + deltaX

        setZoomToolbarPosition({
          top: Math.max(16, Math.min(newTop, window.innerHeight - 60)),
          left: Math.max(20, Math.min(newLeft, window.innerWidth - 300)),
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
        // SMOOTH DRAGGING: Use raw coordinates during drag - NO GRID SNAPPING
        const rawX = worldX - dragState.offset.x
        const rawY = worldY - dragState.offset.y
        // Store both raw (smooth) and snapped positions
        const smoothX = rawX  // No grid snapping during drag
        const smoothY = rawY  // No grid snapping during drag
        const snapX = Math.round(rawX / gridSize) * gridSize  // For drop positioning
        const snapY = Math.round(rawY / gridSize) * gridSize  // For drop positioning

        // Hardware-accelerated nest movement - direct update with RAF
        if (dragState.draggedType === "nest") {
          // Cancel previous RAF to prevent stacking
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current)
          }
          
          // Schedule update for next frame
          rafRef.current = requestAnimationFrame(() => {
          updateGridState((prev) => ({
            ...prev,
            nestContainers: prev.nestContainers.map((nest) => 
              nest.id === dragState.draggedId 
                ? { ...nest, x: smoothX, y: smoothY, updatedAt: new Date().toISOString() }
                : nest
            ),
          }))
          })
          return // Early return to avoid any other processing
        }

        // Get the dragged widget for push physics
        let draggedWidget: any = null

        if (dragState.draggedType === "widget") {
          if (dragState.sourceContainer === "main") {
            // Check both regular widgets and AriesWidgets
            draggedWidget = gridState.mainWidgets.find((w) => w.id === dragState.draggedId) ||
                           gridState.mainAriesWidgets.find((w) => w.id === dragState.draggedId)
            
            if (draggedWidget) {
              // Check if dragging over a nest FIRST to disable push physics
              let hoverNest: string | null = null
              const widgetCenterX = smoothX + 100
              const widgetCenterY = smoothY + 75

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
              
              // If hovering over a nest, disable push physics and use smooth movement
              if (hoverNest) {
                updateGridState((prev) => ({
                  ...prev,
                  mainWidgets: prev.mainWidgets.map((widget) =>
                    widget.id === dragState.draggedId
                      ? { ...widget, x: smoothX, y: smoothY, updatedAt: new Date().toISOString() }
                      : widget
                  ),
                  mainAriesWidgets: prev.mainAriesWidgets.map((widget) =>
                    widget.id === dragState.draggedId
                      ? { ...widget, x: smoothX, y: smoothY, updatedAt: new Date().toISOString() }
                      : widget
                  ),
                }))
                return // Skip push physics entirely when hovering over a nest
              }

              // Use smooth coordinates for fluid dragging - create smooth drag rect
              const draggedRect = { ...draggedWidget, x: smoothX, y: smoothY }

              // Apply push physics to other main widgets and AriesWidgets
              const otherMainWidgets = gridState.mainWidgets.filter((w) => w.id !== dragState.draggedId)
              const otherMainAriesWidgets = gridState.mainAriesWidgets.filter((w) => w.id !== dragState.draggedId)
              const pushedMainWidgets = applyPushPhysics(draggedRect, otherMainWidgets, gridSize)
              const pushedMainAriesWidgets = applyPushPhysics(draggedRect, otherMainAriesWidgets, gridSize)

              // Apply push physics to nest containers
              const pushedNests = applyPushPhysics(draggedRect, gridState.nestContainers, gridSize)

              // Track pushed widgets for animations
              const newPushedWidgets = new Set<string>()
              pushedMainWidgets.forEach(w => w.pushed && newPushedWidgets.add(w.id))
              pushedMainAriesWidgets.forEach(w => w.pushed && newPushedWidgets.add(w.id))
              pushedNests.forEach(n => n.pushed && newPushedWidgets.add(n.id))
              setPushedWidgets(newPushedWidgets)

              // Clear pushed widgets after animation
              setTimeout(() => setPushedWidgets(new Set()), 200)

              // Update state with smooth coordinates for dragged widget and pushed widgets
              updateGridState((prev) => ({
                ...prev,
                mainWidgets: prev.mainWidgets.map((widget) => {
                  if (widget.id === dragState.draggedId) {
                    return { ...widget, x: smoothX, y: smoothY, updatedAt: new Date().toISOString() }
                  }
                  const pushedWidget = pushedMainWidgets.find((p) => p.id === widget.id)
                  if (pushedWidget && pushedWidget.pushed) {
                    return { ...widget, x: pushedWidget.x, y: pushedWidget.y, updatedAt: new Date().toISOString() }
                  }
                  return widget
                }),
                mainAriesWidgets: prev.mainAriesWidgets.map((widget) => {
                  if (widget.id === dragState.draggedId) {
                    return { ...widget, x: smoothX, y: smoothY, updatedAt: new Date().toISOString() }
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
              // Use smooth coordinates for fluid dragging within nests
              const relativeX = smoothX - nest.x
              const relativeY = smoothY - nest.y - 40

              // Check both regular nested widgets and AriesWidgets
              draggedWidget = gridState.nestedWidgets.find((w) => w.id === dragState.draggedId) ||
                             gridState.nestedAriesWidgets.find((w) => w.id === dragState.draggedId)
              
              if (draggedWidget) {
                const draggedRect = { ...draggedWidget, x: relativeX, y: relativeY }

                // Apply push physics to other widgets in the same nest - no container bounds for overflow support
                const otherNestedWidgets = gridState.nestedWidgets.filter(
                  (w) => w.id !== dragState.draggedId && w.nestId === dragState.sourceNestId,
                )
                const otherNestedAriesWidgets = gridState.nestedAriesWidgets.filter(
                  (w) => w.id !== dragState.draggedId && w.nestId === dragState.sourceNestId,
                )

                // Remove container bounds to allow overflow and scrolling
                const pushedNestedWidgets = applyPushPhysics(draggedRect, otherNestedWidgets, gridSize)
                const pushedNestedAriesWidgets = applyPushPhysics(draggedRect, otherNestedAriesWidgets, gridSize)

                // Track pushed widgets for animations
                const newPushedWidgets = new Set<string>()
                pushedNestedWidgets.forEach(w => w.pushed && newPushedWidgets.add(w.id))
                pushedNestedAriesWidgets.forEach(w => w.pushed && newPushedWidgets.add(w.id))
                setPushedWidgets(newPushedWidgets)

                // Clear pushed widgets after animation
                setTimeout(() => setPushedWidgets(new Set()), 200)

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
        }
      }

      // Handle resizing with throttling
      if (resizeState.isResizing && resizeState.resizedId) {
        const deltaX = worldX - resizeState.startPos.x
        const deltaY = worldY - resizeState.startPos.y
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
            x: newX, // Remove Math.max(0, newX) to allow negative coordinates
            y: newY, // Remove Math.max(0, newY) to allow negative coordinates  
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
      // Reset cursor to default to fix resize cursor bug
      document.body.style.cursor = 'default'
      
      // AUTO-SNAP: Snap widgets to nearest grid on release for clean positioning
      if (dragState.isDragging && dragState.draggedId) {
        const gridSize = gridState.gridSize
        
        // Get current widget position (smooth coordinates)
        let currentWidget: any = null
        if (dragState.draggedType === "widget") {
          if (dragState.sourceContainer === "main") {
            currentWidget = gridState.mainWidgets.find((w) => w.id === dragState.draggedId) ||
                           gridState.mainAriesWidgets.find((w) => w.id === dragState.draggedId)
          } else {
            currentWidget = gridState.nestedWidgets.find((w) => w.id === dragState.draggedId) ||
                           gridState.nestedAriesWidgets.find((w) => w.id === dragState.draggedId)
          }
        } else if (dragState.draggedType === "nest") {
          currentWidget = gridState.nestContainers.find((n) => n.id === dragState.draggedId)
        }

        if (currentWidget) {
          // Snap to nearest grid position
          const snappedX = Math.round(currentWidget.x / gridSize) * gridSize
          const snappedY = Math.round(currentWidget.y / gridSize) * gridSize

          // Apply snap to grid for clean final positioning
          if (dragState.draggedType === "nest") {
            updateGridState((prev) => ({
              ...prev,
              nestContainers: prev.nestContainers.map((nest) => 
                nest.id === dragState.draggedId 
                  ? { ...nest, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
                  : nest
              ),
            }))
          } else if (dragState.draggedType === "widget") {
            if (dragState.sourceContainer === "main") {
              updateGridState((prev) => ({
                ...prev,
                mainWidgets: prev.mainWidgets.map((widget) =>
                  widget.id === dragState.draggedId
                    ? { ...widget, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
                    : widget
                ),
                mainAriesWidgets: prev.mainAriesWidgets.map((widget) =>
                  widget.id === dragState.draggedId
                    ? { ...widget, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
                    : widget
                ),
              }))
            } else if (dragState.sourceContainer === "nest") {
              updateGridState((prev) => ({
                ...prev,
                nestedWidgets: prev.nestedWidgets.map((widget) =>
                  widget.id === dragState.draggedId
                    ? { ...widget, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
                    : widget
                ),
                nestedAriesWidgets: prev.nestedAriesWidgets.map((widget) =>
                  widget.id === dragState.draggedId
                    ? { ...widget, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
                    : widget
                ),
              }))
            }
          }
        }
      }
      
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
        let targetNest: NestContainerType | null = null
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
            // Allow widgets to be placed anywhere in nest, including negative positions for overflow
            const relativeX = widget.x - targetNest.x
            const relativeY = widget.y - targetNest.y - 40

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
            // Allow AriesWidgets to be placed anywhere in nest, including negative positions for overflow
            const relativeX = ariesWidget.x - targetNest.x
            const relativeY = ariesWidget.y - targetNest.y - 40

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
      setIsDraggingZoomToolbar(false)
    }

    if (dragState.isDragging || resizeState.isResizing || isPanning || isDraggingToolbar || isDraggingZoomToolbar) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      // Cleanup RAF on unmount
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [dragState, resizeState, isPanning, lastPanPoint, viewport, gridState, updateGridState, dispatch, isDraggingToolbar, isDraggingZoomToolbar, toolbarDragStart, zoomToolbarDragStart, setActionsToolbarPosition, setZoomToolbarPosition, lastMouseMoveTime, throttleInterval])

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
      type: "enhanced-sensor",
      title: "Enhanced Sensor",
      content: "Hardware-integrated sensor",
      x: nonCollidingPos.x,
      y: nonCollidingPos.y,
      w: 250,
      h: 180,
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

    const newNest: NestContainerType = {
      id: generateUniqueId("nest"),
      type: "nest",
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

  // Resize handles component - using new ResizeHandles component
  const getResizeHandles = useCallback((itemId: string, itemType: "widget" | "nest") => {
    return (
      <ResizeHandles
        itemId={itemId}
        itemType={itemType}
        onResizeMouseDown={handleResizeMouseDown}
      />
    )
  }, [handleResizeMouseDown])

  // Update widget count and broadcast to status bar
  useEffect(() => {
    const totalWidgets = gridState.mainWidgets.length + gridState.nestedWidgets.length + 
                        gridState.mainAriesWidgets.length + gridState.nestedAriesWidgets.length
    window.dispatchEvent(new CustomEvent("widgetCountUpdate", { detail: { count: totalWidgets } }))
  }, [gridState.mainWidgets.length, gridState.nestedWidgets.length, gridState.mainAriesWidgets.length, gridState.nestedAriesWidgets.length])

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-background to-background/80">
      
      {/* Enhanced Performance Debug Panel */}
      {isDebugPanelVisible && (
        <div className="absolute top-4 left-4 z-50 bg-black/90 text-green-400 p-3 rounded font-mono text-xs border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-300 font-bold">⚡ HARDWARE ACCELERATION ACTIVE</span>
            <Button
              onClick={() => setIsDebugPanelVisible(false)}
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0 text-red-400 hover:text-red-300"
              title="Hide debug panel (Ctrl+D)"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div>Viewport: {viewport.x.toFixed(0)}, {viewport.y.toFixed(0)}, {(viewport.zoom * 100).toFixed(0)}%</div>
          <div>Widgets: {gridState.mainWidgets.length} | Nests: {gridState.nestContainers.length}</div>
          <div>AriesWidgets: {gridState.mainAriesWidgets.length}</div>
          <div>Enhanced Sensors: {gridState.mainWidgets.filter(w => w.type === 'enhanced-sensor').length}</div>
          <div>Status: {dragState.isDragging ? 'DRAGGING' : isPanning ? 'PANNING' : 'READY'}</div>
          <div className="text-cyan-400 mt-1">GPU Layers: ENABLED | RAF: ACTIVE</div>
          <div className={`${hardwareConnectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
            Hardware: {hardwareConnectionStatus.toUpperCase()}
          </div>
          <div>Auto-save: {isAutoSaveEnabled ? 'ON' : 'OFF'} | Unsaved: {hasUnsavedChanges ? 'YES' : 'NO'}</div>
        </div>
      )}
      
      {/* Debug Panel Toggle Button (when hidden) */}
      {!isDebugPanelVisible && (
        <Button
          onClick={() => setIsDebugPanelVisible(true)}
          size="sm"
          variant="ghost"
          className="absolute top-4 left-4 z-50 h-6 w-6 p-0 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50"
          title="Show debug panel (Ctrl+D)"
        >
          <Terminal className="h-3 w-3 text-red-400" />
        </Button>
      )}
      
      {/* Unified Floating Toolbar */}
      <FloatingToolbar
        gridState={gridState}
        viewport={viewport}
        hasUnsavedChanges={hasUnsavedChanges}
        isAutoSaveEnabled={isAutoSaveEnabled}
        setIsAutoSaveEnabled={setIsAutoSaveEnabled}
        autoSaveInterval={autoSaveInterval}
        setAutoSaveInterval={setAutoSaveInterval}
        autoSaveStatus={autoSaveStatus}
        lastAutoSave={lastAutoSave}
        historyIndex={historyIndex}
        stateHistory={stateHistory}
        saveGridState={saveGridState}
        exportGridState={exportGridState}
        importGridState={importGridState}
        undo={undo}
        redo={redo}
        addWidget={addWidget}
        addNestContainer={addNestContainer}
        setIsDebugPanelVisible={setIsDebugPanelVisible}
        isDebugPanelVisible={isDebugPanelVisible}
      />
      


      {/* Zoom Toolbar */}
      <div 
        className="absolute z-50 flex gap-1 bg-background/90 backdrop-blur-sm border border-border/50 rounded-md p-1 shadow-lg"
        style={{
          top: zoomToolbarPosition.top,
          left: zoomToolbarPosition.left,
        }}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center w-4 cursor-grab active:cursor-grabbing hover:bg-muted/50 rounded-sm transition-colors"
          onMouseDown={handleZoomToolbarMouseDown}
          title="Drag to move zoom toolbar"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
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
          {dragState.isDragging && (
            <div className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              Smooth Drag: {dragState.draggedType === "nest" ? "Nest" : "Widget"}
            </div>
          )}
          <div className="text-xs opacity-75 mt-1">Ctrl+Wheel: Zoom • Middle Click: Pan • Ctrl+Click: Pan</div>
        </div>
      )}

      {/* Hardware-Accelerated Grid Container */}
      <div
        ref={containerRef}
        className={`absolute inset-0 cursor-${isPanning ? "grabbing" : "grab"} ${
          dropState.isDragOver && !dropState.targetNestId ? "border-primary/50 bg-primary/5 border-2 border-dashed" : ""
        } ${
          dragState.isDragging ? "aries-grid-smooth-drag" : ""
        }`}
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: `${gridState.gridSize * viewport.zoom}px ${gridState.gridSize * viewport.zoom}px`,
          backgroundPosition: `${viewport.x * viewport.zoom}px ${viewport.y * viewport.zoom}px`,
          willChange: 'transform, background-position',
          transform: 'translate3d(0, 0, 0)', // Force hardware layer
        }}
        onMouseDown={handlePanStart}
        onDragOver={(e) => handleDragOver(e)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e)}
      >
        {/* Hardware-Accelerated Viewport Transform Container */}
        <div
          className={dragState.isDragging || resizeState.isResizing ? "aries-grid-faded" : ""}
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
            position: "relative",
            willChange: 'transform',
          }}
        >
          {/* Nest Containers */}
          {gridState.nestContainers.map((nest) => (
            <NestContainer
                key={nest.id}
              nest={nest}
              nestedWidgets={gridState.nestedWidgets}
              nestedAriesWidgets={gridState.nestedAriesWidgets}
              isDragging={dragState.draggedId === nest.id}
              isResizing={resizeState.resizedId === nest.id}
              dragOverNest={dragOverNest}
              dropState={dropState}
              pushedWidgets={pushedWidgets}
              dragState={dragState}
              resizeState={resizeState}
              onMouseDown={(e) => handleMouseDown(e, nest.id, "nest")}
                onMouseEnter={() => setIsHoveringOverNest(true)}
                onMouseLeave={() => setIsHoveringOverNest(false)}
                onDragOver={(e) => handleDragOver(e, nest.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, nest.id)}
              onRemove={() => removeNestContainer(nest.id)}
              onWidgetMouseDown={handleMouseDown}
              onWidgetRemove={removeWidget}
              onAriesWidgetUpdate={updateAriesWidget}
              onConfigOpen={() => dispatch({ type: "SET_MODAL", payload: "widget-config" })}
              getResizeHandles={getResizeHandles}
            />
          ))}

          {/* Hardware-Accelerated Main Grid Widgets */}
          {gridState.mainWidgets.map((widget) => (
            widget.type === "enhanced-sensor" ? (
              <HardwareAcceleratedWidget
                        key={widget.id}
                id={widget.id}
                x={widget.x}
                y={widget.y}
                width={widget.w}
                height={widget.h}
                isDragging={dragState.draggedId === widget.id}
                isResizing={resizeState.resizedId === widget.id}
                isPushed={pushedWidgets.has(widget.id)}
                onMouseDown={handleMouseDown}
                onRemove={removeWidget}
              >
                <EnhancedSensorWidget
                  widgetId={widget.id}
                  title={widget.title}
                  sensorType="generic"
                  streamMappings={[]}
                  onStreamMappingsChange={() => {}}
                  className="w-full h-full"
                  showTrend={true}
                  precision={2}
                />
                        {getResizeHandles(widget.id, "widget")}
              </HardwareAcceleratedWidget>
            ) : (
              <GridWidget
                key={widget.id}
                          widget={widget}
                isDragging={dragState.draggedId === widget.id}
                isResizing={resizeState.resizedId === widget.id}
                isPushed={pushedWidgets.has(widget.id)}
                onMouseDown={handleMouseDown}
                onRemove={removeWidget}
                onConfigOpen={() => dispatch({ type: "SET_MODAL", payload: "widget-config" })}
                getResizeHandles={getResizeHandles}
              />
            )
          ))}

          {/* Hardware-Accelerated Main Grid AriesWidgets */}
          {gridState.mainAriesWidgets.map((widget) => (
            <HardwareAcceleratedWidget
              key={widget.id}
              id={widget.id}
              x={widget.x}
              y={widget.y}
              width={widget.w}
              height={widget.h}
              isDragging={dragState.draggedId === widget.id}
              isResizing={resizeState.resizedId === widget.id}
              isPushed={pushedWidgets.has(widget.id)}
              onMouseDown={handleMouseDown}
              onRemove={removeAriesWidget}
            >
              <EnhancedSensorWidget
                widgetId={widget.id}
                title={widget.title}
                sensorType="temperature"
                streamMappings={[]}
                onStreamMappingsChange={(mappings) => updateAriesWidget(widget.id, { streamMappings: mappings } as any)}
                className="w-full h-full"
                showTrend={true}
                precision={1}
                thresholds={{
                  warning: { min: 0, max: 50 },
                  critical: { min: -10, max: 70 }
                }}
              />
              {getResizeHandles(widget.id, "widget")}
            </HardwareAcceleratedWidget>
          ))}
                </div>
              </div>

      {/* Performance Status Bar */}
      <div className="absolute bottom-4 right-4 z-50 bg-black/80 text-green-400 px-3 py-1 rounded text-xs font-mono">
        ⚡ Hardware Acceleration: ACTIVE | Enhanced Widgets: {gridState.mainWidgets.filter(w => w.type === 'enhanced-sensor').length}/{gridState.mainWidgets.length + gridState.mainAriesWidgets.length}
      </div>
    </div>
  )
}
