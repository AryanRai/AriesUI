/**
 * useDragAndDrop Hook
 * 
 * Manages drag and drop state and operations for the grid system.
 * Handles widget and nest dragging with push physics and smooth animations.
 */

import { useState, useRef, useCallback, useEffect } from "react"
import { generateUniqueId, findNonCollidingPosition } from "@/components/grid/utils"
import type { GridState as GridStateType, ResizeHandle } from "@/components/grid/types"
import type { ViewportState } from "./use-viewport-controls"

export interface DragState {
  isDragging: boolean
  draggedId: string | null
  draggedType: "widget" | "nest" | null
  sourceContainer: "main" | "nest" | null
  sourceNestId?: string
  offset: { x: number; y: number }
  lastUpdateTime: number
  animationFrameId?: number
}

export interface DropState {
  isDragOver: boolean
  targetNestId: string | null
}

export interface UseDragAndDropProps {
  gridState: GridStateType
  setGridState: React.Dispatch<React.SetStateAction<GridStateType>>
  viewport: ViewportState
  containerRef: React.RefObject<HTMLDivElement | null>
  dispatch: any
}

export interface UseDragAndDropReturn {
  dragState: DragState
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
  dropState: DropState
  setDropState: React.Dispatch<React.SetStateAction<DropState>>
  dragOverNest: string | null
  setDragOverNest: React.Dispatch<React.SetStateAction<string | null>>
  pushedWidgets: Set<string>
  setPushedWidgets: React.Dispatch<React.SetStateAction<Set<string>>>
  isHoveringOverNest: boolean
  setIsHoveringOverNest: React.Dispatch<React.SetStateAction<boolean>>
  handleMouseDown: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => void
  handleDragOver: (e: React.DragEvent, nestId?: string) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent, nestId?: string) => void
}

const DEFAULT_DRAG_STATE: DragState = {
  isDragging: false,
  draggedId: null,
  draggedType: null,
  sourceContainer: null,
  offset: { x: 0, y: 0 },
  lastUpdateTime: 0,
}

const DEFAULT_DROP_STATE: DropState = {
  isDragOver: false,
  targetNestId: null,
}

/**
 * Check if moving a nest to another nest would create a circular dependency
 */
const checkCircularNesting = (
  draggedNest: any, 
  targetNestId: string, 
  allNests: any[]
): boolean => {
  // Check if the target nest is already a child of the dragged nest
  const isTargetChildOfDragged = (nestId: string): boolean => {
    const nest = allNests.find(n => n.id === nestId)
    if (!nest) return false
    
    if (nest.parentNestId === draggedNest.id) return true
    if (nest.parentNestId) return isTargetChildOfDragged(nest.parentNestId)
    
    return false
  }
  
  return isTargetChildOfDragged(targetNestId)
}

