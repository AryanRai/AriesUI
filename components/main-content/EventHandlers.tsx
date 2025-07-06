"use client"

import React, { useCallback, useRef, useEffect } from 'react'
import type { 
  DragState, 
  ResizeState, 
  ViewportState,
  GridStateType,
  ResizeHandle,
  GridItem
} from './types'

interface EventHandlersProps {
  gridState: GridStateType
  setGridState: React.Dispatch<React.SetStateAction<GridStateType>>
  viewport: ViewportState
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>
  dragState: DragState
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
  resizeState: ResizeState
  setResizeState: React.Dispatch<React.SetStateAction<ResizeState>>
  containerRef: React.RefObject<HTMLDivElement>
  children: React.ReactNode
}

export const EventHandlers: React.FC<EventHandlersProps> = ({
  gridState,
  setGridState,
  viewport,
  setViewport,
  dragState,
  setDragState,
  resizeState,
  setResizeState,
  containerRef,
  children
}) => {
  const rafRef = useRef<number | null>(null)
  const [lastMouseMoveTime, setLastMouseMoveTime] = React.useState(0)
  const throttleInterval = 2 // 2ms for ultra-responsive dragging

  /**
   * Handle mouse down for dragging widgets and nests
   */
  const handleMouseDown = useCallback((e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => {
    const target = e.target as HTMLElement
    
    // Check if clicking on a resize handle - if so, don't start drag
    if (target.closest(".resize-handle") || target.classList.contains("resize-handle")) {
      return
    }

    // Enhanced interactive element detection for AriesMods widgets
    const isInteractiveElement = (element: HTMLElement): boolean => {
      if (element.tagName === 'BUTTON' || element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
        return true
      }
      
      if (element.onclick || element.getAttribute('role') === 'button' || element.getAttribute('role') === 'link') {
        return true
      }
      
      if (element.classList.contains('settings-button') || 
          element.closest('.settings-button') ||
          element.getAttribute('data-settings-button') === 'true') {
        return true
      }
      
      if (element.tagName === 'svg' && element.closest('button')) {
        return true
      }
      
      if (element.closest('[role="dialog"]') || element.closest('.dialog-content')) {
        return true
      }
      
      if (element.closest('form') || element.closest('.form-control')) {
        return true
      }
      
      const computedStyle = window.getComputedStyle(element)
      if (computedStyle.cursor === 'pointer') {
        return true
      }
      
      return false
    }

    // For AriesMods widgets, allow dragging from drag handle, header, or grip areas
    if (itemType === "widget") {
      const isAriesWidget = gridState.mainAriesWidgets.some(w => w.id === itemId) || 
                           gridState.nestedAriesWidgets.some(w => w.id === itemId)
      
      if (isAriesWidget) {
        const isDragArea = target.closest('.cursor-grab') || 
                          target.classList.contains('cursor-grab') ||
                          target.closest('[data-drag-handle]') ||
                          target.getAttribute('data-drag-handle') === 'true' ||
                          target.closest('.drag-handle') ||
                          target.classList.contains('drag-handle') ||
                          (target.tagName === 'svg' && target.getAttribute('data-lucide') === 'grip-vertical') ||
                          target.querySelector('svg[data-lucide="grip-vertical"]') ||
                          (target.closest('.cursor-grab') && !target.closest('button'))
        
        if (!isDragArea) {
          if (isInteractiveElement(target)) {
            return
          }
          return
        }
      } else {
        const isDragArea = target.closest('.cursor-grab') || 
                          target.classList.contains('cursor-grab') ||
                          (target.tagName === 'svg' && target.getAttribute('data-lucide') === 'grip-vertical') ||
                          target.querySelector('svg[data-lucide="grip-vertical"]')
        
        if (!isDragArea && isInteractiveElement(target)) {
          return
        }
      }
    }

    e.preventDefault()
    e.stopPropagation()

    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    // Determine source container
    let sourceContainer: "main" | "nest" = "main"
    let sourceNestId: string | undefined

    if (itemType === "widget") {
      const nestedWidget = gridState.nestedWidgets.find((w) => w.id === itemId)
      const nestedAriesWidget = gridState.nestedAriesWidgets.find((w) => w.id === itemId)
      
      if (nestedWidget) {
        sourceContainer = "nest"
        sourceNestId = nestedWidget.nestId
      } else if (nestedAriesWidget) {
        sourceContainer = "nest"
        sourceNestId = nestedAriesWidget.nestId
      }
    }

    // Calculate offset in world coordinates
    const worldMouseX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
    const worldMouseY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y
    
    // Get the item's current position
    let item: any = null
    if (itemType === "widget") {
      item = gridState.mainWidgets.find((w) => w.id === itemId) || 
             gridState.nestedWidgets.find((w) => w.id === itemId) ||
             gridState.mainAriesWidgets.find((w) => w.id === itemId) ||
             gridState.nestedAriesWidgets.find((w) => w.id === itemId)
    } else {
      item = gridState.nestContainers.find((n) => n.id === itemId)
    }

    if (!item) return

    setDragState({
      isDragging: true,
      draggedId: itemId,
      draggedType: itemType,
      sourceContainer,
      sourceNestId,
      offset: {
        x: worldMouseX - item.x,
        y: worldMouseY - item.y,
      },
      lastUpdateTime: Date.now(),
    })
  }, [gridState, viewport, containerRef, setDragState])

  /**
   * Handle resize mouse down for widgets and nests
   */
  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent,
    itemId: string,
    itemType: "widget" | "nest",
    handle: ResizeHandle,
  ) => {
    e.preventDefault()
    e.stopPropagation()

    let item: any = null
    if (itemType === "widget") {
      item = gridState.mainWidgets.find((w) => w.id === itemId) || 
             gridState.nestedWidgets.find((w) => w.id === itemId) ||
             gridState.mainAriesWidgets.find((w) => w.id === itemId) ||
             gridState.nestedAriesWidgets.find((w) => w.id === itemId)
    } else {
      item = gridState.nestContainers.find((n) => n.id === itemId)
    }

    if (!item) return

    // Set proper cursor based on handle
    const cursorMap: Record<ResizeHandle, string> = {
      'nw': 'nw-resize',
      'n': 'n-resize',
      'ne': 'ne-resize',
      'e': 'e-resize',
      'se': 'se-resize',
      's': 's-resize',
      'sw': 'sw-resize',
      'w': 'w-resize'
    }
    document.body.style.cursor = cursorMap[handle]

    // Convert to world coordinates
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    const worldMouseX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
    const worldMouseY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y

    setResizeState({
      isResizing: true,
      resizedId: itemId,
      resizedType: itemType,
      handle,
      startPos: { x: worldMouseX, y: worldMouseY },
      startSize: { w: item.w, h: item.h },
      startPosition: { x: item.x, y: item.y },
      lastUpdateTime: Date.now(),
    })
  }, [gridState, viewport, containerRef, setResizeState])

  /**
   * Handle wheel events for zoom and pan
   */
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      
      // Get mouse position for zoom-to-cursor
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const mouseX = e.clientX - containerRect.left
      const mouseY = e.clientY - containerRect.top
      
      // Convert to world coordinates before zoom
      const worldX = mouseX / viewport.zoom - viewport.x
      const worldY = mouseY / viewport.zoom - viewport.y

      const isTrackpad = Math.abs(e.deltaY) < 50
      const zoomDelta = isTrackpad ? -e.deltaY * 0.003 : (e.deltaY > 0 ? -0.1 : 0.1)
      
      setViewport((prev) => {
        const newZoom = Math.max(0.05, Math.min(10, prev.zoom * (1 + zoomDelta)))
        const zoomRatio = newZoom / prev.zoom
        
        // Zoom towards cursor position
        const newX = worldX - mouseX / newZoom
        const newY = worldY - mouseY / newZoom
        
        return {
          x: newX,
          y: newY,
          zoom: newZoom
        }
      })
    } else {
      // Enhanced smooth panning
      const panSpeed = 1.0
      const deltaX = e.deltaX * panSpeed
      const deltaY = e.deltaY * panSpeed
      
      setViewport((prev) => ({
        ...prev,
        x: prev.x - deltaX / prev.zoom,
        y: prev.y - deltaY / prev.zoom,
      }))
    }
  }, [viewport.zoom, containerRef, setViewport])

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
      
      return () => {
        container.removeEventListener("wheel", handleWheel)
      }
    }
  }, [handleWheel])

  // Hardware-accelerated mouse movement with RequestAnimationFrame
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now()
      
      // Reduce throttling for ultra-responsive dragging
      if (dragState.draggedType === "widget" && now - lastMouseMoveTime < throttleInterval) {
        return
      }
      setLastMouseMoveTime(now)
      
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return

      const gridSize = gridState.gridSize

      // Convert screen coordinates to world coordinates
      const worldX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
      const worldY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y

      // Handle dragging with push physics
      if (dragState.isDragging && dragState.draggedId) {
        const rawX = worldX - dragState.offset.x
        const rawY = worldY - dragState.offset.y
        const smoothX = rawX
        const smoothY = rawY

        // Enhanced hardware-accelerated movement with RAF
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current)
        }
        
        rafRef.current = requestAnimationFrame(() => {
          // Update widget/nest positions
          if (dragState.draggedType === "nest") {
            setGridState((prev) => ({
              ...prev,
              nestContainers: prev.nestContainers.map((nest) => 
                nest.id === dragState.draggedId 
                  ? { ...nest, x: smoothX, y: smoothY, updatedAt: new Date().toISOString() }
                  : nest
              ),
            }))
          } else if (dragState.draggedType === "widget") {
            if (dragState.sourceContainer === "main") {
              setGridState((prev) => ({
                ...prev,
                mainWidgets: prev.mainWidgets.map((widget) =>
                  widget.id === dragState.draggedId
                    ? { ...widget, x: smoothX, y: smoothY, updatedAt: new Date().toISOString() }
                    : widget
                ),
                mainAriesWidgets: prev.mainAriesWidgets.map((widget) =>
                  widget.id === dragState.draggedId
                    ? { ...widget, x: smoothX, y: smoothY, updatedAt: new Date().toISOString() }
                    : widget
                ),
              }))
            } else if (dragState.sourceContainer === "nest") {
              const nest = gridState.nestContainers.find((n) => n.id === dragState.sourceNestId)
              if (nest) {
                const relativeX = smoothX - nest.x
                const relativeY = smoothY - nest.y - 40

                setGridState((prev) => ({
                  ...prev,
                  nestedWidgets: prev.nestedWidgets.map((widget) =>
                    widget.id === dragState.draggedId
                      ? { ...widget, x: relativeX, y: relativeY, updatedAt: new Date().toISOString() }
                      : widget
                  ),
                  nestedAriesWidgets: prev.nestedAriesWidgets.map((widget) =>
                    widget.id === dragState.draggedId
                      ? { ...widget, x: relativeX, y: relativeY, updatedAt: new Date().toISOString() }
                      : widget
                  ),
                }))
              }
            }
          }
          rafRef.current = null
        })
      }

      // Handle resizing
      if (resizeState.isResizing && resizeState.resizedId) {
        const deltaX = worldX - resizeState.startPos.x
        const deltaY = worldY - resizeState.startPos.y
        const minWidth = resizeState.resizedType === "nest" ? 200 : 120
        const minHeight = resizeState.resizedType === "nest" ? 150 : 80

        const updateItem = (item: any) => {
          let newX = resizeState.startPosition.x
          let newY = resizeState.startPosition.y
          let newW = resizeState.startSize.w
          let newH = resizeState.startSize.h

          switch (resizeState.handle) {
            case "nw":
              newX = Math.round((resizeState.startPosition.x + deltaX) / gridSize) * gridSize
              newY = Math.round((resizeState.startPosition.y + deltaY) / gridSize) * gridSize
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w - deltaX) / gridSize) * gridSize)
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h - deltaY) / gridSize) * gridSize)
              break
            case "n":
              newY = Math.round((resizeState.startPosition.y + deltaY) / gridSize) * gridSize
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h - deltaY) / gridSize) * gridSize)
              break
            case "ne":
              newY = Math.round((resizeState.startPosition.y + deltaY) / gridSize) * gridSize
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w + deltaX) / gridSize) * gridSize)
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h - deltaY) / gridSize) * gridSize)
              break
            case "e":
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w + deltaX) / gridSize) * gridSize)
              break
            case "se":
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w + deltaX) / gridSize) * gridSize)
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h + deltaY) / gridSize) * gridSize)
              break
            case "s":
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h + deltaY) / gridSize) * gridSize)
              break
            case "sw":
              newX = Math.round((resizeState.startPosition.x + deltaX) / gridSize) * gridSize
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w - deltaX) / gridSize) * gridSize)
              newH = Math.max(minHeight, Math.round((resizeState.startSize.h + deltaY) / gridSize) * gridSize)
              break
            case "w":
              newX = Math.round((resizeState.startPosition.x + deltaX) / gridSize) * gridSize
              newW = Math.max(minWidth, Math.round((resizeState.startSize.w - deltaX) / gridSize) * gridSize)
              break
          }

          return {
            ...item,
            x: newX,
            y: newY,
            w: newW,
            h: newH,
            updatedAt: new Date().toISOString(),
          }
        }

        if (resizeState.resizedType === "widget") {
          const isNestedWidget = gridState.nestedWidgets.some((w) => w.id === resizeState.resizedId)
          const isNestedAriesWidget = gridState.nestedAriesWidgets.some((w) => w.id === resizeState.resizedId)
          const isMainAriesWidget = gridState.mainAriesWidgets.some((w) => w.id === resizeState.resizedId)
          
          if (isNestedWidget) {
            setGridState((prev) => ({
              ...prev,
              nestedWidgets: prev.nestedWidgets.map((widget) =>
                widget.id === resizeState.resizedId ? updateItem(widget) : widget,
              ),
            }))
          } else if (isNestedAriesWidget) {
            setGridState((prev) => ({
              ...prev,
              nestedAriesWidgets: prev.nestedAriesWidgets.map((widget) =>
                widget.id === resizeState.resizedId ? updateItem(widget) : widget,
              ),
            }))
          } else if (isMainAriesWidget) {
            setGridState((prev) => ({
              ...prev,
              mainAriesWidgets: prev.mainAriesWidgets.map((widget) =>
                widget.id === resizeState.resizedId ? updateItem(widget) : widget,
              ),
            }))
          } else {
            setGridState((prev) => ({
              ...prev,
              mainWidgets: prev.mainWidgets.map((widget) =>
                widget.id === resizeState.resizedId ? updateItem(widget) : widget,
              ),
            }))
          }
        } else if (resizeState.resizedType === "nest") {
          setGridState((prev) => ({
            ...prev,
            nestContainers: prev.nestContainers.map((nest) =>
              nest.id === resizeState.resizedId ? updateItem(nest) : nest,
            ),
          }))
        }
      }
    }

    const handleMouseUp = () => {
      // Reset cursor to default
      document.body.style.cursor = 'default'
      
      // Auto-snap to grid on release
      if (dragState.isDragging && dragState.draggedId) {
        const gridSize = gridState.gridSize
        
        let currentWidget: any = null
        if (dragState.draggedType === "widget") {
          if (dragState.sourceContainer === "main") {
            currentWidget = gridState.mainWidgets.find((w) => w.id === dragState.draggedId) ||
                           gridState.mainAriesWidgets.find((w) => w.id === dragState.draggedId)
          } else {
            currentWidget = gridState.nestedWidgets.find((w) => w.id === dragState.draggedId) ||
                           gridState.nestedAriesWidgets.find((w) => w.id === dragState.draggedId)
          }
        } else if (dragState.draggedType === "nest") {
          currentWidget = gridState.nestContainers.find((n) => n.id === dragState.draggedId)
        }

        if (currentWidget) {
          const snappedX = Math.round(currentWidget.x / gridSize) * gridSize
          const snappedY = Math.round(currentWidget.y / gridSize) * gridSize

          // Apply snap to grid
          if (dragState.draggedType === "nest") {
            setGridState((prev) => ({
              ...prev,
              nestContainers: prev.nestContainers.map((nest) => 
                nest.id === dragState.draggedId 
                  ? { ...nest, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
                  : nest
              ),
            }))
          } else if (dragState.draggedType === "widget") {
            if (dragState.sourceContainer === "main") {
              setGridState((prev) => ({
                ...prev,
                mainWidgets: prev.mainWidgets.map((widget) =>
                  widget.id === dragState.draggedId
                    ? { ...widget, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
                    : widget
                ),
                mainAriesWidgets: prev.mainAriesWidgets.map((widget) =>
                  widget.id === dragState.draggedId
                    ? { ...widget, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
                    : widget
                ),
              }))
            } else if (dragState.sourceContainer === "nest") {
              setGridState((prev) => ({
                ...prev,
                nestedWidgets: prev.nestedWidgets.map((widget) =>
                  widget.id === dragState.draggedId
                    ? { ...widget, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
                    : widget
                ),
                nestedAriesWidgets: prev.nestedAriesWidgets.map((widget) =>
                  widget.id === dragState.draggedId
                    ? { ...widget, x: snappedX, y: snappedY, updatedAt: new Date().toISOString() }
                    : widget
                ),
              }))
            }
          }
        }
      }

      setDragState({
        isDragging: false,
        draggedId: null,
        draggedType: null,
        sourceContainer: null,
        offset: { x: 0, y: 0 },
        lastUpdateTime: Date.now(),
      })

      setResizeState({
        isResizing: false,
        resizedId: null,
        resizedType: null,
        handle: null,
        startPos: { x: 0, y: 0 },
        startSize: { w: 0, h: 0 },
        startPosition: { x: 0, y: 0 },
        lastUpdateTime: Date.now(),
      })
    }

    if (dragState.isDragging || resizeState.isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [dragState, resizeState, viewport, gridState, containerRef, setGridState, setDragState, setResizeState, lastMouseMoveTime, throttleInterval])

  return (
    <div className="event-handlers">
      {React.cloneElement(children as React.ReactElement, {
        onMouseDown: handleMouseDown,
        onResizeMouseDown: handleResizeMouseDown
      })}
    </div>
  )
}

export { EventHandlers } 