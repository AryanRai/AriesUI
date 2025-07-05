"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Activity, 
  Zap, 
  MemoryStick, 
  Clock, 
  Eye, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Gauge,
  Grid3X3,
  Timer,
  X
} from "lucide-react"
import { useGridPerformance } from "@/components/grid-performance-provider"

interface PerformanceDashboardProps {
  onClose: () => void
  className?: string
}

export function PerformanceDashboard({ onClose, className = "" }: PerformanceDashboardProps) {
  const {
    state: { settings, metrics, recommendations },
    updateSettings,
    enableOptimization,
    disableOptimization,
    resetToDefaults,
    generateRecommendations,
    applyRecommendation,
    dismissRecommendation
  } = useGridPerformance()

  const [activeTab, setActiveTab] = useState("overview")
  const [fpsHistory, setFpsHistory] = useState<number[]>([])
  const [memoryHistory, setMemoryHistory] = useState<number[]>([])

  // Track performance history
  useEffect(() => {
    const interval = setInterval(() => {
      setFpsHistory(prev => [...prev.slice(-19), metrics.fps])
      setMemoryHistory(prev => [...prev.slice(-19), metrics.memoryUsage])
    }, 1000)

    return () => clearInterval(interval)
  }, [metrics.fps, metrics.memoryUsage])

  // Performance score calculation
  const getPerformanceScore = () => {
    const fpsScore = Math.min(100, (metrics.fps / 60) * 100)
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / 1024) * 100)
    const widgetScore = Math.max(0, 100 - (metrics.widgetCount / 200) * 100)
    
    return Math.round((fpsScore + memoryScore + widgetScore) / 3)
  }

  const performanceScore = getPerformanceScore()

  // Get performance status
  const getPerformanceStatus = () => {
    if (performanceScore >= 80) return { status: "excellent", color: "text-green-500", icon: CheckCircle }
    if (performanceScore >= 60) return { status: "good", color: "text-blue-500", icon: CheckCircle }
    if (performanceScore >= 40) return { status: "fair", color: "text-yellow-500", icon: AlertTriangle }
    return { status: "poor", color: "text-red-500", icon: XCircle }
  }

  const performanceStatus = getPerformanceStatus()

  // Render mini chart
  const renderMiniChart = (data: number[], color: string, max: number) => {
    if (data.length < 2) return null
    
    const width = 100
    const height = 30
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - (value / max) * height
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width={width} height={height} className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          className="opacity-80"
        />
      </svg>
    )
  }

  return (
    <Card className={`w-96 max-h-[600px] overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Dashboard
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Performance Score */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <performanceStatus.icon className={`h-5 w-5 ${performanceStatus.color}`} />
            <span className={`text-xl font-bold ${performanceStatus.color}`}>
              {performanceScore}
            </span>
          </div>
          <Progress value={performanceScore} className="w-full" />
          <p className="text-sm text-muted-foreground mt-1">
            Performance Score - {performanceStatus.status}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">FPS</span>
            </div>
            <div className="text-lg font-bold">{metrics.fps.toFixed(1)}</div>
            {renderMiniChart(fpsHistory, "#3b82f6", 60)}
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MemoryStick className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Memory</span>
            </div>
            <div className="text-lg font-bold">{metrics.memoryUsage.toFixed(1)}MB</div>
            {renderMiniChart(memoryHistory, "#10b981", 1024)}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Performance Recommendations:</p>
                {recommendations.slice(0, 2).map((rec) => (
                  <div key={rec.id} className="flex items-start justify-between gap-2">
                    <p className="text-sm">{rec.message}</p>
                    <div className="flex gap-1">
                      {rec.action && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => applyRecommendation(rec.id)}
                        >
                          Fix
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => dismissRecommendation(rec.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Widgets</Label>
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{metrics.widgetCount}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Visible</Label>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{metrics.visibleWidgets}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Render Time</Label>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{metrics.renderTime.toFixed(1)}ms</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Optimizing</Label>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={metrics.isOptimizing ? "default" : "secondary"} className="text-xs">
                    {metrics.isOptimizing ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="optimization-enabled">Performance Optimization</Label>
                <Switch
                  id="optimization-enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => 
                    checked ? enableOptimization() : disableOptimization()
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label>Performance Mode</Label>
                <div className="flex gap-2">
                  {["auto", "balanced", "high"].map((mode) => (
                    <Button
                      key={mode}
                      variant={settings.mode === mode ? "default" : "outline"}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => updateSettings({ mode: mode as any })}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Target FPS: {settings.targetFPS}</Label>
                <Slider
                  value={[settings.targetFPS]}
                  onValueChange={([value]) => updateSettings({ targetFPS: value })}
                  max={120}
                  min={15}
                  step={15}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="virtualization">Virtualization</Label>
                  <Switch
                    id="virtualization"
                    checked={settings.virtualization}
                    onCheckedChange={(checked) => updateSettings({ virtualization: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="lazy-loading">Lazy Loading</Label>
                  <Switch
                    id="lazy-loading"
                    checked={settings.lazyLoading}
                    onCheckedChange={(checked) => updateSettings({ lazyLoading: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="adaptive-rendering">Adaptive Rendering</Label>
                  <Switch
                    id="adaptive-rendering"
                    checked={settings.adaptiveRendering}
                    onCheckedChange={(checked) => updateSettings({ adaptiveRendering: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="batch-updates">Batch Updates</Label>
                  <Switch
                    id="batch-updates"
                    checked={settings.batchUpdates}
                    onCheckedChange={(checked) => updateSettings({ batchUpdates: checked })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Max Widgets: {settings.maxWidgets}</Label>
                <Slider
                  value={[settings.maxWidgets]}
                  onValueChange={([value]) => updateSettings({ maxWidgets: value })}
                  max={500}
                  min={50}
                  step={50}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Render Distance: {settings.renderDistance}px</Label>
                <Slider
                  value={[settings.renderDistance]}
                  onValueChange={([value]) => updateSettings({ renderDistance: value })}
                  max={2000}
                  min={500}
                  step={100}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Update Throttling: {settings.updateThrottling}ms</Label>
                <Slider
                  value={[settings.updateThrottling]}
                  onValueChange={([value]) => updateSettings({ updateThrottling: value })}
                  max={100}
                  min={8}
                  step={8}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="memory-optimization">Memory Optimization</Label>
                <Switch
                  id="memory-optimization"
                  checked={settings.memoryOptimization}
                  onCheckedChange={(checked) => updateSettings({ memoryOptimization: checked })}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={generateRecommendations}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Analyze
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={resetToDefaults}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
