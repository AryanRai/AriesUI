"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Save,
  Trash2,
  Plus,
  Grid3X3,
  WorkflowIcon as Widget,
  FolderOpen,
  ChevronDown,
  GripVertical,
  Minimize2,
  Maximize2,
  Terminal,
  Zap,
  Clock,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  X,
  Check,
  AlertCircle,
} from "lucide-react"
import { useComms } from "@/components/comms-context"
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { cn } from "@/lib/utils"

// Import the GridState type from main-content to ensure consistency
interface MainGridWidget {
  id: string
  type: string
  title: string
  content: string
  x: number
  y: number
  w: number
  h: number
}

interface NestContainer {
  id: string
  type: string
  title: string
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
}

interface NestedWidget {
  id: string
  type: string
  title: string
  content: string
  x: number
  y: number
  w: number
  h: number
  nestId: string
}

// Interface for grid state and functions (to be passed as props)
interface GridState {
  mainWidgets: MainGridWidget[]
  nestContainers: NestContainer[]
  nestedWidgets: NestedWidget[]
  mainAriesWidgets: any[]
  nestedAriesWidgets: any[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  gridSize: number
  lastSaved: string | null
  version: string
}

interface ViewportState {
  x: number
  y: number
  zoom: number
}

interface ToolbarProps {
  gridState: GridState
  viewport: ViewportState
  hasUnsavedChanges: boolean
  isAutoSaveEnabled: boolean
  setIsAutoSaveEnabled: (enabled: boolean) => void
  autoSaveInterval: number
  setAutoSaveInterval: (interval: number) => void
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastAutoSave: string | null
  historyIndex: number
  stateHistory: any[]
  saveGridState: (force?: boolean) => Promise<void>
  exportGridState: () => void
  importGridState: (event: React.ChangeEvent<HTMLInputElement>) => void
  undo: () => void
  redo: () => void
  addWidget: () => void
  addNestContainer: () => void
  setIsDebugPanelVisible: (visible: boolean) => void
  isDebugPanelVisible: boolean
}

// Quick action configuration for minimized view
interface QuickAction {
  id: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  label: string
  variant?: "default" | "outline" | "ghost" | "destructive"
  badge?: string
  isActive?: boolean
  disabled?: boolean
}

// Available quick actions
const AVAILABLE_ACTIONS = {
  save: { id: "save", icon: Save, label: "Save", variant: "default" as const },
  auto: { id: "auto", icon: Clock, label: "Auto-Save", variant: "outline" as const },
  undo: { id: "undo", icon: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6"/>
      <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
    </svg>
  ), label: "Undo", variant: "outline" as const },
  redo: { id: "redo", icon: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 7v6h-6"/>
      <path d="M3 17a9 9 0 919-9 9 9 0 016 2.3L21 13"/>
    </svg>
  ), label: "Redo", variant: "outline" as const },
  export: { id: "export", icon: Download, label: "Export", variant: "outline" as const },
  import: { id: "import", icon: Upload, label: "Import", variant: "outline" as const },
  addWidget: { id: "addWidget", icon: Plus, label: "Add Widget", variant: "outline" as const },
  addNest: { id: "addNest", icon: Grid3X3, label: "Add Nest", variant: "outline" as const },
  debug: { id: "debug", icon: Terminal, label: "Debug", variant: "outline" as const },
  settings: { id: "settings", icon: Settings, label: "Settings", variant: "ghost" as const },
  destroy: { id: "destroy", icon: Trash2, label: "Destroy", variant: "destructive" as const },
  create: { id: "create", icon: Plus, label: "Create", variant: "outline" as const },
  browse: { id: "browse", icon: FolderOpen, label: "Browse", variant: "outline" as const },
} as const

type ActionId = keyof typeof AVAILABLE_ACTIONS

interface ToolbarSection {
  id: string
  label: string
  actions: ActionId[]
  collapsible?: boolean
  defaultOpen?: boolean
}

