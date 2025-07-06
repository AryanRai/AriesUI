"use client"

import { useState, useEffect, useCallback } from 'react'

export type WindowMode = 'windowed' | 'maximized' | 'fullscreen'

interface WindowState {
  mode: WindowMode
  isElectron: boolean
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export function useWindowState() {
  const [windowState, setWindowState] = useState<WindowState>({
    mode: 'windowed',
    isElectron: false
  })

  // Check if running in Electron
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && window.electron !== undefined
    setWindowState(prev => ({ ...prev, isElectron }))
  }, [])

  // Listen for window state changes
  useEffect(() => {
    if (!windowState.isElectron) return

    const handleWindowStateChange = () => {
      if (typeof window !== 'undefined' && window.electron) {
        window.electron.ipcRenderer.invoke('get-window-state').then((state: any) => {
          setWindowState(prev => ({
            ...prev,
            mode: state.isFullScreen ? 'fullscreen' : state.isMaximized ? 'maximized' : 'windowed',
            bounds: state.bounds
          }))
        })
      }
    }

    // Listen for window events
    window.addEventListener('resize', handleWindowStateChange)
    
    // Initial state check
    handleWindowStateChange()

    return () => {
      window.removeEventListener('resize', handleWindowStateChange)
    }
  }, [windowState.isElectron])

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (!windowState.isElectron) {
      // Web fullscreen API
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.()
      } else {
        document.exitFullscreen?.()
      }
    } else {
      // Electron fullscreen
      if (typeof window !== 'undefined' && window.electron) {
        window.electron.ipcRenderer.send('toggle-fullscreen')
      }
    }
  }, [windowState.isElectron])

  // Toggle maximize mode
  const toggleMaximize = useCallback(() => {
    if (windowState.isElectron && typeof window !== 'undefined' && window.electron) {
      window.electron.ipcRenderer.send('toggle-maximize')
    }
  }, [windowState.isElectron])

  // Minimize window
  const minimize = useCallback(() => {
    if (windowState.isElectron && typeof window !== 'undefined' && window.electron) {
      window.electron.ipcRenderer.send('minimize-window')
    }
  }, [windowState.isElectron])

  // Restore to windowed mode
  const restoreWindow = useCallback(() => {
    if (windowState.isElectron && typeof window !== 'undefined' && window.electron) {
      window.electron.ipcRenderer.send('restore-window')
    }
  }, [windowState.isElectron])

  // Set specific window mode
  const setWindowMode = useCallback((mode: WindowMode) => {
    switch (mode) {
      case 'fullscreen':
        toggleFullscreen()
        break
      case 'maximized':
        if (windowState.mode !== 'maximized') {
          toggleMaximize()
        }
        break
      case 'windowed':
        restoreWindow()
        break
    }
  }, [windowState.mode, toggleFullscreen, toggleMaximize, restoreWindow])

  return {
    windowState,
    toggleFullscreen,
    toggleMaximize,
    minimize,
    restoreWindow,
    setWindowMode
  }
} 