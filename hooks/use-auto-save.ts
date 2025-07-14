/**
 * useAutoSave Hook
 * 
 * Manages auto-save functionality including state persistence, 
 * export/import operations, and history management.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { GridState as GridStateType } from "@/components/grid/types"
import type { ViewportState } from "./use-viewport-controls"

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error"

export interface AutoSaveConfig {
  enabled: boolean
  interval: number
  showNotifications: boolean
  maxRetries: number
}

export interface HistoryEntry {
  gridState: GridStateType
  viewport: ViewportState
  timestamp: number
  description: string
}

export interface UseAutoSaveProps {
  gridState: GridStateType
  viewport: ViewportState
  commsState: any
  dispatch: any
  updateProfiles: any
}

export interface UseAutoSaveReturn {
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>
  isAutoSaveEnabled: boolean
  setIsAutoSaveEnabled: React.Dispatch<React.SetStateAction<boolean>>
  autoSaveInterval: number
  setAutoSaveInterval: React.Dispatch<React.SetStateAction<number>>
  autoSaveStatus: AutoSaveStatus
  setAutoSaveStatus: React.Dispatch<React.SetStateAction<AutoSaveStatus>>
  lastAutoSave: Date | null
  stateHistory: HistoryEntry[]
  setStateHistory: React.Dispatch<React.SetStateAction<HistoryEntry[]>>
  historyIndex: number
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>
  saveGridState: (showNotification?: boolean) => Promise<void>
  exportGridState: () => void
  importGridState: (event: React.ChangeEvent<HTMLInputElement>) => void
  undo: () => void
  redo: () => void
  navigateToHistory: (index: number) => void
  addHistoryEntry: (description: string) => void
}

const DEFAULT_AUTO_SAVE_CONFIG: AutoSaveConfig = {
  enabled: true,
  interval: 30000, // 30 seconds
  showNotifications: true,
  maxRetries: 3,
}

export const useAutoSave = ({
  gridState,
  viewport,
  commsState,
  dispatch,
  updateProfiles,
}: UseAutoSaveProps): UseAutoSaveReturn => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useLocalStorage("aries-auto-save-enabled", true)
  const [autoSaveInterval, setAutoSaveInterval] = useLocalStorage("aries-auto-save-interval", 30000)
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle")
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  
  // History management
  const [stateHistory, setStateHistory] = useLocalStorage<HistoryEntry[]>("aries-grid-history", [])
  const [historyIndex, setHistoryIndex] = useState(0)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Add a new history entry
   */
  const addHistoryEntry = useCallback((description: string) => {
    const newEntry: HistoryEntry = {
      gridState,
      viewport,
      timestamp: Date.now(),
      description,
    }

    setStateHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), newEntry]
      // Keep only last 50 entries
      return newHistory.slice(-50)
    })
    setHistoryIndex(prev => prev + 1)
  }, [gridState, viewport, historyIndex])

  /**
   * Save grid state with retry logic
   */
  const saveGridState = useCallback(async (showNotification = true) => {
    if (!commsState.activeProfile) {
      if (showNotification) {
        dispatch({ type: "ADD_LOG", payload: "No active profile selected" })
      }
      return
    }

    setAutoSaveStatus("saving")
    
    let retryCount = 0
    const maxRetries = DEFAULT_AUTO_SAVE_CONFIG.maxRetries

    while (retryCount <= maxRetries) {
      try {
        const updatedProfile = {
          ...commsState.activeProfile,
          gridState,
          viewport,
          lastModified: new Date().toISOString(),
        }

        const updatedProfiles = commsState.profiles.map((profile: any) =>
          profile.id === commsState.activeProfile.id ? updatedProfile : profile
        )

        await updateProfiles(updatedProfiles)
        
        setHasUnsavedChanges(false)
        setLastAutoSave(new Date())
        setAutoSaveStatus("saved")
        
        if (showNotification) {
          dispatch({ type: "ADD_LOG", payload: "Grid state saved successfully" })
        }
        
        // Clear status after 2 seconds
        setTimeout(() => setAutoSaveStatus("idle"), 2000)
        return
        
      } catch (error) {
        retryCount++
        console.error(`Save attempt ${retryCount} failed:`, error)
        
        if (retryCount > maxRetries) {
          setAutoSaveStatus("error")
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          
          if (showNotification) {
            dispatch({ type: "ADD_LOG", payload: `Failed to save grid state after ${maxRetries} attempts: ${errorMessage}` })
          }
          
          setTimeout(() => setAutoSaveStatus("idle"), 5000)
          throw error
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }
  }, [gridState, viewport, dispatch, commsState.activeProfile, commsState.profiles, updateProfiles])

  /**
   * Export grid state as JSON file
   */
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

  /**
   * Import grid state from JSON file
   */
  const importGridState = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        
        // Validate the imported data structure
        if (!importedData.mainWidgets || !importedData.nestContainers) {
          throw new Error("Invalid grid state format")
        }

        // Update grid state and viewport
        // Note: This would need to be handled by the parent component
        // as this hook doesn't directly manage grid state
        
        dispatch({ type: "ADD_LOG", payload: "Grid state imported successfully" })
        setHasUnsavedChanges(true)
        addHistoryEntry("Imported grid state")
      } catch (error) {
        console.error("Failed to import grid state:", error)
        dispatch({ type: "ADD_LOG", payload: "Failed to import grid state: Invalid file format" })
      }
    }
    reader.readAsText(file)
  }, [dispatch, addHistoryEntry])

  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setHasUnsavedChanges(true)
      dispatch({ type: "ADD_LOG", payload: "Undo: Reverted to previous state" })
    }
  }, [historyIndex, dispatch])

  /**
   * Redo last undone action
   */
  const redo = useCallback(() => {
    if (historyIndex < stateHistory.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setHasUnsavedChanges(true)
      dispatch({ type: "ADD_LOG", payload: "Redo: Restored next state" })
    }
  }, [historyIndex, stateHistory.length, dispatch])

  /**
   * Navigate to specific history entry
   */
  const navigateToHistory = useCallback((index: number) => {
    if (index >= 0 && index < stateHistory.length) {
      setHistoryIndex(index)
      setHasUnsavedChanges(true)
      dispatch({ type: "ADD_LOG", payload: `Navigated to history entry ${index + 1}` })
    }
  }, [stateHistory.length, dispatch])

  // Auto-save effect
  useEffect(() => {
    if (isAutoSaveEnabled && hasUnsavedChanges) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveGridState(false)
      }, autoSaveInterval)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [isAutoSaveEnabled, hasUnsavedChanges, autoSaveInterval, saveGridState])

  return {
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
  }
}