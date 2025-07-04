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
} from "lucide-react"
import { useComms } from "@/components/comms-context"
import { useAnimationPreferences } from "@/hooks/use-animation-preferences"
import { cn } from "@/lib/utils"

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
            "0 0 0px rgba(20, 184, 166, 0)",
            "0 0 15px rgba(20, 184, 166, 0.3)",
            "0 0 0px rgba(20, 184, 166, 0)"
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.05)_1px,transparent_1px)] bg-[size:20px_20px] rounded-lg" />
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-teal-400/30 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-teal-400/30 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-teal-400/30 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-teal-400/30 rounded-br-lg" />
    </div>
  )
}

export function FloatingToolbar() {
  const { dispatch } = useComms()
  const { animationsEnabled } = useAnimationPreferences()
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMinimized, setIsMinimized] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

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

  const handleAddWidget = useCallback(() => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: "basic",
      title: "New Widget",
      content: "Widget content",
      x: Math.floor(Math.random() * 400),
      y: Math.floor(Math.random() * 300),
      w: 200,
      h: 150,
    }
    dispatch({ type: "ADD_WIDGET", payload: newWidget })
    dispatch({ type: "ADD_LOG", payload: `New widget created: ${newWidget.id}` })
  }, [dispatch])

  const MotionWrapper = animationsEnabled ? motion.div : 'div'
  const quickActions = [
    { icon: Save, action: () => dispatch({ type: "ADD_LOG", payload: "Layout saved" }), label: "Save" },
    { icon: Plus, action: handleAddWidget, label: "Add Widget" },
    { icon: Terminal, action: () => dispatch({ type: "SET_MODAL", payload: "terminal" }), label: "Terminal" },
  ]

  // If minimized, show compact version
  if (isMinimized) {
    return (
      <MotionWrapper
        {...(animationsEnabled ? {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
          transition: { type: "spring", stiffness: 400, damping: 30 }
        } : {})}
      >
        <Card
          ref={toolbarRef}
          className="fixed z-50 bg-card/95 backdrop-blur border-teal-500/30 shadow-lg select-none will-change-transform overflow-hidden"
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
                {...(animationsEnabled ? {
                  animate: { x: [0, 2, 0] },
                  transition: { duration: 2, repeat: Infinity }
                } : {})}
              >
                <GripVertical className="h-3 w-3 text-teal-400" />
              </motion.div>

              {/* Quick Action Buttons */}
              {quickActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <MotionWrapper
                    key={index}
                    {...(animationsEnabled ? {
                      whileHover: { scale: 1.1, rotate: 5 },
                      whileTap: { scale: 0.9 }
                    } : {})}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                      onClick={action.action}
                      title={action.label}
                    >
                      <IconComponent className="h-3 w-3" />
                    </Button>
                  </MotionWrapper>
                )
              })}

              {/* Maximize Button */}
              <MotionWrapper
                {...(animationsEnabled ? {
                  whileHover: { scale: 1.1, rotate: 90 },
                  whileTap: { scale: 0.9 }
                } : {})}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-teal-500/10 ml-1 border-l border-teal-500/20 transition-all"
                  onClick={() => setIsMinimized(false)}
                  title="Expand Toolbar"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </MotionWrapper>
            </div>
          </div>
        </Card>
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
        <Card
          ref={toolbarRef}
          className="fixed z-50 w-64 bg-card/95 backdrop-blur border-teal-500/30 shadow-lg select-none will-change-transform overflow-hidden"
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
                <CardTitle className="text-sm bg-gradient-to-r from-teal-400 to-slate-200 bg-clip-text text-transparent">
                  Toolkit
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
                  onClick={() => setIsMinimized(true)}
                  title="Minimize Toolbar"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
              </MotionWrapper>
            </MotionWrapper>
          </CardHeader>
          
          {/* Content */}
          <CardContent className="space-y-2 relative z-10">
            {/* File Section */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <MotionWrapper
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.02, x: 2 },
                    whileTap: { scale: 0.98 }
                  } : {})}
                >
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-xs hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                  >
                    File
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </MotionWrapper>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                <MotionWrapper
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.02, x: 4 },
                    whileTap: { scale: 0.98 }
                  } : {})}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs gap-2 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                    onClick={() => dispatch({ type: "ADD_LOG", payload: "Layout saved" })}
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                </MotionWrapper>
                <MotionWrapper
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.02, x: 4 },
                    whileTap: { scale: 0.98 }
                  } : {})}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs gap-2 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                    onClick={() => dispatch({ type: "CLEAR_WIDGETS" })}
                  >
                    <Trash2 className="h-3 w-3" />
                    Destroy
                  </Button>
                </MotionWrapper>
                <MotionWrapper
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.02, x: 4 },
                    whileTap: { scale: 0.98 }
                  } : {})}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-xs gap-2 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                  >
                    <Plus className="h-3 w-3" />
                    Create
                  </Button>
                </MotionWrapper>
              </CollapsibleContent>
            </Collapsible>

            {/* Insert Section */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <MotionWrapper
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.02, x: 2 },
                    whileTap: { scale: 0.98 }
                  } : {})}
                >
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-xs hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                  >
                    Insert
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </MotionWrapper>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                <MotionWrapper
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.02, x: 4 },
                    whileTap: { scale: 0.98 }
                  } : {})}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs gap-2 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("addNestContainer"))
                      dispatch({ type: "ADD_LOG", payload: "Nest container created" })
                    }}
                  >
                    <Grid3X3 className="h-3 w-3" />
                    Nest
                  </Button>
                </MotionWrapper>
                <MotionWrapper
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.02, x: 4 },
                    whileTap: { scale: 0.98 }
                  } : {})}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-xs gap-2 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all" 
                    onClick={handleAddWidget}
                  >
                    <Widget className="h-3 w-3" />
                    Widget
                  </Button>
                </MotionWrapper>
              </CollapsibleContent>
            </Collapsible>

            {/* Load Section */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <MotionWrapper
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.02, x: 2 },
                    whileTap: { scale: 0.98 }
                  } : {})}
                >
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-xs hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                  >
                    Load
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </MotionWrapper>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                <MotionWrapper
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.02, x: 4 },
                    whileTap: { scale: 0.98 }
                  } : {})}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-xs gap-2 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                  >
                    <FolderOpen className="h-3 w-3" />
                    Browse
                  </Button>
                </MotionWrapper>
              </CollapsibleContent>
            </Collapsible>

            {/* AriesMods Section */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <MotionWrapper
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.02, x: 2 },
                    whileTap: { scale: 0.98 }
                  } : {})}
                >
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-xs hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
                  >
                    AriesMods
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </MotionWrapper>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                <motion.div 
                  className="border-2 border-dashed border-teal-500/30 rounded p-2 text-center hover:border-teal-500/50 transition-colors"
                  {...(animationsEnabled ? {
                    whileHover: { scale: 1.02 },
                    animate: {
                      borderColor: [
                        "rgba(20, 184, 166, 0.3)",
                        "rgba(20, 184, 166, 0.5)",
                        "rgba(20, 184, 166, 0.3)"
                      ]
                    },
                    transition: { duration: 3, repeat: Infinity }
                  } : {})}
                >
                  <p className="text-xs text-teal-300">Drop .js files here</p>
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </MotionWrapper>
    </AnimatePresence>
  )
}