export const useDragAndDrop = ({
  gridState,
  setGridState,
  viewport,
  containerRef,
  dispatch,
}: UseDragAndDropProps): UseDragAndDropReturn => {
  // State management for drag, resize, and drop operations
  const [dragState, setDragState] = useState<DragState>(DEFAULT_DRAG_STATE)
  const [dropState, setDropState] = useState<DropState>(DEFAULT_DROP_STATE)
  const [dragOverNest, setDragOverNest] = useState<string | null>(null)
  const [pushedWidgets, setPushedWidgets] = useState<Set<string>>(new Set())
  const [isHoveringOverNest, setIsHoveringOverNest] = useState(false)

  /**
   * Check if target is an interactive element that should prevent dragging
   */
  const isInteractiveElement = useCallback((target: HTMLElement): boolean => {
    return (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.classList.contains('interactive') ||
      target.closest('button') !== null ||
      target.closest('input') !== null ||
      target.closest('select') !== null ||
      target.closest('textarea') !== null ||
      target.closest('.interactive') !== null
    )
  }, [])

  /**
   * Handle mouse down for drag start
   */
  const handleMouseDown = useCallback((e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => {
    // Prevent dragging on right-click or if already dragging
    if (e.button !== 0 || dragState.isDragging) return

    const target = e.target as HTMLElement

    // Check for interactive elements and drag areas
    if (itemType === "widget") {
      // Find if this is an AriesMod widget by checking the widget type from grid state
      const isAriesModWidget = gridState.mainAriesWidgets.some(w => w.id === itemId) || 
                              gridState.nestedAriesWidgets.some(w => w.id === itemId)
      
      if (isAriesModWidget) {
        // For AriesModWidget, only allow dragging from the drag area (header with grip icon)
        const isDragArea = target.closest('.cursor-grab') || 
                          target.classList.contains('cursor-grab') ||
                          target.closest('[data-drag-handle="true"]') ||
                          target.getAttribute('data-drag-handle') === 'true' ||
                          (target.tagName === 'svg' && target.getAttribute('data-lucide') === 'grip-vertical') ||
                          target.querySelector('svg[data-lucide="grip-vertical"]')
        
        if (!isDragArea) {
          // Check if clicking on interactive elements within AriesMod
          if (isInteractiveElement(target)) {
            console.log("AriesMod widget: Clicked on interactive element, preventing drag")
            return
          }
          console.log("AriesMod widget: Not clicking on drag area, preventing drag")
          return
        }
        
        console.log("AriesMod widget: Drag area clicked, allowing drag")
      } else {
        // For regular widgets, allow dragging from header but prevent from interactive elements
        const isDragArea = target.closest('.cursor-grab') || 
                          target.classList.contains('cursor-grab') ||
                          target.closest('[data-drag-handle="true"]') ||
                          target.getAttribute('data-drag-handle') === 'true' ||
                          (target.tagName === 'svg' && target.getAttribute('data-lucide') === 'grip-vertical') ||
                          target.querySelector('svg[data-lucide="grip-vertical"]')
        
        if (!isDragArea && isInteractiveElement(target)) {
          console.log("Regular widget: Clicked on interactive element, preventing drag:", target)
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

    console.log("Starting drag for:", itemType, itemId, "from container:", sourceContainer)

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
  }, [dragState.isDragging, containerRef, viewport, gridState, isInteractiveElement])

  /**
   * Handle mouse move for drag operations
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedId) return

    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    // Calculate world coordinates
    const worldX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
    const worldY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y

    // Get current item
    let item: any = null
    if (dragState.draggedType === "widget") {
      item = gridState.mainWidgets.find((w) => w.id === dragState.draggedId) || 
             gridState.nestedWidgets.find((w) => w.id === dragState.draggedId) ||
             gridState.mainAriesWidgets.find((w) => w.id === dragState.draggedId) ||
             gridState.nestedAriesWidgets.find((w) => w.id === dragState.draggedId)
    } else {
      item = gridState.nestContainers.find((n) => n.id === dragState.draggedId)
    }

    if (!item) return

    // Calculate new position
    const newX = Math.round((worldX - dragState.offset.x) / gridState.gridSize) * gridState.gridSize
    const newY = Math.round((worldY - dragState.offset.y) / gridState.gridSize) * gridState.gridSize

    // Update the item position
    if (dragState.draggedType === "widget") {
      setGridState(prev => ({
        ...prev,
        mainWidgets: prev.mainWidgets.map(w => 
          w.id === dragState.draggedId ? { ...w, x: newX, y: newY } : w
        ),
        nestedWidgets: prev.nestedWidgets.map(w => 
          w.id === dragState.draggedId ? { ...w, x: newX, y: newY } : w
        ),
        mainAriesWidgets: prev.mainAriesWidgets.map(w => 
          w.id === dragState.draggedId ? { ...w, x: newX, y: newY } : w
        ),
        nestedAriesWidgets: prev.nestedAriesWidgets.map(w => 
          w.id === dragState.draggedId ? { ...w, x: newX, y: newY } : w
        ),
      }))
    } else {
      setGridState(prev => ({
        ...prev,
        nestContainers: prev.nestContainers.map(n => 
          n.id === dragState.draggedId ? { ...n, x: newX, y: newY } : n
        ),
      }))
    }
  }, [dragState, containerRef, viewport, gridState, setGridState])

  /**
   * Handle mouse up for drag operations
   */
  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState(DEFAULT_DRAG_STATE)
      setPushedWidgets(new Set())
    }
  }, [dragState.isDragging])

  /**
   * Set up mouse event listeners for drag operations
   */
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp])

  /**
   * Handle drag over for drop zones
   */
  const handleDragOver = useCallback((e: React.DragEvent, nestId?: string) => {
    e.preventDefault()
    setDropState({
      isDragOver: true,
      targetNestId: nestId || null,
    })
  }, [])

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    setDropState(DEFAULT_DROP_STATE)
  }, [])

  /**
   * Handle drop operations
   */
  const handleDrop = useCallback((e: React.DragEvent, nestId?: string) => {
    e.preventDefault()
    setDropState(DEFAULT_DROP_STATE)
    
    // Handle external drops from AriesMods palette
    try {
      const dragData = e.dataTransfer.getData("application/json")
      if (dragData) {
        const parsedData = JSON.parse(dragData)
        
        if (parsedData.type === 'ariesmods' && parsedData.isFromPalette) {
          // Calculate drop position
          const containerRect = containerRef.current?.getBoundingClientRect()
          if (!containerRect) return
          
          const x = (e.clientX - containerRect.left - viewport.x) / viewport.zoom
          const y = (e.clientY - containerRect.top - viewport.y) / viewport.zoom
          
          // Snap to grid
          const gridSize = gridState.gridSize
          const snappedX = Math.round(x / gridSize) * gridSize
          const snappedY = Math.round(y / gridSize) * gridSize
          
          // Find non-colliding position
          const existingItems = nestId 
            ? gridState.nestContainers.find(nest => nest.id === nestId)?.widgets || []
            : [...gridState.mainWidgets, ...gridState.nestContainers]
          
          const baseWidget = {
            x: snappedX,
            y: snappedY,
            w: parsedData.defaultSize.w,
            h: parsedData.defaultSize.h,
          }
          
          const nonCollidingPos = findNonCollidingPosition(baseWidget, existingItems, gridSize)
          
          // Create new widget from AriesMods
          const newWidget = {
            id: generateUniqueId("widget"),
            type: "ariesmods", // Fixed: should be "ariesmods" not "ariesmod"
            ariesModType: parsedData.ariesModType,
            title: parsedData.title,
            x: nonCollidingPos.x,
            y: nonCollidingPos.y,
            w: parsedData.defaultSize.w,
            h: parsedData.defaultSize.h,
            config: {}, // Add empty config object
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          
          // Add to appropriate container
          if (nestId) {
            // Add to nest container as NestedAriesWidget
            const nestedWidget = {
              ...newWidget,
              nestId: nestId
            }
            setGridState(prev => ({
              ...prev,
              nestedAriesWidgets: [...prev.nestedAriesWidgets, nestedWidget]
            }))
          } else {
            // Add to main grid as AriesWidget
            setGridState(prev => ({
              ...prev,
              mainAriesWidgets: [...prev.mainAriesWidgets, newWidget]
            }))
          }
          
          dispatch({ type: "ADD_LOG", payload: `Added AriesMod: ${parsedData.title}` })
          return
        }
      }
    } catch (error) {
      console.error("Error handling drop:", error)
    }
    
    // Handle internal drag operations - moving widgets/nests into nests
    if (dragState.isDragging && dragState.draggedId) {
      const draggedId = dragState.draggedId
      const draggedType = dragState.draggedType
      
      // Handle moving widgets to nests
      if (nestId && draggedType === "widget") {
        // Find the dragged widget
        let draggedWidget = null
        let sourceContainer = null
        
        // Check main widgets first
        const mainWidgetIndex = gridState.mainWidgets.findIndex(w => w.id === draggedId)
        if (mainWidgetIndex !== -1) {
          draggedWidget = gridState.mainWidgets[mainWidgetIndex]
          sourceContainer = "main"
        }
        
        // Check nested widgets
        if (!draggedWidget) {
          const nestedWidgetIndex = gridState.nestedWidgets.findIndex(w => w.id === draggedId)
          if (nestedWidgetIndex !== -1) {
            draggedWidget = gridState.nestedWidgets[nestedWidgetIndex]
            sourceContainer = "nested"
          }
        }
        
        // Check main aries widgets
        if (!draggedWidget) {
          const mainAriesWidgetIndex = gridState.mainAriesWidgets.findIndex(w => w.id === draggedId)
          if (mainAriesWidgetIndex !== -1) {
            draggedWidget = gridState.mainAriesWidgets[mainAriesWidgetIndex]
            sourceContainer = "mainAries"
          }
        }
        
        // Check nested aries widgets
        if (!draggedWidget) {
          const nestedAriesWidgetIndex = gridState.nestedAriesWidgets.findIndex(w => w.id === draggedId)
          if (nestedAriesWidgetIndex !== -1) {
            draggedWidget = gridState.nestedAriesWidgets[nestedAriesWidgetIndex]
            sourceContainer = "nestedAries"
          }
        }
        
        if (draggedWidget && sourceContainer) {
          // Create the new nested widget
          const newNestedWidget = {
            ...draggedWidget,
            nestId: nestId,
            // Reset position relative to nest
            x: 0,
            y: 0
          }
          
          // Update grid state - remove from source and add to nest
          setGridState(prev => {
            const newState = { ...prev }
            
            // Remove from source container
            switch (sourceContainer) {
              case "main":
                newState.mainWidgets = newState.mainWidgets.filter(w => w.id !== draggedId)
                newState.nestedWidgets = [...newState.nestedWidgets, newNestedWidget]
                break
              case "nested":
                newState.nestedWidgets = newState.nestedWidgets.map(w => 
                  w.id === draggedId ? { ...w, nestId: nestId } : w
                )
                break
              case "mainAries":
                newState.mainAriesWidgets = newState.mainAriesWidgets.filter(w => w.id !== draggedId)
                newState.nestedAriesWidgets = [...newState.nestedAriesWidgets, newNestedWidget]
                break
              case "nestedAries":
                newState.nestedAriesWidgets = newState.nestedAriesWidgets.map(w => 
                  w.id === draggedId ? { ...w, nestId: nestId } : w
                )
                break
            }
            
            return newState
          })
          
          dispatch({ type: "ADD_LOG", payload: `Moved ${draggedType} ${draggedId} to nest ${nestId}` })
        }
      }
      
      // Handle moving nests into nests (nested nests)
      if (nestId && draggedType === "nest") {
        const draggedNest = gridState.nestContainers.find(n => n.id === draggedId)
        if (draggedNest && draggedNest.id !== nestId) {
          // Prevent circular nesting
          const isCircular = checkCircularNesting(draggedNest, nestId, gridState.nestContainers)
          
          if (!isCircular) {
            setGridState(prev => ({
              ...prev,
              nestContainers: prev.nestContainers.map(n => 
                n.id === draggedId ? { ...n, parentNestId: nestId, x: 0, y: 0 } : n
              )
            }))
            
            dispatch({ type: "ADD_LOG", payload: `Moved nest ${draggedId} to nest ${nestId}` })
          } else {
            dispatch({ type: "ADD_LOG", payload: `Cannot create circular nest dependency` })
          }
        }
      }
      
      console.log("Dropped item:", dragState.draggedId, "on nest:", nestId)
    }
  }, [dragState, dispatch, containerRef, viewport, gridState, setGridState])

  return {
    dragState,
    setDragState,
    dropState,
    setDropState,
    dragOverNest,
    setDragOverNest,
    pushedWidgets,
    setPushedWidgets,
    isHoveringOverNest,
    setIsHoveringOverNest,
    handleMouseDown,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}