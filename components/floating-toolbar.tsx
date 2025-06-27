"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
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
} from "lucide-react"
import { useComms } from "@/components/comms-context"

export function FloatingToolbar() {
  const { dispatch } = useComms()
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

  const quickActions = [
    {
      icon: Save,
      label: "Save",
      action: () => dispatch({ type: "ADD_LOG", payload: "Layout saved" }),
    },
    {
      icon: Plus,
      label: "Widget",
      action: handleAddWidget,
    },
    {
      icon: Grid3X3,
      label: "Nest",
      action: () => {
        window.dispatchEvent(new CustomEvent("addNestContainer"))
        dispatch({ type: "ADD_LOG", payload: "Nest container created" })
      },
    },
    {
      icon: Trash2,
      label: "Clear",
      action: () => dispatch({ type: "CLEAR_WIDGETS" }),
    },
    {
      icon: Terminal,
      label: "Terminal",
      action: () => dispatch({ type: "SET_MODAL", payload: "terminal" }),
    },
  ]

  if (isMinimized) {
    return (
      <Card
        ref={toolbarRef}
        className="fixed z-50 bg-card/95 backdrop-blur border-border/50 shadow-lg select-none will-change-transform"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate3d(0, 0, 0)", // Enable hardware acceleration
        }}
      >
        <div className="flex items-center gap-1 p-2">
          {/* Drag Handle */}
          <div
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded touch-none"
            onMouseDown={handleMouseDown}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>

          {/* Quick Action Buttons */}
          {quickActions.map((action, index) => {
            const IconComponent = action.icon
            return (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-muted/50"
                onClick={action.action}
                title={action.label}
              >
                <IconComponent className="h-3 w-3" />
              </Button>
            )
          })}

          {/* Maximize Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-muted/50 ml-1 border-l border-border/30"
            onClick={() => setIsMinimized(false)}
            title="Expand Toolbar"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      ref={toolbarRef}
      className="fixed z-50 w-64 bg-card/95 backdrop-blur border-border/50 shadow-lg select-none will-change-transform"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate3d(0, 0, 0)", // Enable hardware acceleration
      }}
    >
      <CardHeader className="pb-2 cursor-grab active:cursor-grabbing touch-none" onMouseDown={handleMouseDown}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Toolbar</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-muted/50"
            onClick={() => setIsMinimized(true)}
            title="Minimize Toolbar"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* File Section */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-xs">
              File
              <ChevronDown className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs gap-2"
              onClick={() => dispatch({ type: "ADD_LOG", payload: "Layout saved" })}
            >
              <Save className="h-3 w-3" />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs gap-2"
              onClick={() => dispatch({ type: "CLEAR_WIDGETS" })}
            >
              <Trash2 className="h-3 w-3" />
              Destroy
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-2">
              <Plus className="h-3 w-3" />
              Create
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Insert Section */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-xs">
              Insert
              <ChevronDown className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs gap-2"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("addNestContainer"))
                dispatch({ type: "ADD_LOG", payload: "Nest container created" })
              }}
            >
              <Grid3X3 className="h-3 w-3" />
              Nest
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-2" onClick={handleAddWidget}>
              <Widget className="h-3 w-3" />
              Widget
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Load Section */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-xs">
              Load
              <ChevronDown className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs gap-2">
              <FolderOpen className="h-3 w-3" />
              Browse
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* AriesMods Section */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-xs">
              AriesMods
              <ChevronDown className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            <div className="border-2 border-dashed border-border/50 rounded p-2 text-center">
              <p className="text-xs text-muted-foreground">Drop .js files here</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
