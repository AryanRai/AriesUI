"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { usePerformanceOptimization } from "@/hooks/use-performance-optimization"
import { useVirtualGrid } from "@/hooks/use-virtual-grid"

// Types
interface AppPerformanceSettings {
  enabled: boolean
  mode: "auto" | "balanced" | "high" | "eco"
  adaptiveRendering: boolean
  lazyLoading: boolean
  virtualization: boolean
  memoryOptimization: boolean
  gpuAcceleration: boolean
  batchUpdates: boolean
  spatialIndexing: boolean
  levelOfDetail: boolean
  viewportCulling: boolean
  targetFPS: number
  memoryThreshold: number
  renderDistance: number
  batchSize: number
  debounceTime: number
}

interface AppPerformanceMetrics {
  fps: number
  memoryUsage: number
  renderTime: number
  cpuUsage: number
  gpuUsage: number
  networkLatency: number
  componentCount: number
  visibleComponents: number
  batchedUpdates: number
  culledComponents: number
  lastOptimization: string | null
}

interface AppPerformanceState {
  settings: AppPerformanceSettings
  metrics: AppPerformanceMetrics
  isOptimizing: boolean
  deviceCapabilities: {
    isLowEnd: boolean
    isMobile: boolean
    hasGPUAcceleration: boolean
    maxMemory: number
    cores: number
    connectionType: string
  }
  recommendations: Array<{
    id: string
    type: "critical" | "warning" | "info"
    category: "performance" | "memory" | "rendering" | "network"
    message: string
    impact: "high" | "medium" | "low"
    action?: () => void
  }>
}

interface AppPerformanceContextType {
  state: AppPerformanceState
  updateSettings: (settings: Partial<AppPerformanceSettings>) => void
  enableOptimization: () => void
  disableOptimization: () => void
  optimizeForDevice: () => void
  clearOptimizations: () => void
  generateRecommendations: () => void
  applyAllRecommendations: () => void
  resetToOptimal: () => void
  exportDiagnostics: () => string
}

const defaultSettings: AppPerformanceSettings = {
  enabled: true,
  mode: "auto",
  adaptiveRendering: true,
  lazyLoading: true,
  virtualization: true,
  memoryOptimization: true,
  gpuAcceleration: true,
  batchUpdates: true,
  spatialIndexing: true,
  levelOfDetail: true,
  viewportCulling: true,
  targetFPS: 60,
  memoryThreshold: 512,
  renderDistance: 1000,
  batchSize: 10,
  debounceTime: 16
}

const AppPerformanceContext = createContext<AppPerformanceContextType | undefined>(undefined)

export function useAppPerformance() {
  const context = useContext(AppPerformanceContext)
  if (!context) {
    throw new Error("useAppPerformance must be used within an AppPerformanceProvider")
  }
  return context
}

interface AppPerformanceProviderProps {
  children: React.ReactNode
}

