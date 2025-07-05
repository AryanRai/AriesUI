"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { usePerformanceOptimization } from "@/hooks/use-performance-optimization"

interface GridPerformanceSettings {
  enabled: boolean
  mode: "auto" | "balanced" | "high"
  virtualization: boolean
  lazyLoading: boolean
  adaptiveRendering: boolean
  batchUpdates: boolean
  memoryOptimization: boolean
  targetFPS: number
  maxWidgets: number
  renderDistance: number
  updateThrottling: number
}

interface GridPerformanceState {
  settings: GridPerformanceSettings
  metrics: {
    fps: number
    memoryUsage: number
    renderTime: number
    widgetCount: number
    visibleWidgets: number
    isOptimizing: boolean
    lastOptimization: string | null
  }
  recommendations: Array<{
    id: string
    type: "performance" | "memory" | "rendering"
    severity: "low" | "medium" | "high"
    message: string
    action?: () => void
  }>
}

interface GridPerformanceContextType {
  state: GridPerformanceState
  updateSettings: (settings: Partial<GridPerformanceSettings>) => void
  enableOptimization: () => void
  disableOptimization: () => void
  resetToDefaults: () => void
  generateRecommendations: () => void
  applyRecommendation: (id: string) => void
  dismissRecommendation: (id: string) => void
}

const defaultSettings: GridPerformanceSettings = {
  enabled: true,
  mode: "auto",
  virtualization: true,
  lazyLoading: true,
  adaptiveRendering: true,
  batchUpdates: true,
  memoryOptimization: true,
  targetFPS: 60,
  maxWidgets: 100,
  renderDistance: 1000,
  updateThrottling: 16 // 60fps
}

const GridPerformanceContext = createContext<GridPerformanceContextType | undefined>(undefined)

export function useGridPerformance() {
  const context = useContext(GridPerformanceContext)
  if (!context) {
    throw new Error("useGridPerformance must be used within a GridPerformanceProvider")
  }
  return context
}

interface GridPerformanceProviderProps {
  children: React.ReactNode
}

