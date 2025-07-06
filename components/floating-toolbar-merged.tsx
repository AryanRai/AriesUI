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
  History,
  Monitor,
  Maximize,
  Minimize,
  Square,
  Fullscreen,
} from "lucide-react"
import { useComms } from "@/components/comms-context"
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useWindowState } from "@/hooks/use-window-state"
import { cn } from "@/lib/utils"
import { EditHistoryPanel } from "@/components/edit-history-panel"
import WindowControls from "@/components/window-controls"

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
  onNavigateToHistory?: (index: number) => void
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
  history: { id: "history", icon: History, label: "Edit History", variant: "outline" as const },
  minimize: { id: "minimize", icon: Minimize2, label: "Minimize", variant: "outline" as const },
  maximize: { id: "maximize", icon: Maximize2, label: "Maximize", variant: "outline" as const },
  fullscreen: { id: "fullscreen", icon: Fullscreen, label: "Fullscreen", variant: "outline" as const },
  windowControls: { id: "windowControls", icon: Monitor, label: "Window Controls", variant: "outline" as const },
  snap: { id: "snap", icon: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L22 7L12 12L2 7L12 2Z"/>
      <path d="M2 17L12 22L22 17"/>
      <path d="M2 12L12 17L22 12"/>
    </svg>
  ), label: "Toggle Snap", variant: "outline" as const },
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
    actions: ["undo", "redo", "history"],
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
    actions: ["debug", "settings", "snap"],
    collapsible: true,
    defaultOpen: false,
  },
  {
    id: "window",
    label: "Window",
    actions: ["minimize", "maximize", "fullscreen", "windowControls"],
    collapsible: true,
    defaultOpen: false,
  },
]

// Snap zones configuration
const SNAP_ZONES = {
  TOP_LEFT: { x: 20, y: 20 },
  TOP_RIGHT: { x: -20, y: 20 }, // Negative x means offset from right edge
  BOTTOM_LEFT: { x: 20, y: -20 }, // Negative y means offset from bottom edge
  BOTTOM_RIGHT: { x: -20, y: -20 },
  LEFT_CENTER: { x: 20, y: 0.5 }, // 0.5 means 50% from top
  RIGHT_CENTER: { x: -20, y: 0.5 },
  TOP_CENTER: { x: 0.5, y: 20 }, // 0.5 means 50% from left
  BOTTOM_CENTER: { x: 0.5, y: -20 },
} as const

const SNAP_THRESHOLD = 30 // pixels - reduced for less aggressive snapping

