"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Thermometer,
  BarChart3,
  Activity,
  Gauge,
  Monitor,
  Zap,
  Plus,
  ChevronDown,
  Package,
  Cpu,
  Radio,
  Wifi,
  Database,
  LineChart,
  PieChart,
  TrendingUp,
  GripVertical,
  Minimize2,
  Maximize2,
} from "lucide-react"
import { useComms } from "@/components/comms-context"

interface WidgetTemplate {
  id: string
  type: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  defaultSize: { w: number; h: number }
  color: string
  mod: string
}

interface ModGroup {
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  version: string
  widgets: WidgetTemplate[]
  installed: boolean
}

const modGroups: ModGroup[] = [
  {
    name: "Core Widgets",
    description: "Essential system widgets",
    icon: Package,
    version: "1.0.0",
    installed: true,
    widgets: [
      {
        id: "sensor",
        type: "sensor",
        title: "Sensor Display",
        icon: Thermometer,
        description: "Display sensor readings",
        defaultSize: { w: 200, h: 150 },
        color: "bg-blue-500/20 border-blue-500/50",
        mod: "core",
      },
      {
        id: "status",
        type: "status",
        title: "Status Indicator",
        icon: Activity,
        description: "System status display",
        defaultSize: { w: 180, h: 120 },
        color: "bg-yellow-500/20 border-yellow-500/50",
        mod: "core",
      },
      {
        id: "monitor",
        type: "monitor",
        title: "System Monitor",
        icon: Monitor,
        description: "Hardware monitoring",
        defaultSize: { w: 250, h: 180 },
        color: "bg-red-500/20 border-red-500/50",
        mod: "core",
      },
    ],
  },
  {
    name: "Chart Widgets Pro",
    description: "Advanced data visualization",
    icon: BarChart3,
    version: "2.1.0",
    installed: true,
    widgets: [
      {
        id: "chart",
        type: "chart",
        title: "Line Chart",
        icon: LineChart,
        description: "Real-time line charts",
        defaultSize: { w: 300, h: 200 },
        color: "bg-green-500/20 border-green-500/50",
        mod: "charts",
      },
      {
        id: "pie-chart",
        type: "pie-chart",
        title: "Pie Chart",
        icon: PieChart,
        description: "Circular data visualization",
        defaultSize: { w: 250, h: 250 },
        color: "bg-green-600/20 border-green-600/50",
        mod: "charts",
      },
      {
        id: "trend-chart",
        type: "trend-chart",
        title: "Trend Analysis",
        icon: TrendingUp,
        description: "Advanced trend visualization",
        defaultSize: { w: 350, h: 220 },
        color: "bg-green-700/20 border-green-700/50",
        mod: "charts",
      },
    ],
  },
  {
    name: "Hardware Monitor",
    description: "System performance widgets",
    icon: Cpu,
    version: "1.5.2",
    installed: true,
    widgets: [
      {
        id: "gauge",
        type: "gauge",
        title: "Performance Gauge",
        icon: Gauge,
        description: "Circular progress display",
        defaultSize: { w: 200, h: 200 },
        color: "bg-purple-500/20 border-purple-500/50",
        mod: "hardware",
      },
      {
        id: "power",
        type: "power",
        title: "Power Meter",
        icon: Zap,
        description: "Power consumption display",
        defaultSize: { w: 200, h: 160 },
        color: "bg-orange-500/20 border-orange-500/50",
        mod: "hardware",
      },
    ],
  },
  {
    name: "Network Tools",
    description: "Network monitoring widgets",
    icon: Wifi,
    version: "0.9.1",
    installed: false,
    widgets: [
      {
        id: "network-status",
        type: "network-status",
        title: "Network Status",
        icon: Radio,
        description: "Network connection monitor",
        defaultSize: { w: 220, h: 140 },
        color: "bg-cyan-500/20 border-cyan-500/50",
        mod: "network",
      },
      {
        id: "bandwidth",
        type: "bandwidth",
        title: "Bandwidth Monitor",
        icon: Wifi,
        description: "Real-time bandwidth usage",
        defaultSize: { w: 280, h: 160 },
        color: "bg-cyan-600/20 border-cyan-600/50",
        mod: "network",
      },
    ],
  },
  {
    name: "Data Analytics",
    description: "Advanced analytics widgets",
    icon: Database,
    version: "1.2.3",
    installed: false,
    widgets: [
      {
        id: "data-table",
        type: "data-table",
        title: "Data Table",
        icon: Database,
        description: "Tabular data display",
        defaultSize: { w: 400, h: 250 },
        color: "bg-indigo-500/20 border-indigo-500/50",
        mod: "analytics",
      },
    ],
  },
]

