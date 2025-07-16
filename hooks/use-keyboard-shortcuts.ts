/**
 * useKeyboardShortcuts Hook
 * 
 * Manages keyboard shortcuts for the grid system including
 * undo/redo, save, export, and other grid operations.
 */

import { useEffect, useCallback } from "react"

export interface KeyboardShortcutHandlers {
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onExport: () => void
  onImport: () => void
  onAddWidget: () => void
  onAddNest: () => void
  onResetView: () => void
  onToggleDebug: () => void
}

export interface UseKeyboardShortcutsProps {
  handlers: KeyboardShortcutHandlers
  enabled?: boolean
}

export const useKeyboardShortcuts = ({ 
  handlers, 
  enabled = true 
}: UseKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    
    // Don't handle shortcuts when typing in input fields
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return
    }

    // Ctrl+Z for undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      handlers.onUndo()
    }
    // Ctrl+Y or Ctrl+Shift+Z for redo
    else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      handlers.onRedo()
    }
    // Ctrl+S for save
    else if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      handlers.onSave()
    }
    // Ctrl+E for export
    else if (e.ctrlKey && e.key === 'e') {
      e.preventDefault()
      handlers.onExport()
    }
    // Ctrl+I for import
    else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault()
      handlers.onImport()
    }
    // Ctrl+Shift+W for add widget
    else if (e.ctrlKey && e.shiftKey && e.key === 'W') {
      e.preventDefault()
      handlers.onAddWidget()
    }
    // Ctrl+Shift+N for add nest
    else if (e.ctrlKey && e.shiftKey && e.key === 'N') {
      e.preventDefault()
      handlers.onAddNest()
    }
    // Ctrl+0 for reset view
    else if (e.ctrlKey && e.key === '0') {
      e.preventDefault()
      handlers.onResetView()
    }
    // Ctrl+Shift+D for toggle debug
    else if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault()
      handlers.onToggleDebug()
    }
  }, [enabled, handlers])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return {
    // Return shortcuts info for documentation/help
    shortcuts: {
      'Ctrl+Z': 'Undo',
      'Ctrl+Y / Ctrl+Shift+Z': 'Redo',
      'Ctrl+S': 'Save',
      'Ctrl+E': 'Export',
      'Ctrl+I': 'Import',
      'Ctrl+Shift+W': 'Add Widget',
      'Ctrl+Shift+N': 'Add Nest',
      'Ctrl+0': 'Reset View',
      'Ctrl+Shift+D': 'Toggle Debug',
    }
  }
}