const TOOLBAR_SECTIONS: ToolbarSection[] = [
  {
    id: "save",
    label: "Save & Auto-Save",
    actions: ["save", "auto"],
    collapsible: false,
  },
  {
    id: "file",
    label: "File",
    actions: ["save", "destroy", "create"],
    collapsible: true,
    defaultOpen: true,
  },
  {
    id: "history",
    label: "History",
    actions: ["undo", "redo"],
    collapsible: true,
    defaultOpen: true,
  },
  {
    id: "import-export",
    label: "Import/Export",
    actions: ["export", "import"],
    collapsible: true,
    defaultOpen: false,
  },
  {
    id: "insert",
    label: "Insert",
    actions: ["addWidget", "addNest"],
    collapsible: true,
    defaultOpen: true,
  },
  {
    id: "load",
    label: "Load",
    actions: ["browse"],
    collapsible: true,
    defaultOpen: false,
  },
  {
    id: "tools",
    label: "Tools",
    actions: ["debug", "settings"],
    collapsible: true,
    defaultOpen: false,
  },
]

// Futuristic background for floating toolbar
const ToolbarBackground = ({ animationsEnabled }: { animationsEnabled: boolean }) => {
  if (!animationsEnabled) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/85 backdrop-blur-sm rounded-lg" />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/85 backdrop-blur-sm" />
      
      {/* Animated border */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        animate={{
          boxShadow: [
            "0 0 0px rgba(var(--theme-primary), 0)",
            "0 0 15px rgba(var(--theme-primary), 0.3)",
            "0 0 0px rgba(var(--theme-primary), 0)"
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--theme-primary),0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--theme-primary),0.05)_1px,transparent_1px)] bg-[size:20px_20px] rounded-lg" />
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[rgba(var(--theme-primary),0.3)] rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[rgba(var(--theme-primary),0.3)] rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[rgba(var(--theme-primary),0.3)] rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[rgba(var(--theme-primary),0.3)] rounded-br-lg" />
    </div>
  )
}