export function WidgetPalette() {
  const { state, dispatch } = useComms()
  const [draggedTemplate, setDraggedTemplate] = useState<WidgetTemplate | null>(null)
  const [expandedMods, setExpandedMods] = useState<string[]>(["Core Widgets", "Chart Widgets Pro"])

  // Draggable and collapsible state
  const [position, setPosition] = useState({ x: window.innerWidth - 300, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const paletteRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = paletteRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setIsDragging(true)
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !paletteRef.current) return

      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // Use requestAnimationFrame for smooth updates
      animationFrameRef.current = requestAnimationFrame(() => {
        const paletteRect = paletteRef.current?.getBoundingClientRect()
        if (!paletteRect) return

        const newX = Math.max(0, Math.min(window.innerWidth - paletteRect.width, e.clientX - dragOffset.x))
        const newY = Math.max(0, Math.min(window.innerHeight - paletteRect.height, e.clientY - dragOffset.y))

        setPosition({ x: newX, y: newY })
      })
    },
    [isDragging, dragOffset],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove, { passive: true })
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Rest of the existing functions remain the same...
  const handleDragStart = (e: React.DragEvent, template: WidgetTemplate) => {
    setDraggedTemplate(template)
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        ...template,
        isFromPalette: true,
      }),
    )
    e.dataTransfer.effectAllowed = "copy"
  }

  const handleDragEnd = () => {
    setDraggedTemplate(null)
  }

  const createWidget = (template: WidgetTemplate) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: template.type,
      title: template.title,
      content: getDefaultContent(template.type),
      x: Math.random() * 300,
      y: Math.random() * 200,
      w: template.defaultSize.w,
      h: template.defaultSize.h,
    }

    dispatch({ type: "ADD_WIDGET", payload: newWidget })
    dispatch({ type: "ADD_LOG", payload: `${template.title} widget created from ${template.mod} mod` })
  }

  const getDefaultContent = (type: string): string => {
    switch (type) {
      case "sensor":
        return "23.5°C"
      case "chart":
      case "line-chart":
        return "Chart Data"
      case "pie-chart":
        return "Pie Chart"
      case "trend-chart":
        return "Trend Data"
      case "status":
        return "Online"
      case "gauge":
        return "75%"
      case "monitor":
        return "CPU: 45%"
      case "power":
        return "120W"
      case "network-status":
        return "Connected"
      case "bandwidth":
        return "1.2 Mbps"
      case "data-table":
        return "Data Table"
      default:
        return "No Data"
    }
  }

  const toggleMod = (modName: string) => {
    setExpandedMods((prev) => (prev.includes(modName) ? prev.filter((name) => name !== modName) : [...prev, modName]))
  }

  const installMod = (modName: string) => {
    dispatch({ type: "ADD_LOG", payload: `Installing mod: ${modName}` })
    // In a real implementation, this would trigger mod installation
  }

  if (isCollapsed) {
    return (
      <div
        ref={paletteRef}
        className="fixed z-40 select-none will-change-transform"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate3d(0, 0, 0)",
        }}
      >
        <Card className="bg-card/95 backdrop-blur border-border/50 shadow-lg">
          <div className="flex items-center gap-2 p-3">
            <div
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded touch-none"
              onMouseDown={handleMouseDown}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <Package className="h-4 w-4" />
            <span className="text-sm font-medium">Widgets</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-muted/50 ml-2"
              onClick={() => setIsCollapsed(false)}
              title="Expand Widget Palette"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div
      ref={paletteRef}
      className="fixed z-40 w-72 select-none will-change-transform"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate3d(0, 0, 0)",
      }}
    >
      <Card className="bg-card/95 backdrop-blur border-border/50 shadow-lg max-h-[calc(100vh-100px)] overflow-hidden">
        <CardHeader className="pb-3 cursor-grab active:cursor-grabbing touch-none" onMouseDown={handleMouseDown}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Package className="h-4 w-4" />
              <CardTitle className="text-sm">Widget Palette</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-muted/50"
              onClick={() => setIsCollapsed(true)}
              title="Collapse Widget Palette"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        {/* Rest of the content remains the same */}
        <CardContent className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {modGroups.map((mod) => {
            const IconComponent = mod.icon
            const isExpanded = expandedMods.includes(mod.name)

            return (
              <Card key={mod.name} className={`${mod.installed ? "border-border/50" : "border-muted/50 opacity-75"}`}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleMod(mod.name)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-muted/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">{mod.name}</div>
                            <div className="text-xs text-muted-foreground">{mod.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={mod.installed ? "default" : "outline"} className="text-xs">
                            {mod.installed ? `v${mod.version}` : "Not Installed"}
                          </Badge>
                          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-2">
                      {mod.installed ? (
                        <>
                          <div className="text-xs text-muted-foreground mb-2">
                            {mod.widgets.length} widget{mod.widgets.length !== 1 ? "s" : ""} available
                          </div>
                          {mod.widgets.map((template) => {
                            const WidgetIcon = template.icon
                            return (
                              <Card
                                key={template.id}
                                className={`cursor-grab active:cursor-grabbing transition-all hover:scale-105 ${
                                  draggedTemplate?.id === template.id ? "opacity-50" : ""
                                } ${template.color}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, template)}
                                onDragEnd={handleDragEnd}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <WidgetIcon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{template.title}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs">
                                      {template.defaultSize.w}×{template.defaultSize.h}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => createWidget(template)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-xs text-muted-foreground mb-3">This mod is not installed</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs bg-transparent"
                            onClick={() => installMod(mod.name)}
                          >
                            Install {mod.name}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          })}

          {/* Add More Mods Section */}
          <Card className="border-dashed border-2 border-muted/50">
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mb-2">Browse AriesMods Marketplace</p>
              <Button
                size="sm"
                variant="outline"
                className="text-xs bg-transparent"
                onClick={() => dispatch({ type: "SET_MODAL", payload: "ariesmods" })}
              >
                Browse Mods
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
