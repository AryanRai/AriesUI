"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

interface PerformanceConfig {
  enableVirtualization?: boolean
  enableLazyLoading?: boolean
  maxRenderBatch?: number
  throttleMs?: number
  debounceMs?: number
  maxItemsPerFrame?: number
}

interface PerformanceMetrics {
  fps: number
  renderTime: number
  memoryUsage: number
  itemCount: number
  visibleItemCount: number
}

/**
 * Performance optimization hook for grid components
 * Provides adaptive performance features based on system capabilities
 */
export function usePerformanceOptimization(config: PerformanceConfig = {}) {
  const {
    enableVirtualization = true,
    enableLazyLoading = true,
    maxRenderBatch = 50,
    throttleMs = 16,
    debounceMs = 100,
    maxItemsPerFrame = 10
  } = config

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    memoryUsage: 0,
    itemCount: 0,
    visibleItemCount: 0
  })

  const [isPerformanceMode, setIsPerformanceMode] = useState(false)
  const frameTimeRef = useRef<number[]>([])
  const lastFrameTime = useRef(performance.now())
  const renderBatchRef = useRef<(() => void)[]>([])
  const isThrottling = useRef(false)

  // FPS monitoring
  useEffect(() => {
    let animationId: number

    const measureFPS = () => {
      const now = performance.now()
      const deltaTime = now - lastFrameTime.current
      lastFrameTime.current = now

      // Keep last 60 frame times for accurate FPS calculation
      frameTimeRef.current.push(deltaTime)
      if (frameTimeRef.current.length > 60) {
        frameTimeRef.current.shift()
      }

      // Calculate average FPS
      const averageFrameTime = frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length
      const fps = Math.round(1000 / averageFrameTime)

      setPerformanceMetrics(prev => ({
        ...prev,
        fps: Math.min(fps, 60) // Cap at 60 FPS
      }))

      // Enable performance mode if FPS drops below 30
      setIsPerformanceMode(fps < 30)

      animationId = requestAnimationFrame(measureFPS)
    }

    animationId = requestAnimationFrame(measureFPS)

    return () => cancelAnimationFrame(animationId)
  }, [])

  // Memory usage monitoring (approximation)
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = memory.usedJSHeapSize / 1024 / 1024
        const totalMB = memory.totalJSHeapSize / 1024 / 1024
        const usage = (usedMB / totalMB) * 100

        setPerformanceMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(usage)
        }))
      }
    }

    const interval = setInterval(measureMemory, 2000)
    return () => clearInterval(interval)
  }, [])

  // Adaptive throttle function that adjusts based on performance
  const adaptiveThrottle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    baseDelay: number = throttleMs
  ) => {
    let timeoutId: NodeJS.Timeout | null = null
    let lastExecTime = 0

    return (...args: Parameters<T>) => {
      const now = performance.now()
      
      // Increase delay if performance is poor
      const adjustedDelay = isPerformanceMode ? baseDelay * 2 : baseDelay
      
      if (now - lastExecTime > adjustedDelay) {
        func(...args)
        lastExecTime = now
      } else {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          func(...args)
          lastExecTime = performance.now()
        }, adjustedDelay - (now - lastExecTime))
      }
    }
  }, [isPerformanceMode, throttleMs])

  // Batched rendering for expensive operations
  const batchRender = useCallback((renderFunction: () => void) => {
    renderBatchRef.current.push(renderFunction)

    if (!isThrottling.current) {
      isThrottling.current = true
      
      requestAnimationFrame(() => {
        const startTime = performance.now()
        let processedCount = 0
        
        // Process batch with frame budget
        while (
          renderBatchRef.current.length > 0 && 
          processedCount < maxItemsPerFrame &&
          (performance.now() - startTime) < 8 // 8ms budget per frame
        ) {
          const renderFunc = renderBatchRef.current.shift()
          if (renderFunc) {
            renderFunc()
            processedCount++
          }
        }

        const renderTime = performance.now() - startTime
        setPerformanceMetrics(prev => ({
          ...prev,
          renderTime: Math.round(renderTime)
        }))

        // Continue processing if there are more items
        if (renderBatchRef.current.length > 0) {
          setTimeout(() => {
            isThrottling.current = false
            if (renderBatchRef.current.length > 0) {
              batchRender(() => {}) // Trigger next batch
            }
          }, isPerformanceMode ? 32 : 16) // Slower in performance mode
        } else {
          isThrottling.current = false
        }
      })
    }
  }, [maxItemsPerFrame, isPerformanceMode])

  // Lazy loading scheduler
  const scheduleTask = useCallback((
    task: () => void,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => {
    const delay = isPerformanceMode 
      ? (priority === 'high' ? 0 : priority === 'normal' ? 100 : 300)
      : (priority === 'high' ? 0 : priority === 'normal' ? 16 : 100)

    setTimeout(task, delay)
  }, [isPerformanceMode])

  // Intersection observer for lazy loading
  const createLazyObserver = useCallback((
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ) => {
    if (!enableLazyLoading) return null

    const defaultOptions: IntersectionObserverInit = {
      rootMargin: '100px',
      threshold: 0.1,
      ...options
    }

    return new IntersectionObserver(callback, defaultOptions)
  }, [enableLazyLoading])

  // Resource cleanup helper
  const cleanupResources = useCallback(() => {
    renderBatchRef.current = []
    frameTimeRef.current = []
    isThrottling.current = false
  }, [])

  // Performance recommendations
  const recommendations = useMemo(() => {
    const recs: string[] = []
    
    if (performanceMetrics.fps < 30) {
      recs.push('Enable performance mode to reduce visual effects')
    }
    
    if (performanceMetrics.memoryUsage > 80) {
      recs.push('Consider reducing the number of visible items')
    }
    
    if (performanceMetrics.itemCount > 1000) {
      recs.push('Enable virtualization for better performance')
    }
    
    if (performanceMetrics.renderTime > 16) {
      recs.push('Optimize rendering operations')
    }

    return recs
  }, [performanceMetrics])

  return {
    performanceMetrics,
    isPerformanceMode,
    adaptiveThrottle,
    batchRender,
    scheduleTask,
    createLazyObserver,
    cleanupResources,
    recommendations,
    config: {
      shouldVirtualize: enableVirtualization && (performanceMetrics.itemCount > 100 || isPerformanceMode),
      shouldLazyLoad: enableLazyLoading,
      shouldReduceAnimations: isPerformanceMode,
      batchSize: isPerformanceMode ? Math.floor(maxRenderBatch / 2) : maxRenderBatch
    }
  }
}
