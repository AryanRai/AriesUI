/**
 * useGridState Hook
 * 
 * Centralized state management for the AriesUI grid system.
 * Handles grid state, auto-save, history management, and persistence.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { 
  GridState, 
  UseGridStateReturn, 
  AutoSaveConfig, 
  SaveResult, 
  HistoryEntry, 
  Position, 
  Widget,
  MainGridWidget,
  NestedWidget
} from "./types"
import { generateUniqueId, findNonCollidingPosition } from "./utils"
import { GRID_CONSTANTS } from "./types"

const DEFAULT_GRID_STATE: GridState = {
  mainWidgets: [],
  nestContainers: [],
  nestedWidgets: [],
  mainAriesWidgets: [],
  nestedAriesWidgets: [],
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  gridSize: GRID_CONSTANTS.DEFAULT_GRID_SIZE,
  lastSaved: null,
  version: "1.0.0",
}

const DEFAULT_AUTO_SAVE_CONFIG: AutoSaveConfig = {
  enabled: true,
  interval: 30000, // 30 seconds
  showNotifications: true,
  maxRetries: 3,
}

export const useGridState = (): UseGridStateReturn => {
  // Core state management
  const [gridState, setGridState] = useState<GridState>(DEFAULT_GRID_STATE)
  const [autoSaveConfig, setAutoSaveConfig] = useLocalStorage<AutoSaveConfig>(
    "aries-autosave-config",
    DEFAULT_AUTO_SAVE_CONFIG
  )
  
  // History management
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false)
  
  // Auto-save management
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveTimeRef = useRef<number>(0)
  const saveRetryCountRef = useRef<number>(0)
  
  // Persistence functions
  const saveGridState = useCallback(async (): Promise<SaveResult> => {
    const timestamp = new Date().toISOString()
    
    try {
      // Save to localStorage
      localStorage.setItem("aries-grid-state", JSON.stringify({
        ...gridState,
        lastSaved: timestamp,
      }))
      
      // Reset retry count on successful save
      saveRetryCountRef.current = 0
      lastSaveTimeRef.current = Date.now()
      
      // Update grid state with save timestamp
      setGridState(prev => ({
        ...prev,
        lastSaved: timestamp,
      }))
      
      return {
        success: true,
        timestamp,
      }
    } catch (error) {
      console.error("Failed to save grid state:", error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp,
      }
    }
  }, [gridState])
  
  const loadGridState = useCallback(async (): Promise<GridState> => {
    try {
      const savedState = localStorage.getItem("aries-grid-state")
      if (savedState) {
        const parsedState = JSON.parse(savedState) as GridState
        
        // Validate and migrate state if necessary
        const validatedState = {
          ...DEFAULT_GRID_STATE,
          ...parsedState,
          version: "1.0.0", // Ensure current version
        }
        
        setGridState(validatedState)
        return validatedState
      }
      
      return DEFAULT_GRID_STATE
    } catch (error) {
      console.error("Failed to load grid state:", error)
      return DEFAULT_GRID_STATE
    }
  }, [])
  
  const exportGridState = useCallback((): string => {
    const exportData = {
      ...gridState,
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
    }
    
    return JSON.stringify(exportData, null, 2)
  }, [gridState])
  
  const importGridState = useCallback((data: string): boolean => {
    try {
      const importedState = JSON.parse(data) as GridState
      
      // Validate imported state
      if (!importedState || typeof importedState !== "object") {
        throw new Error("Invalid grid state format")
      }
      
      // Merge with default state to ensure all properties exist
      const validatedState = {
        ...DEFAULT_GRID_STATE,
        ...importedState,
        version: "1.0.0",
      }
      
      setGridState(validatedState)
      
      // Add to history
      addToHistory("Import Grid State", gridState, validatedState)
      
      return true
    } catch (error) {
      console.error("Failed to import grid state:", error)
      return false
    }
  }, [gridState])
  
  // History management functions
  const addToHistory = useCallback((
    description: string,
    beforeState: GridState,
    afterState: GridState
  ) => {
    if (isUndoRedoOperation) return
    
    const entry: HistoryEntry = {
      id: generateUniqueId("history"),
      timestamp: new Date().toISOString(),
      description,
      beforeState: JSON.parse(JSON.stringify(beforeState)), // Deep clone
      afterState: JSON.parse(JSON.stringify(afterState)), // Deep clone
    }
    
    setHistory(prev => {
      // Remove any entries after current index (when undoing then making new changes)
      const newHistory = prev.slice(0, historyIndex + 1)
      
      // Add new entry
      newHistory.push(entry)
      
      // Limit history size
      if (newHistory.length > GRID_CONSTANTS.MAX_HISTORY_ENTRIES) {
        newHistory.shift()
      }
      
      return newHistory
    })
    
    setHistoryIndex(prev => Math.min(prev + 1, GRID_CONSTANTS.MAX_HISTORY_ENTRIES - 1))
  }, [historyIndex, isUndoRedoOperation])
  
  const undo = useCallback(() => {
    if (historyIndex >= 0 && history[historyIndex]) {
      setIsUndoRedoOperation(true)
      const entry = history[historyIndex]
      setGridState(entry.beforeState)
      setHistoryIndex(prev => prev - 1)
      
      // Reset flag after state update
      setTimeout(() => setIsUndoRedoOperation(false), 0)
    }
  }, [history, historyIndex])
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1 && history[historyIndex + 1]) {
      setIsUndoRedoOperation(true)
      const entry = history[historyIndex + 1]
      setGridState(entry.afterState)
      setHistoryIndex(prev => prev + 1)
      
      // Reset flag after state update
      setTimeout(() => setIsUndoRedoOperation(false), 0)
    }
  }, [history, historyIndex])
  
  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1
  
  // Widget management functions
  const addWidget = useCallback((type: string, position?: Position) => {
    const newWidget = {
      id: generateUniqueId("widget"),
      type,
      title: `${type} Widget`,
      content: `New ${type} widget`,
      x: position?.x || 100,
      y: position?.y || 100,
      w: GRID_CONSTANTS.DEFAULT_WIDGET_WIDTH,
      h: GRID_CONSTANTS.DEFAULT_WIDGET_HEIGHT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      container: "main" as const,
    }
    
    // Find non-colliding position
    const nonCollidingPos = findNonCollidingPosition(
      newWidget,
      gridState.mainWidgets,
      gridState.gridSize
    )
    
    newWidget.x = nonCollidingPos.x
    newWidget.y = nonCollidingPos.y
    
    const newState = {
      ...gridState,
      mainWidgets: [...gridState.mainWidgets, newWidget],
    }
    
    setGridState(newState)
    addToHistory("Add Widget", gridState, newState)
  }, [gridState, addToHistory])
  
  const removeWidget = useCallback((id: string) => {
    const newState = {
      ...gridState,
      mainWidgets: gridState.mainWidgets.filter(w => w.id !== id),
      nestedWidgets: gridState.nestedWidgets.filter(w => w.id !== id),
    }
    
    setGridState(newState)
    addToHistory("Remove Widget", gridState, newState)
  }, [gridState, addToHistory])
  
     const updateWidget = useCallback((id: string, updates: Partial<Widget>) => {
     const newState = {
       ...gridState,
       mainWidgets: gridState.mainWidgets.map(w => 
         w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } as MainGridWidget : w
       ),
       nestedWidgets: gridState.nestedWidgets.map(w => 
         w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } as NestedWidget : w
       ),
     }
     
     setGridState(newState)
     addToHistory("Update Widget", gridState, newState)
   }, [gridState, addToHistory])
  
  const addNestContainer = useCallback((position?: Position) => {
    const newNest = {
      id: generateUniqueId("nest"),
      type: "container",
      title: "New Nest",
      x: position?.x || 200,
      y: position?.y || 200,
      w: GRID_CONSTANTS.DEFAULT_NEST_WIDTH,
      h: GRID_CONSTANTS.DEFAULT_NEST_HEIGHT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // Find non-colliding position
    const nonCollidingPos = findNonCollidingPosition(
      newNest,
      [...gridState.nestContainers, ...gridState.mainWidgets],
      gridState.gridSize
    )
    
    newNest.x = nonCollidingPos.x
    newNest.y = nonCollidingPos.y
    
    const newState = {
      ...gridState,
      nestContainers: [...gridState.nestContainers, newNest],
    }
    
    setGridState(newState)
    addToHistory("Add Nest Container", gridState, newState)
  }, [gridState, addToHistory])
  
  const removeNestContainer = useCallback((id: string) => {
    const newState = {
      ...gridState,
      nestContainers: gridState.nestContainers.filter(n => n.id !== id),
      nestedWidgets: gridState.nestedWidgets.filter(w => w.nestId !== id),
      nestedAriesWidgets: gridState.nestedAriesWidgets.filter(w => w.nestId !== id),
    }
    
    setGridState(newState)
    addToHistory("Remove Nest Container", gridState, newState)
  }, [gridState, addToHistory])
  
  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!autoSaveConfig.enabled) return
    
    const timeSinceLastSave = Date.now() - lastSaveTimeRef.current
    if (timeSinceLastSave < autoSaveConfig.interval) return
    
    try {
      const result = await saveGridState()
      
      if (!result.success && saveRetryCountRef.current < autoSaveConfig.maxRetries) {
        saveRetryCountRef.current++
        
        // Retry after delay
        setTimeout(() => {
          performAutoSave()
        }, 5000 * saveRetryCountRef.current) // Exponential backoff
      } else if (result.success) {
        saveRetryCountRef.current = 0
        
        if (autoSaveConfig.showNotifications) {
          // Could show toast notification here
          console.log("Auto-save completed successfully")
        }
      }
    } catch (error) {
      console.error("Auto-save failed:", error)
    }
  }, [autoSaveConfig, saveGridState])
  
  // Auto-save effect
  useEffect(() => {
    if (!autoSaveConfig.enabled) return
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave()
    }, autoSaveConfig.interval)
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [gridState, autoSaveConfig, performAutoSave])
  
  // Load initial state
  useEffect(() => {
    loadGridState()
  }, [loadGridState])
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])
  
  return {
    gridState,
    setGridState,
    addWidget,
    removeWidget,
    updateWidget,
    addNestContainer,
    removeNestContainer,
    saveGridState,
    loadGridState,
    exportGridState,
    importGridState,
    undo,
    redo,
    canUndo,
    canRedo,
         autoSaveConfig,
     setAutoSaveConfig: (config: Partial<AutoSaveConfig>) => {
       setAutoSaveConfig(prev => ({ ...prev, ...config }))
     },
  }
} 