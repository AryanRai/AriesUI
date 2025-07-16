"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
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

// Import extracted hooks and components
import { useViewportControls } from "@/hooks/use-viewport-controls"
import { useAutoSave } from "@/hooks/use-auto-save"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { usePerformanceMonitoring } from "@/hooks/use-performance-monitoring"
import { useDragAndDrop } from "@/hooks/use-drag-and-drop"
import { useResizeHandling } from "@/hooks/use-resize-handling"
import { ViewportControls } from "@/components/grid/ViewportControls"
import { PerformanceMonitor } from "@/components/grid/PerformanceMonitor"

// Import enhanced hardware components
import { EnhancedSensorWidget } from "@/components/widgets/enhanced-sensor-widget"
import { commsClient } from "@/lib/comms-stream-client"
import { MovableDebugPanel } from "@/components/debug/movable-debug-panel"
import { GridContainer } from "@/components/grid/grid-container"
// import { useVirtualGrid, useVirtualGridStats } from "@/hooks/use-virtual-grid"

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

  const containerRef = useRef<HTMLDivElement>(null)
  
  // Container size for virtual rendering
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Use extracted viewport controls hook
  const {
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
    resetViewport,
  } = useViewportControls({
    initialViewport: { x: 0, y: 0, zoom: 1 },
    containerRef,
  })

  // Use extracted drag and drop hook
  const {
    dragState,
    setDragState,
    dropState,
    setDropState,
    dragOverNest,
    setDragOverNest,
    pushedWidgets,
    setPushedWidgets,
    isHoveringOverNest,
    setIsHoveringOverNest,
    handleMouseDown,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop({
    gridState,
    setGridState,
    viewport,
    containerRef,
    dispatch,
  })

  // Use extracted resize handling hook
  const {
    resizeState,
    setResizeState,
    getResizeHandles,
  } = useResizeHandling({
    gridState,
    setGridState,
    viewport,
    containerRef,
  })

  // Use extracted auto-save hook
  const {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isAutoSaveEnabled,
    setIsAutoSaveEnabled,
    autoSaveInterval,
    setAutoSaveInterval,
    autoSaveStatus,
    setAutoSaveStatus,
    lastAutoSave,
    stateHistory,
    setStateHistory,
    historyIndex,
    setHistoryIndex,
    saveGridState,
    exportGridState,
    importGridState,
    undo,
    redo,
    navigateToHistory,
    addHistoryEntry,
  } = useAutoSave({
    gridState,
    viewport,
    commsState: state,
    dispatch,
    updateProfiles,
  })

  // Use extracted performance monitoring hook
  const {
    performanceMetrics,
    batchWidgetUpdate,
    virtualGrid,
    rafRef,
    clearRAF,
  } = usePerformanceMonitoring({
    gridState,
    viewport,
    containerSize,
    draggedId: dragState.draggedId,
    resizedId: resizeState.resizedId,
  })

  const [actionsToolbarPosition, setActionsToolbarPosition] = useLocalStorage("aries-actions-toolbar-pos", { top: 80, right: 20 })
  const [zoomToolbarPosition, setZoomToolbarPosition] = useLocalStorage("aries-zoom-toolbar-pos", { top: 80, left: 200 })
  
  // Reset all toolbar positions to default
  const resetToolbarPositions = useCallback(() => {
    // Reset unified toolbar position
    localStorage.setItem("toolbar-position", JSON.stringify({ x: 50, y: 50 }))
    
    // Reset actions toolbar position
    setActionsToolbarPosition({ top: 80, right: 20 })
    
    // Reset zoom toolbar position
    setZoomToolbarPosition({ top: 80, left: 200 })
    
    // Dispatch event to notify other components (like FloatingToolbar)
    window.dispatchEvent(new CustomEvent("resetToolbarPositions"))
    
    dispatch({ type: "ADD_LOG", payload: "All toolbar positions reset to default" })
  }, [setActionsToolbarPosition, setZoomToolbarPosition, dispatch])
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false)
  const [isDraggingZoomToolbar, setIsDraggingZoomToolbar] = useState(false)
  const [toolbarDragStart, setToolbarDragStart] = useState({ x: 0, y: 0, top: 0, right: 0 })
  const [zoomToolbarDragStart, setZoomToolbarDragStart] = useState({ x: 0, y: 0, top: 0, left: 0 })
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useLocalStorage("aries-show-debug-panel", true)
  const [hardwareConnectionStatus, setHardwareConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  
  // Track if grid state has been initialized to avoid triggering unsaved changes on initial load
  const isGridStateInitialized = useRef(false)
  const maxHistorySize = 50

  // Performance monitoring refs - now handled by usePerformanceMonitoring hook

  // Enhanced virtual grid with better performance - now handled by usePerformanceMonitoring hook

  // Optimized batched widget updates - now handled by usePerformanceMonitoring hook

  // Performance optimization handlers - now handled by extracted hooks

  // Cleanup animation frames on unmount - now handled by extracted hooks

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
  const saveStateToHistory = useCallback((gridState: GridStateType, viewport: { x: number; y: number; zoom: number }, description: string = "Grid state updated") => {
    setStateHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), { 
        gridState, 
        viewport, 
        timestamp: Date.now(),
        description
      }]
      // Keep only the last maxHistorySize items
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
      }
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1))
  }, [historyIndex, maxHistorySize, setStateHistory, setHistoryIndex])

  // Save grid state - now handled by useAutoSave hook

  // Export, undo, redo functions - now handled by useAutoSave hook

  // Update grid state helper
  const updateGridState = useCallback((updater: (prev: GridStateType) => GridStateType) => {
    setGridState((prev) => {
      const newState = updater(prev)
      return newState
    })
  }, [])

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
  }, [gridState.gridSize, gridState.mainWidgets, gridState.nestContainers, updateGridState, dispatch])

  // Use extracted keyboard shortcuts hook
  const { shortcuts } = useKeyboardShortcuts({
    handlers: {
      onUndo: undo,
      onRedo: redo,
      onSave: () => saveGridState(false),
      onExport: exportGridState,
      onImport: () => {
        // Trigger file input click
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = (e) => {
          if (e.target instanceof HTMLInputElement) {
            importGridState(e as any)
          }
        }
        input.click()
      },
      onAddWidget: addWidget,
      onAddNest: addNestContainer,
      onResetView: resetViewport,
      onToggleDebug: () => setIsDebugPanelVisible(prev => !prev),
    },
    enabled: true,
  })

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
        const initialHistory = [{ 
          gridState: parsedState, 
          viewport: parsedState.viewport || { x: 0, y: 0, zoom: 1 },
          timestamp: Date.now(),
          description: "Grid state loaded"
        }]
        setStateHistory(initialHistory)
        setHistoryIndex(0)
        
        dispatch({ type: "ADD_LOG", payload: "Grid state loaded successfully" })
      }
    } catch (error) {
      console.error("Failed to load grid state:", error)
      dispatch({ type: "ADD_LOG", payload: "Failed to load grid state" })
    }
  }, [dispatch])

  // Import grid state - now handled by useAutoSave hook

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
    } else {
      // Load the active profile's data if it exists
      const activeProfileData = state.profiles[state.activeProfile]
      if (activeProfileData) {
        localStorage.setItem("comms-grid-state", JSON.stringify(activeProfileData))
      }
    }
  }, [state.profiles, state.activeProfile, gridState, viewport, updateProfiles, dispatch])

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
   * Handle mouse down events - now handled by useDragAndDrop hook
   */

  /**
   * Handle panning start with middle mouse or Ctrl+click
   * Handle panning - now handled by useViewportControls hook
   */

  // Enhanced wheel handling - now handled by useViewportControls hook

  // Smooth zoom animation and wheel handling - now handled by useViewportControls hook

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
      lastUpdateTime: Date.now(),
    })
  }

  // Handle drag and drop operations - now handled by useDragAndDrop hook

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

  // Hardware-accelerated mouse movement - now handled by extracted hooks
  
  // Mouse movement handling - now handled by extracted hooks

  // Add wheel event listener and track container size
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const wheelHandler = (e: WheelEvent) => {
        // If hovering over a nest, do not handle wheel events on main grid
        if (isHoveringOverNest) {
          return
        }
        handleWheel(e)
      }
      
      container.addEventListener("wheel", wheelHandler, { passive: false })
      
      // Track container size for virtual grid
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          })
        }
      })
      
      resizeObserver.observe(container)
      
      return () => {
        container.removeEventListener("wheel", wheelHandler)
        resizeObserver.disconnect()
      }
    }
  }, [handleWheel, isHoveringOverNest])

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

  // Resize handles - now handled by useResizeHandling hook

  // Update widget count and broadcast to status bar
  useEffect(() => {
    const totalWidgets = gridState.mainWidgets.length + gridState.nestedWidgets.length + 
                        gridState.mainAriesWidgets.length + gridState.nestedAriesWidgets.length
    window.dispatchEvent(new CustomEvent("widgetCountUpdate", { detail: { count: totalWidgets } }))
  }, [gridState.mainWidgets.length, gridState.nestedWidgets.length, gridState.mainAriesWidgets.length, gridState.nestedAriesWidgets.length])

  const updateNestContainer = (id: string, updates: Partial<NestContainerType>) => {
    updateGridState((prev) => ({
      ...prev,
      nestContainers: prev.nestContainers.map((nest) =>
        nest.id === id ? { ...nest, ...updates } : nest
      ),
    }))
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-background to-background/80">
      
      {/* Movable Debug Panel */}
      <MovableDebugPanel
        isVisible={isDebugPanelVisible}
        onToggleVisibility={setIsDebugPanelVisible}
        viewport={viewport}
        gridState={gridState}
        dragState={dragState}
        isPanning={isPanning}
        hardwareConnectionStatus={hardwareConnectionStatus}
        isAutoSaveEnabled={isAutoSaveEnabled}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      
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
        lastAutoSave={lastAutoSave ? lastAutoSave.toISOString() : null}
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
        onNavigateToHistory={navigateToHistory}
      />
      


      {/* Extracted Viewport Controls Component */}
      <ViewportControls
        viewport={viewport}
        setViewport={setViewport}
        onResetView={resetViewport}
        dragState={dragState}
      />

      {/* Hardware-Accelerated Grid Container with Virtual Rendering */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        onMouseDown={handlePanStart}
      >
        {/* Temporarily revert to inline grid rendering to fix resize issues */}
        <div
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
            {/* Use virtual grid results for performance - only render top-level nests */}
            {virtualGrid.visibleNestContainers.filter(nest => !nest.parentNestId).map((nest) => (
              <NestContainer
                key={nest.id}
                nest={nest}
                nestedWidgets={virtualGrid.visibleNestedWidgets}
                nestedAriesWidgets={virtualGrid.visibleNestedAriesWidgets}
                nestedNestContainers={virtualGrid.visibleNestContainers.filter(n => n.parentNestId === nest.id)}
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
                onUpdate={updateNestContainer}
                onWidgetMouseDown={handleMouseDown}
                onWidgetRemove={removeWidget}
                onAriesWidgetUpdate={updateAriesWidget}
                onConfigOpen={() => dispatch({ type: "SET_MODAL", payload: "widget-config" })}
                getResizeHandles={getResizeHandles}
              />
            ))}

            {/* Hardware-Accelerated Main Grid Widgets */}
            {virtualGrid.visibleMainWidgets.map((widget) => (
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
            ))}

            {/* Hardware-Accelerated Main Grid AriesWidgets */}
            {virtualGrid.visibleMainAriesWidgets.map((widget) => (
              <GridWidget
                key={widget.id}
                widget={widget}
                isDragging={dragState.draggedId === widget.id}
                isResizing={resizeState.resizedId === widget.id}
                isPushed={pushedWidgets.has(widget.id)}
                onMouseDown={handleMouseDown}
                onRemove={removeAriesWidget}
                onUpdate={updateAriesWidget}
                getResizeHandles={getResizeHandles}
              />
            ))}
        </div>
        </div>
      </div>

      {/* Extracted Performance Monitor Component */}
      <PerformanceMonitor
        totalWidgets={virtualGrid.totalWidgets}
        renderedWidgets={virtualGrid.renderedWidgets}
        cullingPercentage={virtualGrid.cullingPercentage}
      />
    </div>
  )
}