// Helper function to calculate snap position - only for preview during drag
const calculateSnapPosition = (currentX: number, currentY: number, toolbarWidth: number, toolbarHeight: number, enableSnapping: boolean = true) => {
  if (!enableSnapping) {
    return {
      x: currentX,
      y: currentY,
      snapped: false,
      snapZone: null
    }
  }

  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  
  // Calculate distances to each snap zone
  const snapDistances = Object.entries(SNAP_ZONES).map(([key, zone]) => {
    let targetX: number
    let targetY: number
    
    // Calculate target position based on zone configuration
    if (zone.x < 0) {
      targetX = windowWidth + zone.x - toolbarWidth // Offset from right edge
    } else if (zone.x > 0 && zone.x < 1) {
      targetX = (windowWidth - toolbarWidth) * zone.x // Percentage from left
    } else {
      targetX = zone.x // Absolute position from left
    }
    
    if (zone.y < 0) {
      targetY = windowHeight + zone.y - toolbarHeight // Offset from bottom edge
    } else if (zone.y > 0 && zone.y < 1) {
      targetY = (windowHeight - toolbarHeight) * zone.y // Percentage from top
    } else {
      targetY = zone.y // Absolute position from top
    }
    
    // Calculate distance to this snap zone
    const distance = Math.sqrt(Math.pow(currentX - targetX, 2) + Math.pow(currentY - targetY, 2))
    
    return {
      key,
      position: { x: targetX, y: targetY },
      distance
    }
  })
  
  // Find closest snap zone
  const closestSnap = snapDistances.reduce((closest, current) => 
    current.distance < closest.distance ? current : closest
  )
  
  // Return snap position if within threshold, otherwise return current position
  if (closestSnap.distance < SNAP_THRESHOLD) {
    return {
      ...closestSnap.position,
      snapped: true,
      snapZone: closestSnap.key
    }
  }
  
  return {
    x: currentX,
    y: currentY,
    snapped: false,
    snapZone: null
  }
}

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
  const { animationsEnabled } = useAnimationPreferences()
  const { dispatch } = useComms()
  const { windowState, toggleFullscreen, toggleMaximize, minimize: minimizeWindow } = useWindowState()
  
  // Component state
  const [isMinimized, setIsMinimized] = useLocalStorage("toolbar-minimized", false)
  const [isHistoryPanelVisible, setIsHistoryPanelVisible] = useState(false)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [quickActions, setQuickActions] = useLocalStorage<ActionId[]>("toolbar-quick-actions", ["save", "undo", "redo", "export", "import"])
  const [expandedSections, setExpandedSections] = useLocalStorage<string[]>("toolbar-expanded-sections", ["save", "file", "history"])
  const [position, setPosition] = useLocalStorage("toolbar-position", { x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showSnapPreview, setShowSnapPreview] = useState(false)
  const [snapPreviewPosition, setSnapPreviewPosition] = useState({ x: 0, y: 0, label: "" })
  const [canScroll, setCanScroll] = useState(false)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)
  const [currentSnapZone, setCurrentSnapZone] = useState<string | null>(null)
  const [snapEnabled, setSnapEnabled] = useLocalStorage("toolbar-snap-enabled", true)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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
    onNavigateToHistory,
  } = props

  // Handle navigation to specific history entry
  const handleNavigateToHistory = useCallback((index: number) => {
    if (onNavigateToHistory) {
      onNavigateToHistory(index)
    }
    setIsHistoryPanelVisible(false) // Close panel after navigation
  }, [onNavigateToHistory])

  // File input ref for import functionality
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    
    setDragOffset({
      x: e.clientX,
      y: e.clientY,
    })
    
    dispatch({ type: "ADD_LOG", payload: "🚀 Toolbar dragging started - FREE MOVEMENT enabled!" })
  }, [dispatch])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSnapEnabled(!snapEnabled)
    dispatch({ type: "ADD_LOG", payload: `Toolbar snapping ${!snapEnabled ? 'enabled' : 'disabled'}` })
  }, [snapEnabled, setSnapEnabled, dispatch])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      // Calculate delta from start position (like zoom toolbar)
      const deltaX = e.clientX - dragOffset.x
      const deltaY = e.clientY - dragOffset.y
      
      // Update position by adding delta to original position
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      // Update drag offset for next calculation
      setDragOffset({
        x: e.clientX,
        y: e.clientY,
      })

      // Handle snapping preview if enabled
      if (snapEnabled && !e.shiftKey && toolbarRef.current) {
        const toolbarRect = toolbarRef.current.getBoundingClientRect()
        const snapResult = calculateSnapPosition(position.x + deltaX, position.y + deltaY, toolbarRect.width, toolbarRect.height, true)
        
        if (snapResult.snapped) {
          setShowSnapPreview(true)
          setSnapPreviewPosition({ x: snapResult.x, y: snapResult.y, label: snapResult.snapZone || "" })
          setCurrentSnapZone(snapResult.snapZone)
        } else {
          setShowSnapPreview(false)
          setCurrentSnapZone(null)
        }
      } else {
        setShowSnapPreview(false)
        setCurrentSnapZone(null)
      }
    },
    [isDragging, dragOffset, snapEnabled, position],
  )

    const handleMouseUp = useCallback((e?: MouseEvent) => {
    if (isDragging) {
      // Apply snapping when drag ends (if enabled and not holding Shift)
      if (snapEnabled && !e?.shiftKey && toolbarRef.current) {
        const toolbarRect = toolbarRef.current.getBoundingClientRect()
        const snapResult = calculateSnapPosition(position.x, position.y, toolbarRect.width, toolbarRect.height, true)
        
        if (snapResult.snapped) {
          setPosition({ x: snapResult.x, y: snapResult.y })
          setCurrentSnapZone(snapResult.snapZone)
        } else {
          setCurrentSnapZone(null)
        }
      } else {
        setCurrentSnapZone(null)
      }
      
      dispatch({ type: "ADD_LOG", payload: `✅ Toolbar moved to position (${Math.round(position.x)}, ${Math.round(position.y)})` })
    }
    
    setIsDragging(false)
    setShowSnapPreview(false)
  }, [isDragging, position, snapEnabled, dispatch])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove, { passive: false })
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
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
  }, [handleScroll, isMinimized, expandedSections, isAutoSaveEnabled])

  // Listen for reset toolbar positions event
  useEffect(() => {
    const handleResetPositions = () => {
      setPosition({ x: 50, y: 50 })
      setCurrentSnapZone(null)
    }

    window.addEventListener("resetToolbarPositions", handleResetPositions)
    return () => window.removeEventListener("resetToolbarPositions", handleResetPositions)
  }, [setPosition])

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
      case "history":
        return () => setIsHistoryPanelVisible(!isHistoryPanelVisible)
      case "minimize":
        return () => setIsMinimized(true)
      case "maximize":
        return () => setIsMinimized(false)
      case "fullscreen":
        return () => {
          if (typeof document !== 'undefined') {
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else {
              document.documentElement.requestFullscreen()
            }
          }
        }
      case "windowControls":
        return () => {
          // This action is handled by the WindowControls component
          // No direct dispatch needed here, as WindowControls manages its own state
        }
      case "snap":
        return () => {
          setSnapEnabled(!snapEnabled)
          dispatch({ type: "ADD_LOG", payload: `Toolbar snapping ${!snapEnabled ? 'enabled' : 'disabled'}` })
        }
      default:
        return () => dispatch({ type: "ADD_LOG", payload: `Action ${actionId} triggered` })
    }
  }, [saveGridState, isAutoSaveEnabled, setIsAutoSaveEnabled, undo, redo, exportGridState, addWidget, addNestContainer, setIsDebugPanelVisible, isDebugPanelVisible, isHistoryPanelVisible, setIsHistoryPanelVisible, dispatch, isMinimized, setIsMinimized, snapEnabled, setSnapEnabled])

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
      case "history":
        props.variant = isHistoryPanelVisible ? "default" : "outline"
        props.isActive = isHistoryPanelVisible
        props.badge = stateHistory.length > 0 ? stateHistory.length.toString() : undefined
        break
      case "minimize":
        props.variant = isMinimized ? "default" : "outline"
        props.isActive = isMinimized
        break
      case "maximize":
        props.variant = isMinimized ? "default" : "outline"
        props.isActive = !isMinimized
        break
      case "fullscreen":
        props.variant = typeof document !== 'undefined' && !!document.fullscreenElement ? "default" : "outline"
        props.isActive = typeof document !== 'undefined' && !!document.fullscreenElement
        break
      case "windowControls":
        // This action does not have a direct state to track, so no isActive or badge
        break
      case "snap":
        props.variant = snapEnabled ? "default" : "outline"
        props.isActive = snapEnabled
        props.badge = snapEnabled ? "ON" : "OFF"
        break
    }

    return props
  }, [hasUnsavedChanges, isAutoSaveEnabled, autoSaveStatus, historyIndex, stateHistory, isDebugPanelVisible, isHistoryPanelVisible, isMinimized, snapEnabled])

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
          isIcon ? "h-6 w-6" : "justify-start text-xs",
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
        <IconComponent className={cn("h-2.5 w-2.5", isIcon ? "h-2.5 w-2.5" : "h-3 w-3")} />
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
      <AnimatePresence>
        <motion.div
          key="minimized-toolbar"
          initial={animationsEnabled ? { scale: 0.8, opacity: 0 } : {}}
          animate={animationsEnabled ? { scale: 1, opacity: 1 } : {}}
          exit={animationsEnabled ? { scale: 0.8, opacity: 0 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed z-50"
          style={{
            left: position.x,
            top: position.y,
            transform: "translate3d(0, 0, 0)",
          }}
          data-toolbar="true"
        >
          <Card
            ref={toolbarRef}
            className={cn(
              "bg-card/95 backdrop-blur theme-outline-primary shadow-lg select-none will-change-transform overflow-hidden transition-all duration-200",
              isDragging && "shadow-2xl scale-105 border-2 border-[rgb(var(--theme-primary))] bg-card/98"
            )}
          >
            {/* Futuristic Background */}
            <ToolbarBackground animationsEnabled={animationsEnabled} />
            
            {/* Minimized Content */}
            <div 
              className="relative z-10 p-1 cursor-grab active:cursor-grabbing touch-none hover:bg-[rgba(var(--theme-primary),0.05)] transition-all duration-200" 
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClick}
              title="🚀 DRAG ANYWHERE! • Double-click to toggle snapping • Hold Shift while dragging to temporarily disable snapping"
            >
              <div className="flex items-center gap-1">
                <motion.div
                  className="flex items-center gap-0.5 hover:bg-[rgba(var(--theme-primary),0.1)] p-1 rounded cursor-grab active:cursor-grabbing transition-all duration-200"
                  animate={animationsEnabled ? { x: [0, 1, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  title="🔥 DRAG HANDLE - Click and drag to move toolbar anywhere!"
                >
                  <div className="relative">
                    <GripVertical className="h-2.5 w-2.5 text-[rgb(var(--theme-primary))]" />
                    {isDragging && (
                      <motion.div
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      "w-1 h-1 rounded-full transition-all duration-300",
                      snapEnabled ? "bg-[rgb(var(--theme-primary))]" : "bg-yellow-500"
                    )}
                    title={snapEnabled ? "Snapping enabled" : "Snapping disabled"}
                  />
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
                    className="h-6 w-6 hover:bg-[rgba(var(--theme-primary),0.1)] border-l border-[rgba(var(--theme-primary),0.2)] transition-all"
                    onClick={() => setIsCustomizing(!isCustomizing)}
                    title="Customize Quick Actions"
                  >
                    <Settings className="h-2.5 w-2.5" />
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
                    className="h-6 w-6 hover:bg-[rgba(var(--theme-primary),0.1)] transition-all"
                    onClick={() => setIsMinimized(false)}
                    title="Expand Toolbar"
                  >
                    <Maximize2 className="h-2.5 w-2.5" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
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
        data-toolbar="true"
      >
        <Card
          ref={toolbarRef}
          className={cn(
            "fixed z-50 w-80 max-h-[80vh] bg-card/95 backdrop-blur theme-outline-primary shadow-lg select-none will-change-transform overflow-hidden flex flex-col transition-all duration-200",
            isDragging && "shadow-2xl scale-105 border-2 border-[rgb(var(--theme-primary))] bg-card/98"
          )}
          style={{
            left: position.x,
            top: position.y,
            transform: "translate3d(0, 0, 0)",
          }}
          data-toolbar="true"
        >
          {/* Futuristic Background */}
          <ToolbarBackground animationsEnabled={animationsEnabled} />
          
          {/* Header */}
          <CardHeader 
            className="pb-2 cursor-grab active:cursor-grabbing touch-none relative z-10 hover:bg-[rgba(var(--theme-primary),0.05)] transition-all duration-200 border-b border-[rgba(var(--theme-primary),0.1)]" 
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            title="🚀 DRAG ANYWHERE! • Double-click to toggle snapping • Hold Shift while dragging to temporarily disable snapping"
          >
            <motion.div 
              key="header-content"
              className="flex items-center justify-between"
              initial={animationsEnabled ? { opacity: 0, x: -10 } : {}}
              animate={animationsEnabled ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  className="text-[rgb(var(--theme-primary))] hover:text-[rgb(var(--theme-primary))] hover:bg-[rgba(var(--theme-primary),0.1)] p-1 rounded cursor-grab active:cursor-grabbing transition-all duration-200"
                  animate={animationsEnabled ? { x: [0, 2, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  title="🔥 DRAG HANDLE - Click and drag to move toolbar anywhere!"
                >
                  <div className="relative">
                    <GripVertical className="h-4 w-4" />
                    {isDragging && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      />
                    )}
                  </div>
                </motion.div>
                <CardTitle className="text-sm bg-gradient-to-r from-[rgb(var(--theme-primary))] to-slate-200 bg-clip-text text-transparent">
                  Unified Toolkit
                </CardTitle>
                <motion.div
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    snapEnabled ? "bg-[rgb(var(--theme-primary))]" : "bg-yellow-500"
                  )}
                  animate={animationsEnabled ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  title={snapEnabled ? "Snapping enabled" : "Snapping disabled"}
                />
                {!snapEnabled && (
                  <span className="text-xs text-yellow-500 font-medium">No Snap</span>
                )}
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

            {/* Window Controls */}
            <motion.div
              key="window-controls"
              initial={animationsEnabled ? { opacity: 0, height: 0 } : {}}
              animate={animationsEnabled ? { opacity: 1, height: "auto" } : {}}
              exit={animationsEnabled ? { opacity: 0, height: 0 } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className="px-2 py-1">
                <div className="text-xs font-medium text-[rgb(var(--theme-secondary))] mb-1">
                  Window
                </div>
                <WindowControls variant="minimal" className="justify-center" />
              </div>
            </motion.div>

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

      {/* Edit History Panel */}
      {isHistoryPanelVisible && (
        <motion.div
          key="edit-history-panel"
          initial={animationsEnabled ? { scale: 0.9, opacity: 0, x: 20 } : {}}
          animate={animationsEnabled ? { scale: 1, opacity: 1, x: 0 } : {}}
          exit={animationsEnabled ? { scale: 0.9, opacity: 0, x: 20 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed z-50"
          style={{
            left: position.x + 320 + 10, // Position to the right of the toolbar
            top: position.y,
            maxHeight: '80vh',
            width: '400px'
          }}
        >
          <EditHistoryPanel
            stateHistory={stateHistory}
            historyIndex={historyIndex}
            onNavigateToHistory={handleNavigateToHistory}
            onUndo={undo}
            onRedo={redo}
            onClearHistory={() => {
              // Could add clear history functionality here
              dispatch({ type: "ADD_LOG", payload: "Clear history functionality not implemented yet" })
            }}
            className="h-full"
          />
        </motion.div>
      )}

      {/* Snap Preview Overlay */}
      {showSnapPreview && (
        <motion.div
          key="snap-preview"
          initial={animationsEnabled ? { opacity: 0, scale: 0.8 } : {}}
          animate={animationsEnabled ? { opacity: 1, scale: 1 } : {}}
          exit={animationsEnabled ? { opacity: 0, scale: 0.8 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed z-40 pointer-events-none"
          style={{
            left: snapPreviewPosition.x,
            top: snapPreviewPosition.y,
            width: toolbarRef.current?.offsetWidth || 320,
            height: toolbarRef.current?.offsetHeight || 200,
          }}
        >
          <div className="w-full h-full border-2 border-dashed border-[rgba(var(--theme-primary),0.8)] rounded-lg bg-[rgba(var(--theme-primary),0.1)] backdrop-blur-sm">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-[rgba(var(--theme-primary),0.9)] text-white text-xs rounded font-medium">
              Snap to {currentSnapZone?.replace('_', ' ').toLowerCase()}
            </div>
            <motion.div
              className="absolute inset-0 rounded-lg border-2 border-[rgba(var(--theme-primary),0.4)]"
              animate={animationsEnabled ? {
                borderColor: [
                  "rgba(var(--theme-primary), 0.4)",
                  "rgba(var(--theme-primary), 0.8)",
                  "rgba(var(--theme-primary), 0.4)"
                ]
              } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        </motion.div>
      )}

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
