"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  X,
  Download,
  Upload,
  Cpu,
  Smartphone,
  Monitor,
  Wifi,
  HardDrive
} from "lucide-react"
import { useAppPerformance } from "@/components/app-performance-provider"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { PerformanceDashboard } from "@/components/performance-dashboard"

interface PerformanceControlPanelProps {
  isOpen: boolean
  onClose: () => void
  onMinimize?: () => void
}

export function PerformanceControlPanel({ isOpen, onClose, onMinimize }: PerformanceControlPanelProps) {
  const {
    state: { settings, metrics, deviceCapabilities, recommendations },
    updateSettings,
    enableOptimization,
    disableOptimization,
    optimizeForDevice,
    clearOptimizations,
    generateRecommendations,
    applyAllRecommendations,
    resetToOptimal,
    exportDiagnostics
  } = useAppPerformance()

  const [activeTab, setActiveTab] = useState("overview")
  const [showAdvanced, setShowAdvanced] = useState(false)

  if (!isOpen) return null

  // Performance score calculation
  const getPerformanceScore = () => {
    const fpsScore = Math.min(100, (metrics.fps / 60) * 100)
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / 1024) * 100)
    const componentScore = Math.max(0, 100 - (metrics.componentCount / 200) * 100)
    
    return Math.round((fpsScore + memoryScore + componentScore) / 3)
  }

  const performanceScore = getPerformanceScore()

  // Get performance status
  const getPerformanceStatus = () => {
    if (performanceScore >= 80) return { status: "Excellent", color: "text-green-500", bgColor: "bg-green-500/10" }
    if (performanceScore >= 60) return { status: "Good", color: "text-blue-500", bgColor: "bg-blue-500/10" }
    if (performanceScore >= 40) return { status: "Fair", color: "text-yellow-500", bgColor: "bg-yellow-500/10" }
    return { status: "Poor", color: "text-red-500", bgColor: "bg-red-500/10" }
  }

  const performanceStatus = getPerformanceStatus()

  // Device capability icons
  const getDeviceIcon = () => {
    if (deviceCapabilities.isMobile) return <Smartphone className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  const downloadDiagnostics = () => {
    const diagnostics = exportDiagnostics()
    const blob = new Blob([diagnostics], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aries-diagnostics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Performance Control Panel
            </CardTitle>
            <div className="flex items-center gap-2">
              {onMinimize && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMinimize}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Performance Score */}
            <Card className={`p-4 ${performanceStatus.bgColor}`}>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gauge className={`h-6 w-6 ${performanceStatus.color}`} />
                  <span className={`text-2xl font-bold ${performanceStatus.color}`}>
                    {performanceScore}
                  </span>
                </div>
                <Progress value={performanceScore} className="w-full mb-2" />
                <p className="text-sm font-medium">{performanceStatus.status}</p>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">FPS</span>
                  </div>
                  <span className="font-mono font-bold">{metrics.fps.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MemoryStick className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Memory</span>
                  </div>
                  <span className="font-mono font-bold">{metrics.memoryUsage.toFixed(1)}MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Components</span>
                  </div>
                  <span className="font-mono font-bold">{metrics.componentCount}</span>
                </div>
              </div>
            </Card>

            {/* Device Info */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  {getDeviceIcon()}
                  <span className="font-medium text-sm">Device Info</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Cores:</span>
                    <span className="font-mono">{deviceCapabilities.cores}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory:</span>
                    <span className="font-mono">{(deviceCapabilities.maxMemory / 1024).toFixed(1)}GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connection:</span>
                    <Badge variant="outline" className="text-xs">{deviceCapabilities.connectionType}</Badge>
                  </div>
                  {deviceCapabilities.isLowEnd && (
                    <Badge variant="outline" className="text-xs">Low-end device</Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Recommendations Alert */}
          {recommendations.length > 0 && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    {recommendations.length} performance recommendation{recommendations.length > 1 ? 's' : ''} available
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyAllRecommendations}
                      className="text-xs"
                    >
                      Apply All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("recommendations")}
                      className="text-xs"
                    >
                      View
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Controls */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[400px] mt-4">
              <TabsContent value="overview" className="mt-0 space-y-4">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button
                    onClick={settings.enabled ? disableOptimization : enableOptimization}
                    variant={settings.enabled ? "destructive" : "default"}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <Zap className="h-4 w-4" />
                    <span className="text-xs">
                      {settings.enabled ? "Disable" : "Enable"}
                    </span>
                  </Button>
                  
                  <Button
                    onClick={optimizeForDevice}
                    variant="outline"
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-xs">Auto-Optimize</span>
                  </Button>
                  
                  <Button
                    onClick={generateRecommendations}
                    variant="outline"
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Analyze</span>
                  </Button>
                  
                  <Button
                    onClick={resetToOptimal}
                    variant="outline"
                    className="flex flex-col items-center gap-1 h-auto py-3"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="text-xs">Reset</span>
                  </Button>
                </div>

                {/* Performance Mode */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Performance Mode</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {["auto", "balanced", "high", "eco"].map((mode) => (
                      <Button
                        key={mode}
                        variant={settings.mode === mode ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSettings({ mode: mode as any })}
                        className="text-xs"
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Frame Rate Target</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[settings.targetFPS]}
                        onValueChange={([value]) => updateSettings({ targetFPS: value })}
                        max={120}
                        min={15}
                        step={15}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono w-12">{settings.targetFPS}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Memory Threshold</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[settings.memoryThreshold]}
                        onValueChange={([value]) => updateSettings({ memoryThreshold: value })}
                        max={2048}
                        min={128}
                        step={128}
                        className="flex-1"
                      />
                      <span className="text-sm font-mono w-16">{settings.memoryThreshold}MB</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="mt-0 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Rendering Settings */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-base">Rendering</h3>
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
                        <Label htmlFor="level-of-detail">Level of Detail</Label>
                        <Switch
                          id="level-of-detail"
                          checked={settings.levelOfDetail}
                          onCheckedChange={(checked) => updateSettings({ levelOfDetail: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Performance Settings */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-base">Performance</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gpu-acceleration">GPU Acceleration</Label>
                        <Switch
                          id="gpu-acceleration"
                          checked={settings.gpuAcceleration}
                          onCheckedChange={(checked) => updateSettings({ gpuAcceleration: checked })}
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
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="batch-updates">Batch Updates</Label>
                        <Switch
                          id="batch-updates"
                          checked={settings.batchUpdates}
                          onCheckedChange={(checked) => updateSettings({ batchUpdates: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="spatial-indexing">Spatial Indexing</Label>
                        <Switch
                          id="spatial-indexing"
                          checked={settings.spatialIndexing}
                          onCheckedChange={(checked) => updateSettings({ spatialIndexing: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-base">Advanced Settings</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      {showAdvanced ? "Hide" : "Show"}
                    </Button>
                  </div>
                  
                  {showAdvanced && (
                    <div className="space-y-4">
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
                        <Label>Batch Size: {settings.batchSize}</Label>
                        <Slider
                          value={[settings.batchSize]}
                          onValueChange={([value]) => updateSettings({ batchSize: value })}
                          max={50}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Debounce Time: {settings.debounceTime}ms</Label>
                        <Slider
                          value={[settings.debounceTime]}
                          onValueChange={([value]) => updateSettings({ debounceTime: value })}
                          max={100}
                          min={8}
                          step={8}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="recommendations" className="mt-0">
                <div className="space-y-3">
                  {recommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p>No performance issues detected!</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateRecommendations}
                        className="mt-3"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Analyze Again
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">Recommendations ({recommendations.length})</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={applyAllRecommendations}
                        >
                          Apply All
                        </Button>
                      </div>
                      
                      {recommendations.map((rec) => (
                        <Alert key={rec.id}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    variant={rec.type === "critical" ? "destructive" : rec.type === "warning" ? "secondary" : "outline"}
                                    className="text-xs"
                                  >
                                    {rec.type}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {rec.category}
                                  </Badge>
                                  <Badge 
                                    variant={rec.impact === "high" ? "destructive" : rec.impact === "medium" ? "secondary" : "outline"}
                                    className="text-xs"
                                  >
                                    {rec.impact} impact
                                  </Badge>
                                </div>
                                <p className="text-sm">{rec.message}</p>
                              </div>
                              {rec.action && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={rec.action}
                                  className="text-xs"
                                >
                                  Fix
                                </Button>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="monitoring" className="mt-0">
                <PerformanceMonitor onClose={() => {}} className="w-full h-full" />
              </TabsContent>
              
              <TabsContent value="diagnostics" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={downloadDiagnostics}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Diagnostics
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={clearOptimizations}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Clear All
                  </Button>
                </div>
                
                {/* Diagnostic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium">System Information</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>User Agent:</span>
                        <span className="font-mono text-xs truncate ml-2">{navigator.userAgent.slice(0, 50)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform:</span>
                        <span className="font-mono">{navigator.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Language:</span>
                        <span className="font-mono">{navigator.language}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Screen:</span>
                        <span className="font-mono">{screen.width}x{screen.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Viewport:</span>
                        <span className="font-mono">{window.innerWidth}x{window.innerHeight}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pixel Ratio:</span>
                        <span className="font-mono">{window.devicePixelRatio}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
