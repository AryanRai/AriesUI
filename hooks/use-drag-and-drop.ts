/**
 * useDragAndDrop Hook
 * 
 * Manages drag and drop state and operations for the grid system.
 * Handles widget and nest dragging with push physics and smooth animations.
 */

import { useState, useRef, useCallback } from "react"
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
  containerRef: React.RefObject<HTMLDivElement>
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
      // Find if this is an AriesMod widget by checking for specific classes
      const isAriesModWidget = target.closest('.aries-mod-widget') !== null
      
      if (isAriesModWidget) {
        // For AriesModWidget, only allow dragging from the drag area (header with grip icon)
        const isDragArea = target.closest('.cursor-grab') || 
                          target.classList.contains('cursor-grab') ||
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
    
    // Handle the drop logic here if needed
    // This would typically involve updating the grid state
    // based on the dropped item and target location
    
    if (dragState.isDragging && dragState.draggedId) {
      console.log("Dropped item:", dragState.draggedId, "on nest:", nestId)
      dispatch({ type: "ADD_LOG", payload: `Dropped ${dragState.draggedType} ${dragState.draggedId}` })
    }
  }, [dragState, dispatch])

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