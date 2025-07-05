"use client"

import React, { useState, useEffect, useCallback, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Zap, 
  Eye, 
  EyeOff,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePerformanceOptimization } from '@/hooks/use-performance-optimization'

interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsage: number
  renderTime: number
  itemCount: number
  visibleItemCount: number
  cpuUsage?: number
  networkLatency?: number
}

interface PerformanceMonitorProps {
  className?: string
  compact?: boolean
  showRecommendations?: boolean
  onOptimizationToggle?: (enabled: boolean) => void
}

/**
 * Real-time performance monitoring component
 */
export const PerformanceMonitor = memo<PerformanceMonitorProps>(({
  className,
  compact = false,
  showRecommendations = true,
  onOptimizationToggle
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    renderTime: 0,
    itemCount: 0,
    visibleItemCount: 0
  })

  const {
    performanceMetrics,
    isPerformanceMode,
    recommendations,
    config
  } = usePerformanceOptimization()

  // Update metrics from performance hook
  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      ...performanceMetrics,
      frameTime: performanceMetrics.fps > 0 ? 1000 / performanceMetrics.fps : 0
    }))
  }, [performanceMetrics])

  // Performance status calculation
  const getPerformanceStatus = useCallback((value: number, thresholds: { good: number, fair: number }) => {
    if (value >= thresholds.good) return 'good'
    if (value >= thresholds.fair) return 'fair'
    return 'poor'
  }, [])

  const performanceStatus = {
    fps: getPerformanceStatus(metrics.fps, { good: 45, fair: 30 }),
    memory: getPerformanceStatus(100 - metrics.memoryUsage, { good: 50, fair: 20 }),
    render: getPerformanceStatus(100 - metrics.renderTime, { good: 80, fair: 50 })
  }

  const overallStatus = Object.values(performanceStatus).includes('poor') 
    ? 'poor' 
    : Object.values(performanceStatus).includes('fair') 
    ? 'fair' 
    : 'good'

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500'
      case 'fair': return 'text-yellow-500'
      case 'poor': return 'text-red-500'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-3 w-3" />
      case 'fair': return <TrendingDown className="h-3 w-3" />
      case 'poor': return <AlertTriangle className="h-3 w-3" />
      default: return <Activity className="h-3 w-3" />
    }
  }

  // Compact view
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(!isVisible)}
          className={cn(
            "h-8 px-2 gap-1",
            getStatusColor(overallStatus)
          )}
        >
          {getStatusIcon(overallStatus)}
          <span className="text-xs">{metrics.fps} FPS</span>
        </Button>
        
        {isPerformanceMode && (
          <Badge variant="secondary" className="text-xs">
            PERF
          </Badge>
        )}
      </div>
    )
  }

  if (!isVisible && compact) return null

  return (
    <Card className={cn("w-80", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance Monitor
          </CardTitle>
          <div className="flex items-center gap-1">
            {isPerformanceMode && (
              <Badge variant="destructive" className="text-xs">
                Performance Mode
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(!isVisible)}
              className="h-6 w-6 p-0"
            >
              {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isVisible && (
        <CardContent className="space-y-3">
          {/* FPS Metric */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Frame Rate
              </span>
              <span className={cn("font-mono", getStatusColor(performanceStatus.fps))}>
                {metrics.fps} FPS
              </span>
            </div>
            <Progress 
              value={(metrics.fps / 60) * 100} 
              className="h-1"
            />
          </div>

          {/* Memory Usage */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Memory
              </span>
              <span className={cn("font-mono", getStatusColor(performanceStatus.memory))}>
                {metrics.memoryUsage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.memoryUsage} 
              className="h-1"
            />
          </div>

          {/* Render Time */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                Render Time
              </span>
              <span className={cn("font-mono", getStatusColor(performanceStatus.render))}>
                {metrics.renderTime.toFixed(1)}ms
              </span>
            </div>
            <Progress 
              value={Math.min((metrics.renderTime / 16.67) * 100, 100)} 
              className="h-1"
            />
          </div>

          {/* Item Count */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Items Rendered</span>
              <span className="font-mono">
                {metrics.visibleItemCount} / {metrics.itemCount}
              </span>
            </div>
          </div>

          {/* Configuration Status */}
          <div className="pt-2 border-t space-y-1">
            <div className="text-xs font-medium mb-1">Optimizations</div>
            <div className="flex flex-wrap gap-1">
              {config.shouldVirtualize && (
                <Badge variant="outline" className="text-xs">Virtualization</Badge>
              )}
              {config.shouldLazyLoad && (
                <Badge variant="outline" className="text-xs">Lazy Loading</Badge>
              )}
              {config.shouldReduceAnimations && (
                <Badge variant="outline" className="text-xs">Reduced Animations</Badge>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {showRecommendations && recommendations.length > 0 && (
            <div className="pt-2 border-t space-y-1">
              <div className="text-xs font-medium mb-1">Recommendations</div>
              {recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0 text-yellow-500" />
                  {rec}
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOptimizationToggle?.(!isPerformanceMode)}
              className="w-full text-xs"
            >
              {isPerformanceMode ? 'Disable' : 'Enable'} Performance Mode
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
})

PerformanceMonitor.displayName = 'PerformanceMonitor'

export default PerformanceMonitor
