"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import {
  ChevronDown,
  Package,
  GripVertical,
  Minimize2,
  Maximize2,
  Search,
  Plus,
} from "lucide-react"
import { useComms } from "@/components/comms-context"
import { ariesModsRegistry, getAllAriesMods } from "@/lib/ariesmods-registry"
import type { AriesMod, AriesModMetadata } from "@/types/ariesmods"
import { ARIESMODS_CATEGORIES } from "@/types/ariesmods"

interface AriesModTemplate {
  id: string
  metadata: AriesModMetadata
  mod: AriesMod
}

interface ModCategory {
  name: string
  description: string
  icon: string
  color: string
  mods: AriesModTemplate[]
}

export function WidgetPalette() {
  const { state, dispatch } = useComms()
  const [draggedTemplate, setDraggedTemplate] = useState<AriesModTemplate | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Sensors", "Controls"])
  const [searchQuery, setSearchQuery] = useState("")
  const [availableMods, setAvailableMods] = useState<Record<string, AriesMod>>({})

  // Draggable and collapsible state
  const [position, setPosition] = useState({ x: window.innerWidth - 300, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const paletteRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

  // Initialize AriesMods registry
  useEffect(() => {
    const initializeRegistry = async () => {
      try {
        await ariesModsRegistry.initialize()
        const mods = ariesModsRegistry.getAllMods()
        setAvailableMods(mods)
      } catch (error) {
        console.error('Failed to initialize AriesMods:', error)
      }
    }
    
    initializeRegistry()
  }, [])

  // Generate mod categories from available AriesMods
  const getModCategories = (): ModCategory[] => {
    const categories: ModCategory[] = []
    
    Object.entries(ARIESMODS_CATEGORIES).forEach(([categoryKey, categoryInfo]) => {
      const categoryMods = Object.values(availableMods)
        .filter(mod => mod.metadata.category === categoryKey)
        .filter(mod => {
          if (!searchQuery) return true
          const query = searchQuery.toLowerCase()
          return (
            mod.metadata.displayName.toLowerCase().includes(query) ||
            mod.metadata.description.toLowerCase().includes(query) ||
            mod.metadata.tags?.some(tag => tag.toLowerCase().includes(query))
          )
        })
        .map(mod => ({
          id: mod.metadata.id,
          metadata: mod.metadata,
          mod
        }))

      if (categoryMods.length > 0) {
        categories.push({
          name: categoryInfo.label,
          description: categoryInfo.description,
          icon: categoryInfo.icon,
          color: getCategoryColor(categoryKey),
          mods: categoryMods
        })
      }
    })

    return categories
  }

  const getCategoryColor = (category: string): string => {
    const colors = {
      sensor: "bg-blue-500/20 border-blue-500/50",
      control: "bg-green-500/20 border-green-500/50", 
      visualization: "bg-purple-500/20 border-purple-500/50",
      utility: "bg-orange-500/20 border-orange-500/50",
      custom: "bg-gray-500/20 border-gray-500/50"
    }
    return colors[category as keyof typeof colors] || colors.custom
  }

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

  const handleDragStart = (e: React.DragEvent, template: AriesModTemplate) => {
    setDraggedTemplate(template)
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: 'ariesmods',
        ariesModType: template.metadata.id,
        title: template.metadata.displayName,
        defaultSize: { 
          w: template.metadata.defaultWidth, 
          h: template.metadata.defaultHeight 
        },
        isFromPalette: true,
      }),
    )
    e.dataTransfer.effectAllowed = "copy"
  }

  const handleDragEnd = () => {
    setDraggedTemplate(null)
  }

  const createAriesModWidget = (template: AriesModTemplate) => {
    dispatch({ type: "ADD_LOG", payload: `Creating ${template.metadata.displayName} widget` })
    // The actual widget creation will be handled by the drop logic in main-content.tsx
  }

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => 
      prev.includes(categoryName) 
        ? prev.filter((name) => name !== categoryName) 
        : [...prev, categoryName]
    )
  }

  const modCategories = getModCategories()

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
            <span className="text-sm font-medium">AriesMods</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-muted/50 ml-2"
              onClick={() => setIsCollapsed(false)}
              title="Expand AriesMods Palette"
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
              <CardTitle className="text-sm">AriesMods Palette</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-muted/50"
              onClick={() => setIsCollapsed(true)}
              title="Collapse AriesMods Palette"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search AriesMods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {modCategories.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              {searchQuery ? "No AriesMods match your search" : "No AriesMods available"}
            </div>
          ) : (
            modCategories.map((category) => {
              const isExpanded = expandedCategories.includes(category.name)

              return (
                <Card key={category.name} className="border-border/50">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.name)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-2 cursor-pointer hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{category.icon}</span>
                            <div>
                              <div className="text-sm font-medium">{category.name}</div>
                              <div className="text-xs text-muted-foreground">{category.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {category.mods.length} mod{category.mods.length !== 1 ? 's' : ''}
                            </Badge>
                            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-1">
                        {category.mods.map((template) => (
                          <div
                            key={template.id}
                            className={`group relative p-2 rounded border cursor-grab active:cursor-grabbing hover:bg-muted/30 transition-colors ${category.color}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, template)}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">
                                  {template.metadata.displayName}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {template.metadata.description}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {template.metadata.defaultWidth}×{template.metadata.defaultHeight}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => createAriesModWidget(template)}
                                title="Add to Grid"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {template.metadata.tags && template.metadata.tags.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {template.metadata.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                                {template.metadata.tags.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{template.metadata.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
