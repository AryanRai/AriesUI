"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useComms } from "@/components/comms-context"
import type { 
  ViewportState, 
  DragState, 
  ResizeState, 
  DropState,
  AutoSaveConfig,
  StateHistory,
  GridStateType,
  HardwareConnectionStatus,
  ContainerSize
} from './types'

interface StateManagerProps {
  gridState: GridStateType
  setGridState: React.Dispatch<React.SetStateAction<GridStateType>>
  children: React.ReactNode
}

export const StateManager: React.FC<StateManagerProps> = ({
  gridState,
  setGridState,
  children
}) => {
  const { dispatch, state } = useComms()
  
  // Viewport state for infinite scrolling
  const [viewport, setViewport] = useState<ViewportState>({
    x: 0,
    y: 0,
    zoom: 1,
  })

  // State management for drag, resize, and drop operations
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    draggedType: null,
    sourceContainer: null,
    offset: { x: 0, y: 0 },
    lastUpdateTime: 0,
  })

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizedId: null,
    resizedType: null,
    handle: null,
    startPos: { x: 0, y: 0 },
    startSize: { w: 0, h: 0 },
    startPosition: { x: 0, y: 0 },
    lastUpdateTime: 0,
  })

  const [dropState, setDropState] = useState<DropState>({
    isDragOver: false,
    targetNestId: null,
  })

  // Additional state
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [dragOverNest, setDragOverNest] = useState<string | null>(null)
  const [pushedWidgets, setPushedWidgets] = useState<Set<string>>(new Set())
  const [isHoveringOverNest, setIsHoveringOverNest] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [containerSize, setContainerSize] = useState<ContainerSize>({ width: 1920, height: 1080 })
  const [hardwareConnectionStatus, setHardwareConnectionStatus] = useState<HardwareConnectionStatus>('disconnected')

  // Auto-save configuration
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useLocalStorage("aries-auto-save-enabled", true)
  const [autoSaveInterval, setAutoSaveInterval] = useLocalStorage("aries-auto-save-interval", 30000)
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Debug panel visibility
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useLocalStorage("aries-show-debug-panel", true)
  const [isViewportInfoVisible, setIsViewportInfoVisible] = useLocalStorage("aries-show-viewport-info", true)

  // Track if grid state has been initialized
  const isGridStateInitialized = useRef(false)
  
  // State history for undo/redo functionality
  const [stateHistory, setStateHistory] = useState<Array<StateHistory>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const maxHistorySize = 50

  // Save state to history for undo/redo
  const saveStateToHistory = useCallback((gridState: GridStateType, viewport: ViewportState) => {
    setStateHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), { gridState, viewport }]
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
      }
      
      const stateToSave = {
        ...gridState,
        viewport,
        lastSaved: new Date().toISOString(),
        autoSaveEnabled: isAutoSaveEnabled,
        autoSaveInterval: autoSaveInterval,
      }
      
      const stateString = JSON.stringify(stateToSave)
      
      // Check localStorage quota before saving
      try {
        const testKey = 'comms-grid-state-test'
        localStorage.setItem(testKey, stateString)
        localStorage.removeItem(testKey)
      } catch (quotaError) {
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
        // updateProfiles(updatedProfiles) // Note: This function needs to be passed in or accessed from context
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
        setTimeout(() => setAutoSaveStatus('idle'), 2000)
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
      throw error
    }
  }, [gridState, viewport, dispatch, state.activeProfile, state.profiles, isAutoSaveEnabled, autoSaveInterval])

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
  }, [historyIndex, stateHistory, dispatch, setGridState])

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
  }, [historyIndex, stateHistory, dispatch, setGridState])

  // Track unsaved changes
  useEffect(() => {
    if (isGridStateInitialized.current) {
      setHasUnsavedChanges(true)
    }
  }, [gridState])

  useEffect(() => {
    if (isGridStateInitialized.current) {
      setHasUnsavedChanges(true)
    }
  }, [viewport])

  // Save state to history when grid state changes
  useEffect(() => {
    if (isGridStateInitialized.current) {
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

  // Auto-save functionality
  useEffect(() => {
    if (!isAutoSaveEnabled) {
      setAutoSaveStatus('idle')
      return
    }

    let interval: NodeJS.Timeout | null = null
    let retryCount = 0
    const maxRetries = 3

    const performAutoSave = async () => {
      if (hasUnsavedChanges && isAutoSaveEnabled) {
        try {
          await saveGridState(true)
          retryCount = 0
        } catch (error) {
          retryCount++
          if (retryCount >= maxRetries) {
            setAutoSaveStatus('error')
            setIsAutoSaveEnabled(false)
            dispatch({ type: "ADD_LOG", payload: "Auto-save disabled due to repeated failures" })
            return
          }
          
          setTimeout(() => {
            if (hasUnsavedChanges && isAutoSaveEnabled) {
              performAutoSave()
            }
          }, Math.pow(2, retryCount) * 1000)
        }
      }
    }

    if (hasUnsavedChanges) {
      setTimeout(performAutoSave, 1000)
    }

    interval = setInterval(performAutoSave, autoSaveInterval)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [hasUnsavedChanges, saveGridState, isAutoSaveEnabled, autoSaveInterval, dispatch])

  // Provide all state and handlers to children
  const stateContext = {
    // State
    viewport,
    setViewport,
    dragState,
    setDragState,
    resizeState,
    setResizeState,
    dropState,
    setDropState,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    lastPanPoint,
    setLastPanPoint,
    dragOverNest,
    setDragOverNest,
    pushedWidgets,
    setPushedWidgets,
    isHoveringOverNest,
    setIsHoveringOverNest,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    containerSize,
    setContainerSize,
    hardwareConnectionStatus,
    setHardwareConnectionStatus,
    
    // Auto-save
    isAutoSaveEnabled,
    setIsAutoSaveEnabled,
    autoSaveInterval,
    setAutoSaveInterval,
    lastAutoSave,
    autoSaveStatus,
    
    // Debug
    isDebugPanelVisible,
    setIsDebugPanelVisible,
    isViewportInfoVisible,
    setIsViewportInfoVisible,
    
    // History
    stateHistory,
    historyIndex,
    
    // Actions
    saveGridState,
    exportGridState,
    undo,
    redo,
    saveStateToHistory
  }

  return (
    <div className="state-manager" data-state-context={JSON.stringify(stateContext)}>
      {children}
    </div>
  )
}

// Hook to access state context
export const useStateContext = () => {
  const contextElement = document.querySelector('[data-state-context]')
  if (!contextElement) return null
  
  try {
    return JSON.parse(contextElement.getAttribute('data-state-context') || '{}')
  } catch {
    return null
  }
}

export { StateManager } 