export function AppPerformanceProvider({ children }: AppPerformanceProviderProps) {
  const [settings, setSettings] = useLocalStorage<AppPerformanceSettings>("app-performance-settings", defaultSettings)
  const [metrics, setMetrics] = useState<AppPerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    cpuUsage: 0,
    gpuUsage: 0,
    networkLatency: 0,
    componentCount: 0,
    visibleComponents: 0,
    batchedUpdates: 0,
    culledComponents: 0,
    lastOptimization: null
  })
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    isLowEnd: false,
    isMobile: false,
    hasGPUAcceleration: false,
    maxMemory: 0,
    cores: 0,
    connectionType: "unknown"
  })
  const [recommendations, setRecommendations] = useState<AppPerformanceState['recommendations']>([])

  // Performance optimization hook
  const {
    isOptimizing: hookIsOptimizing,
    performanceMetrics,
    enableOptimizations,
    disableOptimizations,
    getBatchedUpdates,
    scheduleUpdate
  } = usePerformanceOptimization({
    targetFPS: settings.targetFPS,
    memoryThreshold: settings.memoryThreshold,
    batchSize: settings.batchSize
  })

  // Device capability detection
  useEffect(() => {
    const detectDeviceCapabilities = () => {
      const ua = navigator.userAgent
      const memory = (navigator as any).deviceMemory || 4
      const hardwareConcurrency = navigator.hardwareConcurrency || 4
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      // Mobile detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
      
      // Low-end device detection
      const isLowEnd = memory < 2 || hardwareConcurrency < 4 || 
                       (isMobile && (memory < 4 || hardwareConcurrency < 6))
      
      // GPU acceleration detection
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      const hasGPUAcceleration = !!gl
      
      setDeviceCapabilities({
        isLowEnd,
        isMobile,
        hasGPUAcceleration,
        maxMemory: memory * 1024, // Convert to MB
        cores: hardwareConcurrency,
        connectionType: connection?.effectiveType || 'unknown'
      })
    }
    
    detectDeviceCapabilities()
  }, [])

  // Auto-optimize based on device capabilities
  useEffect(() => {
    if (settings.mode === "auto") {
      optimizeForDevice()
    }
  }, [deviceCapabilities, settings.mode])

  // Performance metrics monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Update metrics from performance hook
      setMetrics(prev => ({
        ...prev,
        fps: performanceMetrics.fps,
        memoryUsage: performanceMetrics.memoryUsage,
        renderTime: performanceMetrics.renderTime,
        componentCount: document.querySelectorAll('[data-component]').length,
        visibleComponents: document.querySelectorAll('[data-component]:not([data-culled])').length,
        batchedUpdates: getBatchedUpdates?.().length || 0
      }))
      
      // Network latency estimation
      const startTime = performance.now()
      fetch('/api/ping', { method: 'HEAD' }).then(() => {
        const latency = performance.now() - startTime
        setMetrics(prev => ({ ...prev, networkLatency: latency }))
      }).catch(() => {})
      
      // Memory usage from performance API
      if ((performance as any).memory) {
        const memoryInfo = (performance as any).memory
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memoryInfo.usedJSHeapSize / 1024 / 1024
        }))
      }
      
    }, 1000)
    
    return () => clearInterval(interval)
  }, [performanceMetrics, getBatchedUpdates])

  // CSS class management based on settings
  useEffect(() => {
    const body = document.body
    const classes = [
      'aries-performance-mode',
      'aries-high-performance',
      'aries-virtualized',
      'aries-memory-optimized',
      'aries-gpu-accelerated',
      'aries-adaptive-fps',
      'aries-spatial-grid',
      'aries-lod-high',
      'aries-lod-medium',
      'aries-lod-low'
    ]
    
    // Remove all performance classes
    classes.forEach(cls => body.classList.remove(cls))
    
    if (!settings.enabled) return
    
    // Add appropriate classes based on settings
    body.classList.add('aries-performance-mode')
    
    if (settings.mode === "high") {
      body.classList.add('aries-high-performance')
    }
    
    if (settings.virtualization) {
      body.classList.add('aries-virtualized')
    }
    
    if (settings.memoryOptimization) {
      body.classList.add('aries-memory-optimized')
    }
    
    if (settings.gpuAcceleration) {
      body.classList.add('aries-gpu-accelerated')
    }
    
    if (settings.adaptiveRendering) {
      body.classList.add('aries-adaptive-fps')
    }
    
    if (settings.spatialIndexing) {
      body.classList.add('aries-spatial-grid')
    }
    
    // Level of detail based on performance
    if (metrics.fps > 50) {
      body.classList.add('aries-lod-high')
    } else if (metrics.fps > 30) {
      body.classList.add('aries-lod-medium')
    } else {
      body.classList.add('aries-lod-low')
    }
    
    // Set CSS variables
    body.style.setProperty('--target-fps', settings.targetFPS.toString())
    body.style.setProperty('--performance-multiplier', (60 / settings.targetFPS).toString())
    body.style.setProperty('--grid-size', '20px')
    
  }, [settings, metrics.fps])

  // Functions
  const updateSettings = useCallback((newSettings: Partial<AppPerformanceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [setSettings])

  const enableOptimization = useCallback(() => {
    setIsOptimizing(true)
    enableOptimizations()
    updateSettings({ enabled: true })
    setMetrics(prev => ({ ...prev, lastOptimization: new Date().toISOString() }))
  }, [enableOptimizations, updateSettings])

  const disableOptimization = useCallback(() => {
    setIsOptimizing(false)
    disableOptimizations()
    updateSettings({ enabled: false })
  }, [disableOptimizations, updateSettings])

  const optimizeForDevice = useCallback(() => {
    const { isLowEnd, isMobile, hasGPUAcceleration, maxMemory, cores, connectionType } = deviceCapabilities
    
    let optimizedSettings: Partial<AppPerformanceSettings> = {}
    
    if (isLowEnd) {
      optimizedSettings = {
        mode: "eco",
        targetFPS: 30,
        memoryThreshold: 256,
        batchSize: 5,
        renderDistance: 500,
        gpuAcceleration: hasGPUAcceleration,
        levelOfDetail: true,
        viewportCulling: true
      }
    } else if (isMobile) {
      optimizedSettings = {
        mode: "balanced",
        targetFPS: 45,
        memoryThreshold: 384,
        batchSize: 8,
        renderDistance: 750,
        gpuAcceleration: hasGPUAcceleration,
        adaptiveRendering: true
      }
    } else if (cores >= 8 && maxMemory >= 8192) {
      optimizedSettings = {
        mode: "high",
        targetFPS: 60,
        memoryThreshold: 1024,
        batchSize: 20,
        renderDistance: 2000,
        gpuAcceleration: true,
        levelOfDetail: false
      }
    } else {
      optimizedSettings = {
        mode: "balanced",
        targetFPS: 60,
        memoryThreshold: 512,
        batchSize: 10,
        renderDistance: 1000,
        gpuAcceleration: hasGPUAcceleration
      }
    }
    
    updateSettings(optimizedSettings)
  }, [deviceCapabilities, updateSettings])

  const clearOptimizations = useCallback(() => {
    document.body.className = document.body.className.replace(/aries-\w+/g, '')
    document.body.style.removeProperty('--target-fps')
    document.body.style.removeProperty('--performance-multiplier')
    document.body.style.removeProperty('--grid-size')
    disableOptimization()
  }, [disableOptimization])

  const generateRecommendations = useCallback(() => {
    const newRecommendations: AppPerformanceState['recommendations'] = []
    
    // Critical recommendations
    if (metrics.fps < 20) {
      newRecommendations.push({
        id: "critical-fps",
        type: "critical",
        category: "performance",
        message: "Critical FPS drop detected. Consider reducing widget count or enabling high performance mode.",
        impact: "high",
        action: () => updateSettings({ mode: "high", targetFPS: 30 })
      })
    }
    
    if (metrics.memoryUsage > 1024) {
      newRecommendations.push({
        id: "critical-memory",
        type: "critical",
        category: "memory",
        message: "Memory usage is critically high. Enable memory optimization immediately.",
        impact: "high",
        action: () => updateSettings({ memoryOptimization: true, lazyLoading: true })
      })
    }
    
    // Warning recommendations
    if (metrics.fps < 45 && metrics.fps >= 20) {
      newRecommendations.push({
        id: "warning-fps",
        type: "warning",
        category: "performance",
        message: "FPS is below optimal. Consider enabling adaptive rendering.",
        impact: "medium",
        action: () => updateSettings({ adaptiveRendering: true })
      })
    }
    
    if (metrics.memoryUsage > 512 && metrics.memoryUsage <= 1024) {
      newRecommendations.push({
        id: "warning-memory",
        type: "warning",
        category: "memory",
        message: "Memory usage is elevated. Enable memory optimization.",
        impact: "medium",
        action: () => updateSettings({ memoryOptimization: true })
      })
    }
    
    // Info recommendations
    if (metrics.componentCount > 100 && !settings.virtualization) {
      newRecommendations.push({
        id: "info-virtualization",
        type: "info",
        category: "rendering",
        message: "Large component count detected. Enable virtualization for better performance.",
        impact: "low",
        action: () => updateSettings({ virtualization: true })
      })
    }
    
    if (deviceCapabilities.isLowEnd && settings.mode !== "eco") {
      newRecommendations.push({
        id: "info-eco-mode",
        type: "info",
        category: "performance",
        message: "Low-end device detected. Consider switching to eco mode.",
        impact: "low",
        action: () => updateSettings({ mode: "eco" })
      })
    }
    
    setRecommendations(newRecommendations)
  }, [metrics, settings, deviceCapabilities, updateSettings])

  const applyAllRecommendations = useCallback(() => {
    recommendations.forEach(rec => {
      if (rec.action) {
        rec.action()
      }
    })
    setRecommendations([])
  }, [recommendations])

  const resetToOptimal = useCallback(() => {
    optimizeForDevice()
    generateRecommendations()
  }, [optimizeForDevice, generateRecommendations])

  const exportDiagnostics = useCallback(() => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      settings,
      metrics,
      deviceCapabilities,
      recommendations,
      userAgent: navigator.userAgent,
      performance: {
        memory: (performance as any).memory,
        timing: performance.timing,
        navigation: performance.navigation
      }
    }
    
    return JSON.stringify(diagnostics, null, 2)
  }, [settings, metrics, deviceCapabilities, recommendations])

  // Auto-generate recommendations
  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  const contextValue: AppPerformanceContextType = {
    state: {
      settings,
      metrics,
      isOptimizing: isOptimizing || hookIsOptimizing,
      deviceCapabilities,
      recommendations
    },
    updateSettings,
    enableOptimization,
    disableOptimization,
    optimizeForDevice,
    clearOptimizations,
    generateRecommendations,
    applyAllRecommendations,
    resetToOptimal,
    exportDiagnostics
  }

  return (
    <AppPerformanceContext.Provider value={contextValue}>
      {children}
    </AppPerformanceContext.Provider>
  )
}