export function GridPerformanceProvider({ children }: GridPerformanceProviderProps) {
  const [settings, setSettings] = useLocalStorage<GridPerformanceSettings>("grid-performance-settings", defaultSettings)
  const [metrics, setMetrics] = useState({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    widgetCount: 0,
    visibleWidgets: 0,
    isOptimizing: false,
    lastOptimization: null as string | null
  })
  const [recommendations, setRecommendations] = useState<Array<{
    id: string
    type: "performance" | "memory" | "rendering"
    severity: "low" | "medium" | "high"
    message: string
    action?: () => void
  }>>([])

  // Performance optimization hook
  const {
    isOptimizing,
    performanceMetrics,
    enableOptimizations,
    disableOptimizations
  } = usePerformanceOptimization({
    targetFPS: settings.targetFPS,
    memoryThreshold: 512,
    batchSize: 10
  })

  // Update metrics from performance hook
  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      fps: performanceMetrics.fps,
      memoryUsage: performanceMetrics.memoryUsage,
      renderTime: performanceMetrics.renderTime,
      isOptimizing
    }))
  }, [performanceMetrics, isOptimizing])

  // Generate performance recommendations
  const generateRecommendations = useCallback(() => {
    const newRecommendations: typeof recommendations = []

    // FPS recommendations
    if (metrics.fps < 30) {
      newRecommendations.push({
        id: "low-fps",
        type: "performance",
        severity: "high",
        message: `Low FPS detected (${metrics.fps.toFixed(1)}). Consider enabling virtualization or reducing widget count.`,
        action: () => updateSettings({ virtualization: true, mode: "high" })
      })
    } else if (metrics.fps < 45) {
      newRecommendations.push({
        id: "medium-fps",
        type: "performance",
        severity: "medium",
        message: `FPS could be improved (${metrics.fps.toFixed(1)}). Try enabling adaptive rendering.`,
        action: () => updateSettings({ adaptiveRendering: true })
      })
    }

    // Memory recommendations
    if (metrics.memoryUsage > 512) {
      newRecommendations.push({
        id: "high-memory",
        type: "memory",
        severity: "high",
        message: `High memory usage detected (${metrics.memoryUsage.toFixed(1)}MB). Enable memory optimization.`,
        action: () => updateSettings({ memoryOptimization: true, lazyLoading: true })
      })
    }

    // Widget count recommendations
    if (metrics.widgetCount > 50 && !settings.virtualization) {
      newRecommendations.push({
        id: "many-widgets",
        type: "rendering",
        severity: "medium",
        message: `Large number of widgets (${metrics.widgetCount}). Enable virtualization for better performance.`,
        action: () => updateSettings({ virtualization: true })
      })
    }

    // Rendering recommendations
    if (metrics.renderTime > 16 && !settings.batchUpdates) {
      newRecommendations.push({
        id: "slow-rendering",
        type: "rendering",
        severity: "medium",
        message: `Slow rendering detected (${metrics.renderTime.toFixed(1)}ms). Enable batch updates.`,
        action: () => updateSettings({ batchUpdates: true })
      })
    }

    // Auto-mode recommendations
    if (settings.mode === "auto" && (metrics.fps < 30 || metrics.memoryUsage > 512)) {
      newRecommendations.push({
        id: "auto-mode-insufficient",
        type: "performance",
        severity: "medium",
        message: "Auto mode may not be sufficient. Consider switching to high performance mode.",
        action: () => updateSettings({ mode: "high" })
      })
    }

    setRecommendations(newRecommendations)
  }, [metrics, settings])

  // Auto-generate recommendations when metrics change
  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  // Update settings function
  const updateSettings = useCallback((newSettings: Partial<GridPerformanceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    
    // Apply optimizations if enabled
    if (newSettings.enabled === true || (newSettings.enabled !== false && settings.enabled)) {
      enableOptimizations()
    } else if (newSettings.enabled === false) {
      disableOptimizations()
    }
  }, [settings.enabled, enableOptimizations, disableOptimizations, setSettings])

  // Enable optimization
  const enableOptimization = useCallback(() => {
    updateSettings({ enabled: true })
    setMetrics(prev => ({
      ...prev,
      lastOptimization: new Date().toISOString()
    }))
  }, [updateSettings])

  // Disable optimization
  const disableOptimization = useCallback(() => {
    updateSettings({ enabled: false })
    disableOptimizations()
  }, [updateSettings, disableOptimizations])

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings)
    setRecommendations([])
  }, [setSettings])

  // Apply recommendation
  const applyRecommendation = useCallback((id: string) => {
    const recommendation = recommendations.find(r => r.id === id)
    if (recommendation?.action) {
      recommendation.action()
      setRecommendations(prev => prev.filter(r => r.id !== id))
    }
  }, [recommendations])

  // Dismiss recommendation
  const dismissRecommendation = useCallback((id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id))
  }, [])

  // Monitor widget count from DOM
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const widgets = document.querySelectorAll('[data-widget-id]')
      const visibleWidgets = document.querySelectorAll('[data-widget-id]:not([data-virtualized="true"])')
      
      setMetrics(prev => ({
        ...prev,
        widgetCount: widgets.length,
        visibleWidgets: visibleWidgets.length
      }))
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-widget-id', 'data-virtualized']
    })

    return () => observer.disconnect()
  }, [])

  // Performance monitoring interval
  useEffect(() => {
    if (!settings.enabled) return

    const interval = setInterval(() => {
      // Performance monitoring logic
      const now = performance.now()
      const memoryInfo = (performance as any).memory
      
      if (memoryInfo) {
        const memoryUsage = memoryInfo.usedJSHeapSize / 1024 / 1024 // MB
        setMetrics(prev => ({
          ...prev,
          memoryUsage
        }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [settings.enabled])

  const contextValue: GridPerformanceContextType = {
    state: {
      settings,
      metrics,
      recommendations
    },
    updateSettings,
    enableOptimization,
    disableOptimization,
    resetToDefaults,
    generateRecommendations,
    applyRecommendation,
    dismissRecommendation
  }

  return (
    <GridPerformanceContext.Provider value={contextValue}>
      {children}
    </GridPerformanceContext.Provider>
  )
}
