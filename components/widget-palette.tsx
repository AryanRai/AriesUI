"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Package, 
  Search, 
  GripVertical, 
  ChevronDown, 
  Minimize2, 
  Maximize2,
  Plus 
} from 'lucide-react'
import { useComms } from '@/components/comms-context'
import { useAnimationPreferences } from '@/hooks/use-animation-preferences'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { cn } from '@/lib/utils'
import { ariesModsRegistry, getAllAriesMods } from '@/lib/ariesmods-registry'
import type { AriesMod, AriesModMetadata } from '@/types/ariesmods'
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

// Futuristic background for widget palette
const PaletteBackground = ({ animationsEnabled }: { animationsEnabled: boolean }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[rgba(var(--theme-primary),0.1)] via-transparent to-[rgba(var(--theme-primary),0.1)]"
        animate={animationsEnabled ? {
          background: [
            "linear-gradient(135deg, rgba(var(--theme-primary), 0.1) 0%, transparent 50%, rgba(var(--theme-primary), 0.1) 100%)",
            "linear-gradient(225deg, rgba(var(--theme-primary), 0.1) 0%, transparent 50%, rgba(var(--theme-primary), 0.1) 100%)",
            "linear-gradient(315deg, rgba(var(--theme-primary), 0.1) 0%, transparent 50%, rgba(var(--theme-primary), 0.1) 100%)",
            "linear-gradient(45deg, rgba(var(--theme-primary), 0.1) 0%, transparent 50%, rgba(var(--theme-primary), 0.1) 100%)",
            "linear-gradient(135deg, rgba(var(--theme-primary), 0.1) 0%, transparent 50%, rgba(var(--theme-primary), 0.1) 100%)"
          ]
        } : {}}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(var(--theme-primary), 0.2) 0%, transparent 70%)`
        }}
        animate={animationsEnabled ? {
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3]
        } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}

// Efficient conditional motion wrapper
const ConditionalMotion = ({ 
  children, 
  animationsEnabled, 
  motionProps = {},
  className = "",
  ...props 
}: {
  children: React.ReactNode
  animationsEnabled: boolean
  motionProps?: any
  className?: string
  [key: string]: any
}) => {
  if (animationsEnabled) {
    return (
      <motion.div className={className} {...motionProps} {...props}>
        {children}
      </motion.div>
    )
  }
  
  return (
    <div className={className} {...props}>
      {children}
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

  if (isCollapsed) {
    return (
      <motion.div
        initial={animationsEnabled ? { scale: 0.8, opacity: 0 } : {}}
        animate={animationsEnabled ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed z-40 select-none cursor-grab active:cursor-grabbing"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <motion.div
          whileHover={animationsEnabled ? { scale: 1.05 } : {}}
          whileTap={animationsEnabled ? { scale: 0.95 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-full bg-card/95 backdrop-blur theme-outline-primary shadow-lg hover:shadow-xl transition-all"
            onClick={(e) => {
              // Only expand if we're not dragging
              if (!isDragging) {
                setIsCollapsed(false)
              }
            }}
            onMouseDown={(e) => {
              // Prevent the button's default behavior during drag
              e.stopPropagation()
            }}
            title="Expand AriesMods Palette (Drag to move)"
          >
            <Package className="h-5 w-5 text-[rgb(var(--theme-primary))]" />
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={animationsEnabled ? { scale: 0.95, opacity: 0, y: 10 } : {}}
        animate={animationsEnabled ? { scale: 1, opacity: 1, y: 0 } : {}}
        exit={animationsEnabled ? { scale: 0.95, opacity: 0, y: 10 } : {}}
        transition={{ duration: 0.2, ease: "easeOut" }}
        ref={paletteRef}
        className="fixed z-40 w-72 select-none will-change-transform overflow-hidden"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate3d(0, 0, 0)",
        }}
      >
        <Card className="bg-card/95 backdrop-blur theme-outline-primary shadow-lg max-h-[calc(100vh-100px)] overflow-hidden">
          {/* Futuristic Background */}
          <PaletteBackground animationsEnabled={animationsEnabled} />
          
          <CardHeader className="pb-3 cursor-grab active:cursor-grabbing touch-none relative z-10" onMouseDown={handleMouseDown}>
            <motion.div
              className="flex items-center justify-between"
              initial={animationsEnabled ? { opacity: 0, x: -10 } : {}}
              animate={animationsEnabled ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  className="text-[rgb(var(--theme-primary))]"
                  animate={animationsEnabled ? { x: [0, 2, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <GripVertical className="h-4 w-4" />
                </motion.div>
                <Package className="h-4 w-4 text-[rgb(var(--theme-primary))]" />
                <CardTitle className="text-sm bg-gradient-to-r from-[rgb(var(--theme-primary))] to-slate-200 bg-clip-text text-transparent">
                  AriesMods Palette
                </CardTitle>
                <motion.div
                  className="w-2 h-2 bg-[rgb(var(--theme-primary))] rounded-full"
                  animate={animationsEnabled ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <motion.div
                whileHover={animationsEnabled ? { scale: 1.1, rotate: 90 } : {}}
                whileTap={animationsEnabled ? { scale: 0.9 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-[rgba(var(--theme-primary),0.1)] theme-outline-primary transition-all"
                  onClick={() => setIsCollapsed(true)}
                  title="Collapse AriesMods Palette"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Search */}
            <motion.div
              className="relative"
              initial={animationsEnabled ? { opacity: 0, y: 10 } : {}}
              animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
            >
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-[rgba(var(--theme-primary),0.7)]" />
              <Input
                placeholder="Search AriesMods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-7 text-xs bg-background/50 theme-outline-primary focus:border-[rgba(var(--theme-primary),0.5)] transition-all"
              />
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] relative z-10">
            {modCategories.length === 0 ? (
              <motion.div
                className="text-center text-muted-foreground text-sm py-8"
                initial={animationsEnabled ? { opacity: 0, y: 20 } : {}}
                animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
              >
                {searchQuery ? "No AriesMods match your search" : "No AriesMods available"}
              </motion.div>
            ) : (
              modCategories.map((category, categoryIndex) => {
                const isExpanded = expandedCategories.includes(category.name)

                return (
                  <motion.div
                    key={category.name}
                    initial={animationsEnabled ? { opacity: 0, y: 20 } : {}}
                    animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + categoryIndex * 0.1 }}
                  >
                    <Card className="theme-outline-primary bg-background/30 backdrop-blur-sm">
                      <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.name)}>
                        <CollapsibleTrigger asChild>
                          <motion.div
                            whileHover={animationsEnabled ? { scale: 1.01, x: 2 } : {}}
                            whileTap={animationsEnabled ? { scale: 0.99 } : {}}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                            <CardHeader className="pb-2 cursor-pointer hover:bg-[rgba(var(--theme-primary),0.05)] transition-all theme-outline-primary rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{category.icon}</span>
                                  <div>
                                    <div className="text-sm font-medium bg-gradient-to-r from-[rgb(var(--theme-primary))] to-slate-200 bg-clip-text text-transparent">
                                      {category.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{category.description}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <motion.div
                                    animate={animationsEnabled ? { scale: [1, 1.1, 1] } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <Badge variant="outline" className="text-xs border-[rgba(var(--theme-primary),0.3)]">
                                      {category.mods.length} mod{category.mods.length !== 1 ? 's' : ''}
                                    </Badge>
                                  </motion.div>
                                  <motion.div
                                    animate={animationsEnabled ? { rotate: isExpanded ? 180 : 0 } : {}}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <ChevronDown className="h-3 w-3 text-[rgb(var(--theme-primary))]" />
                                  </motion.div>
                                </div>
                              </div>
                            </CardHeader>
                          </motion.div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0 space-y-1">
                            {category.mods.map((template, modIndex) => (
                              <motion.div
                                key={template.id}
                                initial={animationsEnabled ? { opacity: 0, x: -10 } : {}}
                                animate={animationsEnabled ? { opacity: 1, x: 0 } : {}}
                                transition={{ delay: modIndex * 0.05 }}
                                whileHover={animationsEnabled ? { scale: 1.02, x: 4 } : {}}
                                whileTap={animationsEnabled ? { scale: 0.98 } : {}}
                              >
                                <div
                                  className="group relative p-2 rounded border cursor-grab active:cursor-grabbing hover:bg-[rgba(var(--theme-primary),0.1)] transition-all theme-outline-primary"
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, template)}
                                  onDragEnd={handleDragEnd}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium truncate text-[rgb(var(--theme-secondary))]">
                                        {template.metadata.displayName}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {template.metadata.description}
                                      </div>
                                      <div className="text-xs text-[rgba(var(--theme-primary),0.7)] mt-1">
                                        {template.metadata.defaultWidth}×{template.metadata.defaultHeight}
                                      </div>
                                    </div>
                                    <motion.div
                                      whileHover={animationsEnabled ? { scale: 1.1, rotate: 90 } : {}}
                                      whileTap={animationsEnabled ? { scale: 0.9 } : {}}
                                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all hover:bg-[rgba(var(--theme-primary),0.2)] theme-outline-primary"
                                        onClick={() => createAriesModWidget(template)}
                                        title="Add to Grid"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </motion.div>
                                  </div>
                                  
                                  {template.metadata.tags && template.metadata.tags.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      {template.metadata.tags.slice(0, 2).map((tag) => (
                                        <Badge key={tag} variant="secondary" className="text-xs px-1 py-0 bg-[rgba(var(--theme-primary),0.2)] text-[rgb(var(--theme-secondary))] border-[rgba(var(--theme-primary),0.3)]">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {template.metadata.tags.length > 2 && (
                                        <span className="text-xs text-[rgba(var(--theme-primary),0.7)]">
                                          +{template.metadata.tags.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
