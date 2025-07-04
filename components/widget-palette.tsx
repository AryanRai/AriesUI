"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"

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

// Futuristic background for widget palette
const PaletteBackground = ({ animationsEnabled }: { animationsEnabled: boolean }) => {
  if (!animationsEnabled) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/85 backdrop-blur-sm rounded-lg" />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/85 backdrop-blur-sm" />
      
      {/* Animated scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent"
        animate={{
          y: [0, 400, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:20px_20px] rounded-lg" />
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-teal-400/30 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-teal-400/30 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-teal-400/30 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-teal-400/30 rounded-br-lg" />
    </div>
  )
}

export function WidgetPalette() {
  const { state, dispatch } = useComms()
  const { animationsEnabled } = useAnimationPreferences()
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
  const animationFrameRef = useRef<number | null>(null)

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

  const MotionWrapper = animationsEnabled ? motion.div : 'div'

  if (isCollapsed) {
    return (
      <MotionWrapper
        {...(animationsEnabled ? {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
          transition: { type: "spring", stiffness: 400, damping: 30 }
        } : {})}
      >
        <div
          ref={paletteRef}
          className="fixed z-40 select-none will-change-transform overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <Card className="bg-card/95 backdrop-blur border-teal-500/30 shadow-lg">
            {/* Futuristic Background */}
            <PaletteBackground animationsEnabled={animationsEnabled} />
            
            <div className="flex items-center gap-2 p-3 relative z-10">
              <div
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-teal-500/10 rounded touch-none transition-colors"
                onMouseDown={handleMouseDown}
              >
                <motion.div
                  className="text-teal-400"
                  {...(animationsEnabled ? {
                    animate: { x: [0, 2, 0] },
                    transition: { duration: 2, repeat: Infinity }
                  } : {})}
                >
                  <GripVertical className="h-4 w-4" />
                </motion.div>
              </div>
              <Package className="h-4 w-4 text-teal-400" />
              <span className="text-sm font-medium bg-gradient-to-r from-teal-400 to-slate-200 bg-clip-text text-transparent">
                AriesMods
              </span>
              <motion.div
                className="w-2 h-2 bg-teal-400 rounded-full"
                {...(animationsEnabled ? {
                  animate: { opacity: [0.5, 1, 0.5] },
                  transition: { duration: 2, repeat: Infinity }
                } : {})}
              />
              <MotionWrapper
                {...(animationsEnabled ? {
                  whileHover: { scale: 1.1, rotate: 90 },
                  whileTap: { scale: 0.9 }
                } : {})}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-teal-500/10 ml-2 border border-transparent hover:border-teal-500/20 transition-all"
                  onClick={() => setIsCollapsed(false)}
                  title="Expand AriesMods Palette"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </MotionWrapper>
            </div>
          </Card>
        </div>
      </MotionWrapper>
    )
  }

  return (
    <AnimatePresence>
      <MotionWrapper
        {...(animationsEnabled ? {
          initial: { scale: 0.9, opacity: 0, y: 20 },
          animate: { scale: 1, opacity: 1, y: 0 },
          exit: { scale: 0.9, opacity: 0, y: 20 },
          transition: { type: "spring", stiffness: 400, damping: 30 }
        } : {})}
      >
        <div
          ref={paletteRef}
          className="fixed z-40 w-72 select-none will-change-transform overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            transform: "translate3d(0, 0, 0)",
          }}
        >
          <Card className="bg-card/95 backdrop-blur border-teal-500/30 shadow-lg max-h-[calc(100vh-100px)] overflow-hidden">
            {/* Futuristic Background */}
            <PaletteBackground animationsEnabled={animationsEnabled} />
            
            <CardHeader className="pb-3 cursor-grab active:cursor-grabbing touch-none relative z-10" onMouseDown={handleMouseDown}>
              <MotionWrapper
                className="flex items-center justify-between"
                {...(animationsEnabled ? {
                  initial: { opacity: 0, x: -10 },
                  animate: { opacity: 1, x: 0 },
                  transition: { delay: 0.1 }
                } : {})}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    className="text-teal-400"
                    {...(animationsEnabled ? {
                      animate: { x: [0, 2, 0] },
                      transition: { duration: 2, repeat: Infinity }
                    } : {})}
                  >
                    <GripVertical className="h-4 w-4" />
                  </motion.div>
                  <Package className="h-4 w-4 text-teal-400" />
                  <CardTitle className="text-sm bg-gradient-to-r from-teal-400 to-slate-200 bg-clip-text text-transparent">
                    AriesMods Palette
                  </CardTitle>
                  <motion.div
                    className="w-2 h-2 bg-teal-400 rounded-full"
                    {...(animationsEnabled ? {
                      animate: { opacity: [0.5, 1, 0.5] },
                      transition: { duration: 2, repeat: Infinity }
                    } : {})}
                  />
                </div>
                <MotionWrapper
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.1, rotate: 90 },
                    whileTap: { scale: 0.9 }
                  } : {})}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                    onClick={() => setIsCollapsed(true)}
                    title="Collapse AriesMods Palette"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                </MotionWrapper>
              </MotionWrapper>
              
              {/* Search */}
              <MotionWrapper
                className="relative"
                {...(animationsEnabled ? {
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: 0.2 }
                } : {})}
              >
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-teal-400/70" />
                <Input
                  placeholder="Search AriesMods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs bg-background/50 border-teal-500/30 focus:border-teal-500/50 transition-all"
                />
              </MotionWrapper>
            </CardHeader>

            <CardContent className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] relative z-10">
              {modCategories.length === 0 ? (
                <MotionWrapper
                  className="text-center text-muted-foreground text-sm py-8"
                  {...(animationsEnabled ? {
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: 0.3 }
                  } : {})}
                >
                  {searchQuery ? "No AriesMods match your search" : "No AriesMods available"}
                </MotionWrapper>
              ) : (
                modCategories.map((category, categoryIndex) => {
                  const isExpanded = expandedCategories.includes(category.name)

                  return (
                    <MotionWrapper
                      key={category.name}
                      {...(animationsEnabled ? {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: 0.3 + categoryIndex * 0.1 }
                      } : {})}
                    >
                      <Card className="border-teal-500/30 bg-background/30 backdrop-blur-sm">
                        <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.name)}>
                          <CollapsibleTrigger asChild>
                            <MotionWrapper
                              {...(animationsEnabled ? {
                                whileHover: { scale: 1.01, x: 2 },
                                whileTap: { scale: 0.99 }
                              } : {})}
                            >
                              <CardHeader className="pb-2 cursor-pointer hover:bg-teal-500/5 transition-all border border-transparent hover:border-teal-500/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{category.icon}</span>
                                    <div>
                                      <div className="text-sm font-medium bg-gradient-to-r from-teal-400 to-slate-200 bg-clip-text text-transparent">
                                        {category.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{category.description}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <motion.div
                                      {...(animationsEnabled ? {
                                        animate: { scale: [1, 1.1, 1] },
                                        transition: { duration: 2, repeat: Infinity }
                                      } : {})}
                                    >
                                      <Badge variant="outline" className="text-xs border-teal-500/30">
                                        {category.mods.length} mod{category.mods.length !== 1 ? 's' : ''}
                                      </Badge>
                                    </motion.div>
                                    <motion.div
                                      {...(animationsEnabled ? {
                                        animate: { rotate: isExpanded ? 180 : 0 },
                                        transition: { duration: 0.3 }
                                      } : {})}
                                    >
                                      <ChevronDown className="h-3 w-3 text-teal-400" />
                                    </motion.div>
                                  </div>
                                </div>
                              </CardHeader>
                            </MotionWrapper>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <CardContent className="pt-0 space-y-1">
                              {category.mods.map((template, modIndex) => (
                                <MotionWrapper
                                  key={template.id}
                                  {...(animationsEnabled ? {
                                    initial: { opacity: 0, x: -10 },
                                    animate: { opacity: 1, x: 0 },
                                    transition: { delay: modIndex * 0.05 },
                                    whileHover: { scale: 1.02, x: 4 },
                                    whileTap: { scale: 0.98 }
                                  } : {})}
                                >
                                  <div
                                    className="group relative p-2 rounded border cursor-grab active:cursor-grabbing hover:bg-teal-500/10 transition-all border-teal-500/20 hover:border-teal-500/40"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, template)}
                                    onDragEnd={handleDragEnd}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate text-teal-300">
                                          {template.metadata.displayName}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {template.metadata.description}
                                        </div>
                                        <div className="text-xs text-teal-400/70 mt-1">
                                          {template.metadata.defaultWidth}×{template.metadata.defaultHeight}
                                        </div>
                                      </div>
                                      <MotionWrapper
                                        {...(animationsEnabled ? {
                                          whileHover: { scale: 1.1, rotate: 90 },
                                          whileTap: { scale: 0.9 }
                                        } : {})}
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all hover:bg-teal-500/20 border border-transparent hover:border-teal-500/30"
                                          onClick={() => createAriesModWidget(template)}
                                          title="Add to Grid"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </MotionWrapper>
                                    </div>
                                    
                                    {template.metadata.tags && template.metadata.tags.length > 0 && (
                                      <div className="flex gap-1 mt-1 flex-wrap">
                                        {template.metadata.tags.slice(0, 2).map((tag) => (
                                          <Badge key={tag} variant="secondary" className="text-xs px-1 py-0 bg-teal-500/20 text-teal-300 border-teal-500/30">
                                            {tag}
                                          </Badge>
                                        ))}
                                        {template.metadata.tags.length > 2 && (
                                          <span className="text-xs text-teal-400/70">
                                            +{template.metadata.tags.length - 2}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </MotionWrapper>
                              ))}
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    </MotionWrapper>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </MotionWrapper>
    </AnimatePresence>
  )
}