export function FloatingToolbar(props: ToolbarProps) {
  const { dispatch } = useComms()
  const { animationsEnabled } = useAnimationPreferences()
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMinimized, setIsMinimized] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(
    TOOLBAR_SECTIONS.filter(s => s.defaultOpen).map(s => s.id)
  )
  const [quickActions, setQuickActions] = useLocalStorage<ActionId[]>("toolbar-quick-actions", ["save", "auto", "undo", "redo"])
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [canScroll, setCanScroll] = useState(false)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  const {
    gridState,
    viewport,
    hasUnsavedChanges,
    isAutoSaveEnabled,
    setIsAutoSaveEnabled,
    autoSaveInterval,
    setAutoSaveInterval,
    autoSaveStatus,
    lastAutoSave,
    historyIndex,
    stateHistory,
    saveGridState,
    exportGridState,
    importGridState,
    undo,
    redo,
    addWidget,
    addNestContainer,
    setIsDebugPanelVisible,
    isDebugPanelVisible,
  } = props

  // File input ref for import functionality
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = toolbarRef.current?.getBoundingClientRect()
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
      if (!isDragging || !toolbarRef.current) return

      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      // Use requestAnimationFrame for smooth updates
      animationFrameRef.current = requestAnimationFrame(() => {
        const toolbarRect = toolbarRef.current?.getBoundingClientRect()
        if (!toolbarRect) return

        const newX = Math.max(0, Math.min(window.innerWidth - toolbarRect.width, e.clientX - dragOffset.x))
        const newY = Math.max(0, Math.min(window.innerHeight - toolbarRect.height, e.clientY - dragOffset.y))

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

  // Handle scroll detection for visual indicators
  const handleScroll = useCallback(() => {
    const content = contentRef.current
    if (!content) return

    const { scrollTop, scrollHeight, clientHeight } = content
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1
    setIsScrolledToBottom(isAtBottom)
  }, [])

  // Check if content is scrollable
  useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const checkScrollable = () => {
      const hasScroll = content.scrollHeight > content.clientHeight
      setCanScroll(hasScroll)
      handleScroll() // Initial scroll position check
    }

    checkScrollable()
    content.addEventListener('scroll', handleScroll, { passive: true })
    
    // Recheck when content changes
    const resizeObserver = new ResizeObserver(checkScrollable)
    resizeObserver.observe(content)

    return () => {
      content.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [handleScroll, isCustomizing, expandedSections, isAutoSaveEnabled])

  // Action handlers
  const createActionHandler = useCallback((actionId: ActionId) => {
    switch (actionId) {
      case "save":
        return () => saveGridState(false)
      case "auto":
        return () => setIsAutoSaveEnabled(!isAutoSaveEnabled)
      case "undo":
        return undo
      case "redo":
        return redo
      case "export":
        return exportGridState
      case "import":
        return () => fileInputRef.current?.click()
      case "addWidget":
        return addWidget
      case "addNest":
        return addNestContainer
      case "debug":
        return () => setIsDebugPanelVisible(!isDebugPanelVisible)
      case "settings":
        return () => setIsCustomizing(!isCustomizing)
      case "destroy":
        return () => dispatch({ type: "CLEAR_WIDGETS" })
      case "create":
        return () => dispatch({ type: "ADD_LOG", payload: "Create functionality placeholder" })
      case "browse":
        return () => dispatch({ type: "ADD_LOG", payload: "Browse functionality placeholder" })
      default:
        return () => dispatch({ type: "ADD_LOG", payload: `Action ${actionId} triggered` })
    }
  }, [saveGridState, isAutoSaveEnabled, setIsAutoSaveEnabled, undo, redo, exportGridState, addWidget, addNestContainer, setIsDebugPanelVisible, isDebugPanelVisible, dispatch])

  const getActionProps = useCallback((actionId: ActionId) => {
    const baseAction = AVAILABLE_ACTIONS[actionId]
    const handler = createActionHandler(actionId)
    
    const props: QuickAction = {
      ...baseAction,
      action: handler,
    }

    // Add special props for specific actions
    switch (actionId) {
      case "save":
        props.variant = hasUnsavedChanges ? "default" : "outline"
        props.badge = hasUnsavedChanges ? "*" : undefined
        break
      case "auto":
        props.variant = isAutoSaveEnabled ? "default" : "outline"
        props.badge = 
          autoSaveStatus === 'saved' ? "✓" :
          autoSaveStatus === 'error' ? "✗" : undefined
        props.isActive = isAutoSaveEnabled
        break
      case "undo":
        props.disabled = historyIndex <= 0
        break
      case "redo":
        props.disabled = historyIndex >= stateHistory.length - 1
        break
      case "debug":
        props.variant = isDebugPanelVisible ? "default" : "outline"
        props.isActive = isDebugPanelVisible
        break
    }

    return props
  }, [hasUnsavedChanges, isAutoSaveEnabled, autoSaveStatus, historyIndex, stateHistory, isDebugPanelVisible])

  const toggleSectionExpansion = useCallback((sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }, [])

  const toggleQuickAction = useCallback((actionId: ActionId) => {
    setQuickActions(prev => 
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    )
  }, [setQuickActions])

  // Render action button
  const renderActionButton = useCallback((actionId: ActionId, size: "sm" | "icon" = "sm", keyPrefix: string = "action") => {
    const actionProps = getActionProps(actionId)
    const IconComponent = actionProps.icon
    const isIcon = size === "icon"

    const buttonContent = (
      <Button
        variant={actionProps.variant}
        size={size}
        className={cn(
          "gap-2 transition-all duration-200",
          isIcon ? "h-7 w-7" : "justify-start text-xs",
          actionProps.isActive && "ring-2 ring-[rgba(var(--theme-primary),0.5)]",
          hasUnsavedChanges && actionId === "save" && "bg-orange-600 hover:bg-orange-700 animate-pulse",
          isAutoSaveEnabled && actionId === "auto" && (
            autoSaveStatus === 'saving' ? "bg-blue-600 hover:bg-blue-700 animate-pulse" :
            autoSaveStatus === 'saved' ? "bg-green-600 hover:bg-green-700" :
            autoSaveStatus === 'error' ? "bg-red-600 hover:bg-red-700 animate-pulse" : ""
          ),
          "hover:bg-[rgba(var(--theme-primary),0.1)] theme-outline-primary",
          animationsEnabled && "hover:scale-105 hover:translate-x-1 active:scale-95 active:translate-x-0"
        )}
        onClick={actionProps.action}
        disabled={actionProps.disabled}
        title={actionProps.label}
      >
        <IconComponent className={cn("h-3 w-3", isIcon ? "h-3 w-3" : "h-3 w-3")} />
        {!isIcon && actionProps.label}
        {actionProps.badge && (
          <span className="text-xs ml-1">{actionProps.badge}</span>
        )}
      </Button>
    )

    if (animationsEnabled) {
      return (
        <motion.div
          key={`${keyPrefix}-${actionId}`}
          whileHover={{ scale: 1.02, x: isIcon ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {buttonContent}
        </motion.div>
      )
    }

    return (
      <div key={`${keyPrefix}-${actionId}`}>
        {buttonContent}
      </div>
    )
  }, [getActionProps, animationsEnabled, hasUnsavedChanges, isAutoSaveEnabled, autoSaveStatus])

  // If minimized, show compact version with quick actions
  if (isMinimized) {
    return (
      <motion.div
        key="minimized-toolbar"
        initial={animationsEnabled ? { scale: 0.8, opacity: 0 } : {}}
        animate={animationsEnabled ? { scale: 1, opacity: 1 } : {}}
        exit={animationsEnabled ? { scale: 0.8, opacity: 0 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <Card
          ref={toolbarRef}
          className="fixed z-50 bg-card/95 backdrop-blur theme-outline-primary shadow-lg select-none will-change-transform overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
            transform: "translate3d(0, 0, 0)",
          }}
        >
          {/* Futuristic Background */}
          <ToolbarBackground animationsEnabled={animationsEnabled} />
          
          {/* Minimized Content */}
          <div className="relative z-10 p-2 cursor-grab active:cursor-grabbing touch-none" onMouseDown={handleMouseDown}>
            <div className="flex items-center gap-2">
              <motion.div
                className="flex items-center gap-1"
                animate={animationsEnabled ? { x: [0, 2, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <GripVertical className="h-3 w-3 text-[rgb(var(--theme-primary))]" />
              </motion.div>

              {/* Quick Action Buttons */}
              {quickActions.map((actionId) => (
                <div key={`quick-${actionId}`}>
                  {renderActionButton(actionId, "icon", "quick")}
                </div>
              ))}

              {/* Customize Button */}
              <motion.div
                key="customize-button-mini"
                whileHover={animationsEnabled ? { scale: 1.1, rotate: 180 } : {}}
                whileTap={animationsEnabled ? { scale: 0.9 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-[rgba(var(--theme-primary),0.1)] ml-1 border-l border-[rgba(var(--theme-primary),0.2)] transition-all"
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  title="Customize Quick Actions"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </motion.div>

              {/* Maximize Button */}
              <motion.div
                key="maximize-button-mini"
                whileHover={animationsEnabled ? { scale: 1.1, rotate: 90 } : {}}
                whileTap={animationsEnabled ? { scale: 0.9 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-[rgba(var(--theme-primary),0.1)] ml-1 border-l border-[rgba(var(--theme-primary),0.2)] transition-all"
                  onClick={() => setIsMinimized(false)}
                  title="Expand Toolbar"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        key="expanded-toolbar"
        initial={animationsEnabled ? { scale: 0.9, opacity: 0, y: 20 } : {}}
        animate={animationsEnabled ? { scale: 1, opacity: 1, y: 0 } : {}}
        exit={animationsEnabled ? { scale: 0.9, opacity: 0, y: 20 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <Card
          ref={toolbarRef}
          className="fixed z-50 w-80 max-h-[80vh] bg-card/95 backdrop-blur theme-outline-primary shadow-lg select-none will-change-transform overflow-hidden flex flex-col"
          style={{
            left: position.x,
            top: position.y,
            transform: "translate3d(0, 0, 0)",
          }}
        >
          {/* Futuristic Background */}
          <ToolbarBackground animationsEnabled={animationsEnabled} />
          
          {/* Header */}
          <CardHeader className="pb-2 cursor-grab active:cursor-grabbing touch-none relative z-10" onMouseDown={handleMouseDown}>
            <motion.div 
              key="header-content"
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
                <CardTitle className="text-sm bg-gradient-to-r from-[rgb(var(--theme-primary))] to-slate-200 bg-clip-text text-transparent">
                  Unified Toolkit
                </CardTitle>
                <motion.div
                  className="w-2 h-2 bg-[rgb(var(--theme-primary))] rounded-full"
                  animate={animationsEnabled ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="flex items-center gap-1">
                <motion.div
                  key="settings-button"
                  whileHover={animationsEnabled ? { scale: 1.1, rotate: 180 } : {}}
                  whileTap={animationsEnabled ? { scale: 0.9 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-[rgba(var(--theme-primary),0.1)] theme-outline-primary transition-all"
                    onClick={() => setIsCustomizing(!isCustomizing)}
                    title="Customize Toolbar"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </motion.div>
                <motion.div
                  key="minimize-button"
                  whileHover={animationsEnabled ? { scale: 1.1, rotate: 90 } : {}}
                  whileTap={animationsEnabled ? { scale: 0.9 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-[rgba(var(--theme-primary),0.1)] theme-outline-primary transition-all"
                    onClick={() => setIsMinimized(true)}
                    title="Minimize Toolbar"
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </CardHeader>
          
          {/* Scroll indicator */}
          <motion.div 
            className={cn(
              "relative z-10 h-[1px] transition-opacity duration-300",
              canScroll ? "bg-gradient-to-r from-transparent via-[rgba(var(--theme-primary),0.2)] to-transparent opacity-100" : "opacity-0"
            )}
            {...(animationsEnabled && canScroll ? {
              animate: { 
                background: [
                  "linear-gradient(to right, transparent, rgba(var(--theme-primary), 0.2), transparent)",
                  "linear-gradient(to right, transparent, rgba(var(--theme-primary), 0.4), transparent)",
                  "linear-gradient(to right, transparent, rgba(var(--theme-primary), 0.2), transparent)"
                ]
              },
              transition: { duration: 2, repeat: Infinity }
            } : {})}
          />
          
          {/* Content */}
          <CardContent 
            ref={contentRef}
            className="space-y-3 relative z-10 overflow-y-auto overflow-x-hidden flex-1 pb-4 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-[rgba(var(--theme-primary),0.2)] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(var(--theme-primary),0.4)]"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(var(--theme-primary), 0.3) transparent',
            }}
          >
            {/* Quick Actions Customization */}
            {isCustomizing && (
              <motion.div
                key="customization-panel"
                initial={animationsEnabled ? { opacity: 0, height: 0 } : {}}
                animate={animationsEnabled ? { opacity: 1, height: "auto" } : {}}
                exit={animationsEnabled ? { opacity: 0, height: 0 } : {}}
                transition={{ duration: 0.3 }}
              >
                <div className="p-3 bg-[rgba(var(--theme-primary),0.1)] rounded-lg border border-[rgba(var(--theme-primary),0.2)]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-[rgb(var(--theme-secondary))]">Quick Actions</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-[rgba(var(--theme-primary),0.2)]"
                      onClick={() => setIsCustomizing(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select which actions appear when the toolbar is minimized
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(AVAILABLE_ACTIONS).map((actionId) => {
                      const action = AVAILABLE_ACTIONS[actionId as ActionId]
                      const isSelected = quickActions.includes(actionId as ActionId)
                      return (
                        <Button
                          key={`customize-${actionId}`}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="justify-start text-xs gap-2"
                          onClick={() => toggleQuickAction(actionId as ActionId)}
                        >
                          {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                          {action.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Toolbar Sections */}
            {TOOLBAR_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-1">
                {section.collapsible ? (
                  <Collapsible
                    open={expandedSections.includes(section.id)}
                    onOpenChange={() => toggleSectionExpansion(section.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <motion.div
                        key={`section-trigger-${section.id}`}
                        whileHover={animationsEnabled ? { scale: 1.02, x: 2 } : {}}
                        whileTap={animationsEnabled ? { scale: 0.98 } : {}}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      >
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between text-xs hover:bg-[rgba(var(--theme-primary),0.1)] theme-outline-primary transition-all"
                        >
                          {section.label}
                          <ChevronDown className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            expandedSections.includes(section.id) && "rotate-180"
                          )} />
                        </Button>
                      </motion.div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-1">
                      {section.actions.map((actionId) => (
                        <div key={`${section.id}-${actionId}`} className="pl-4">
                          {renderActionButton(actionId, "sm", section.id)}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-[rgb(var(--theme-secondary))] px-2 py-1">
                      {section.label}
                    </div>
                    {section.actions.map((actionId) => (
                      <div key={`${section.id}-${actionId}`} className="pl-2">
                        {renderActionButton(actionId, "sm", section.id)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* AriesMods Section */}
            <div key="ariesmods-section" className="space-y-1">
              <motion.div
                key="ariesmods-trigger"
                whileHover={animationsEnabled ? { scale: 1.02, x: 2 } : {}}
                whileTap={animationsEnabled ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button 
                  variant="ghost" 
                  className="w-full justify-between text-xs hover:bg-[rgba(var(--theme-primary),0.1)] theme-outline-primary transition-all"
                  onClick={() => toggleSectionExpansion("ariesmods")}
                >
                  AriesMods
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    expandedSections.includes("ariesmods") && "rotate-180"
                  )} />
                </Button>
              </motion.div>
              {expandedSections.includes("ariesmods") && (
                <motion.div
                  key="ariesmods-content"
                  initial={animationsEnabled ? { opacity: 0, height: 0 } : {}}
                  animate={animationsEnabled ? { opacity: 1, height: "auto" } : {}}
                  exit={animationsEnabled ? { opacity: 0, height: 0 } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <div className="pl-4">
                    <motion.div 
                      className="border-2 border-dashed border-[rgba(var(--theme-primary),0.3)] rounded p-2 text-center hover:border-[rgba(var(--theme-primary),0.5)] transition-colors"
                      whileHover={animationsEnabled ? { scale: 1.02 } : {}}
                      animate={animationsEnabled ? {
                        borderColor: [
                          "rgba(var(--theme-primary), 0.3)",
                          "rgba(var(--theme-primary), 0.5)",
                          "rgba(var(--theme-primary), 0.3)"
                        ]
                      } : {}}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <p className="text-xs text-[rgb(var(--theme-secondary))]">Drop .js files here</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Auto-save interval selector */}
            {isAutoSaveEnabled && (
              <motion.div
                key="auto-save-interval"
                initial={animationsEnabled ? { opacity: 0, height: 0 } : {}}
                animate={animationsEnabled ? { opacity: 1, height: "auto" } : {}}
                exit={animationsEnabled ? { opacity: 0, height: 0 } : {}}
                transition={{ duration: 0.3 }}
              >
                <div className="px-2 py-1 bg-blue-500/5 rounded border border-blue-500/10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-blue-300">Auto</span>
                      <select
                        value={autoSaveInterval}
                        onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                        className="text-xs bg-transparent border-none outline-none text-blue-300 cursor-pointer hover:text-blue-200"
                      >
                        <option value={5000} className="bg-background text-foreground">5s</option>
                        <option value={10000} className="bg-background text-foreground">10s</option>
                        <option value={30000} className="bg-background text-foreground">30s</option>
                        <option value={60000} className="bg-background text-foreground">1m</option>
                        <option value={300000} className="bg-background text-foreground">5m</option>
                        <option value={600000} className="bg-background text-foreground">10m</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-blue-300">
                      {autoSaveStatus === 'saving' && <Clock className="h-3 w-3 animate-spin" />}
                      {autoSaveStatus === 'saved' && <Check className="h-3 w-3 animate-pulse" />}
                      {autoSaveStatus === 'error' && <AlertCircle className="h-3 w-3 animate-pulse text-red-400" />}
                    </div>
                  </div>
                  {lastAutoSave && (
                    <div className="text-xs text-blue-300/50 mt-0.5 truncate" title={`Last saved: ${lastAutoSave}`}>
                      {lastAutoSave}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Scroll padding for last item visibility */}
            <div className="h-2" />
          </CardContent>
          
          {/* Bottom scroll indicator */}
          <motion.div 
            className={cn(
              "relative z-10 h-[1px] transition-opacity duration-300",
              canScroll && !isScrolledToBottom ? "bg-gradient-to-r from-transparent via-[rgba(var(--theme-primary),0.3)] to-transparent opacity-100" : "opacity-0"
            )}
            {...(animationsEnabled && canScroll && !isScrolledToBottom ? {
              animate: { 
                background: [
                  "linear-gradient(to right, transparent, rgba(var(--theme-primary), 0.3), transparent)",
                  "linear-gradient(to right, transparent, rgba(var(--theme-primary), 0.6), transparent)",
                  "linear-gradient(to right, transparent, rgba(var(--theme-primary), 0.3), transparent)"
                ]
              },
              transition: { duration: 1.5, repeat: Infinity }
            } : {})}
          />
        </Card>
      </motion.div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={importGridState}
        className="hidden"
      />
    </AnimatePresence>
  )
}
