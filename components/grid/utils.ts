/**
 * Utility functions for the AriesUI Grid System
 * 
 * This file contains optimized utility functions for collision detection,
 * physics calculations, and grid operations extracted from main-content.tsx
 */

import type { 
  Position, 
  Size, 
  Bounds, 
  CollisionResult, 
  PushResult, 
  Widget, 
  NestedWidget
} from "./types"
import { GRID_CONSTANTS } from "./types"

// =============================================================================
// ID GENERATION UTILITIES
// =============================================================================

/**
 * Generate a unique ID with timestamp and random suffix
 * @param prefix - Prefix for the ID
 * @returns Unique ID string
 */
export const generateUniqueId = (prefix: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Generate a short ID for display purposes
 * @param fullId - Full ID string
 * @returns Short ID for display
 */
export const getShortId = (fullId: string): string => {
  return fullId.split("-").pop() || fullId
}

// =============================================================================
// COLLISION DETECTION UTILITIES
// =============================================================================

/**
 * Optimized AABB collision detection with early exit
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns True if rectangles collide
 */
export const checkCollision = (
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number },
): boolean => {
  // Early exit optimization - check most likely non-collision cases first
  if (rect1.x >= rect2.x + rect2.w) return false
  if (rect2.x >= rect1.x + rect1.w) return false
  if (rect1.y >= rect2.y + rect2.h) return false
  if (rect2.y >= rect1.y + rect1.h) return false
  
  return true
}

/**
 * Calculate collision overlap and determine primary direction
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns Collision details with overlap amounts and direction
 */
export const getCollisionOverlap = (
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number },
): CollisionResult => {
  const overlapX = Math.min(rect1.x + rect1.w, rect2.x + rect2.w) - Math.max(rect1.x, rect2.x)
  const overlapY = Math.min(rect1.y + rect1.h, rect2.y + rect2.h) - Math.max(rect1.y, rect2.y)

  // Determine primary push direction based on smaller overlap
  const direction = overlapX < overlapY ? "horizontal" : "vertical"
  const hasCollision = overlapX > 0 && overlapY > 0

  return { hasCollision, overlapX, overlapY, direction }
}

/**
 * Calculate push direction based on widget centers and collision overlap
 * @param draggedWidget - Widget being dragged
 * @param targetWidget - Widget being pushed
 * @returns Push direction vector
 */
export const calculatePushDirection = (
  draggedWidget: { x: number; y: number; w: number; h: number },
  targetWidget: { x: number; y: number; w: number; h: number },
): PushResult => {
  const draggedCenterX = draggedWidget.x + draggedWidget.w / 2
  const draggedCenterY = draggedWidget.y + draggedWidget.h / 2
  const targetCenterX = targetWidget.x + targetWidget.w / 2
  const targetCenterY = targetWidget.y + targetWidget.h / 2

  const deltaX = targetCenterX - draggedCenterX
  const deltaY = targetCenterY - draggedCenterY

  const overlap = getCollisionOverlap(draggedWidget, targetWidget)

  if (overlap.direction === "horizontal") {
    // Push horizontally with reduced force for smoother interaction
    const pushDistance = overlap.overlapX + GRID_CONSTANTS.COLLISION_BUFFER
    return {
      dx: deltaX > 0 ? pushDistance : -pushDistance,
      dy: 0,
    }
  } else {
    // Push vertically with reduced force for smoother interaction
    const pushDistance = overlap.overlapY + GRID_CONSTANTS.COLLISION_BUFFER
    return {
      dx: 0,
      dy: deltaY > 0 ? pushDistance : -pushDistance,
    }
  }
}

// =============================================================================
// SPATIAL ALGORITHMS
// =============================================================================

/**
 * Find a non-colliding position using spiral search algorithm
 * @param newWidget - Widget to place
 * @param existingWidgets - Existing widgets to avoid
 * @param gridSize - Grid size for snapping
 * @param containerBounds - Optional container bounds
 * @returns Non-colliding position
 */
export const findNonCollidingPosition = (
  newWidget: { x: number; y: number; w: number; h: number },
  existingWidgets: { x: number; y: number; w: number; h: number }[],
  gridSize: number,
  containerBounds?: { x: number; y: number; w: number; h: number },
): Position => {
  let { x, y } = newWidget
  const maxAttempts = 1000
  let attempts = 0

  // Spiral search pattern for better distribution
  const spiralDirections = [
    { dx: 1, dy: 0 },   // Right
    { dx: 0, dy: 1 },   // Down
    { dx: -1, dy: 0 },  // Left
    { dx: 0, dy: -1 },  // Up
  ]
  
  let spiralStep = 1
  let spiralDirection = 0
  let stepsInDirection = 0

  while (attempts < maxAttempts) {
    const testRect = { x, y, w: newWidget.w, h: newWidget.h }
    let hasCollision = false

    // Check collision with existing widgets
    for (const widget of existingWidgets) {
      if (checkCollision(testRect, widget)) {
        hasCollision = true
        break
      }
    }

    if (!hasCollision) {
      // Ensure within container bounds if specified
      if (containerBounds) {
        if (
          x >= containerBounds.x &&
          y >= containerBounds.y &&
          x + newWidget.w <= containerBounds.x + containerBounds.w &&
          y + newWidget.h <= containerBounds.y + containerBounds.h
        ) {
          return { x, y }
        }
      } else {
        return { x, y }
      }
    }

    // Move in spiral pattern
    const direction = spiralDirections[spiralDirection]
    x += direction.dx * gridSize
    y += direction.dy * gridSize
    stepsInDirection++

    // Change direction after completing steps in current direction
    if (stepsInDirection >= spiralStep) {
      spiralDirection = (spiralDirection + 1) % 4
      stepsInDirection = 0
      
      // Increase spiral step every two direction changes
      if (spiralDirection % 2 === 0) {
        spiralStep++
      }
    }

    attempts++
  }

  // Fallback to original position if no valid position found
  return { x: newWidget.x, y: newWidget.y }
}

/**
 * Apply push physics with chain reaction support
 * @param draggedWidget - Widget being dragged
 * @param widgets - All widgets in the container
 * @param gridSize - Grid size for snapping
 * @param containerBounds - Optional container bounds
 * @returns Updated widgets with push physics applied
 */
export const applyPushPhysics = (
  draggedWidget: { id: string; x: number; y: number; w: number; h: number },
  widgets: Array<{ id: string; x: number; y: number; w: number; h: number }>,
  gridSize: number,
  containerBounds?: { x: number; y: number; w: number; h: number },
): Array<{ id: string; x: number; y: number; w: number; h: number; pushed?: boolean }> => {
  const result = widgets.map((w) => ({ ...w, pushed: false }))
  const pushedWidgets = new Set<string>()
  const maxPushDepth = 5 // Prevent infinite chains

  // Recursive function to handle chain reactions
  const pushWidget = (
    pusher: { id: string; x: number; y: number; w: number; h: number },
    depth: number = 0
  ): void => {
    if (depth >= maxPushDepth) return

    for (let i = 0; i < result.length; i++) {
      const widget = result[i]
      
      // Skip if same widget, already pushed, or is the original dragged widget
      if (widget.id === pusher.id || pushedWidgets.has(widget.id) || widget.id === draggedWidget.id) {
        continue
      }

      if (checkCollision(pusher, widget)) {
        const pushDirection = calculatePushDirection(pusher, widget)
        
        // Calculate new position with push force
        const newX = widget.x + pushDirection.dx * GRID_CONSTANTS.PUSH_FORCE
        const newY = widget.y + pushDirection.dy * GRID_CONSTANTS.PUSH_FORCE

        // Snap to grid
        const snappedX = Math.round(newX / gridSize) * gridSize
        const snappedY = Math.round(newY / gridSize) * gridSize

        // Ensure within bounds
        let finalX = snappedX
        let finalY = snappedY

        if (containerBounds) {
          finalX = Math.max(containerBounds.x, Math.min(snappedX, containerBounds.x + containerBounds.w - widget.w))
          finalY = Math.max(containerBounds.y, Math.min(snappedY, containerBounds.y + containerBounds.h - widget.h))
        }

        // Update widget position
        result[i] = {
          ...widget,
          x: finalX,
          y: finalY,
          pushed: true,
        }

        pushedWidgets.add(widget.id)

        // Chain reaction: check if this pushed widget pushes others
        pushWidget(result[i], depth + 1)
      }
    }
  }

  // Start push physics from dragged widget
  pushWidget(draggedWidget)

  return result
}

// =============================================================================
// GRID CALCULATIONS
// =============================================================================

/**
 * Snap position to grid
 * @param position - Position to snap
 * @param gridSize - Grid size
 * @returns Snapped position
 */
export const snapToGrid = (position: Position, gridSize: number): Position => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  }
}

/**
 * Calculate auto-size for nest containers based on content
 * @param nestWidgets - Widgets inside the nest
 * @param minWidth - Minimum width
 * @param minHeight - Minimum height
 * @param padding - Padding around content
 * @returns Calculated size
 */
export const calculateNestAutoSize = (
  nestWidgets: NestedWidget[],
  minWidth = GRID_CONSTANTS.MIN_NEST_WIDTH,
  minHeight = GRID_CONSTANTS.MIN_NEST_HEIGHT,
  padding = 20,
): Size => {
  if (nestWidgets.length === 0) {
    return { w: minWidth, h: minHeight }
  }

  // Find bounds of all widgets
  const rightmost = Math.max(...nestWidgets.map((w) => w.x + w.w))
  const bottommost = Math.max(...nestWidgets.map((w) => w.y + w.h))

  return {
    w: Math.max(minWidth, rightmost + padding),
    h: Math.max(minHeight, bottommost + padding),
  }
}

/**
 * Check if position is within bounds
 * @param position - Position to check
 * @param bounds - Bounds to check against
 * @returns True if position is within bounds
 */
export const isWithinBounds = (position: Position, bounds: Bounds): boolean => {
  return (
    position.x >= bounds.x &&
    position.y >= bounds.y &&
    position.x <= bounds.x + bounds.w &&
    position.y <= bounds.y + bounds.h
  )
}

/**
 * Calculate bounds for a set of widgets
 * @param widgets - Widgets to calculate bounds for
 * @returns Bounding rectangle
 */
export const calculateWidgetBounds = (widgets: Widget[]): Bounds => {
  if (widgets.length === 0) {
    return { x: 0, y: 0, w: 0, h: 0 }
  }

  const left = Math.min(...widgets.map((w) => w.x))
  const top = Math.min(...widgets.map((w) => w.y))
  const right = Math.max(...widgets.map((w) => w.x + w.w))
  const bottom = Math.max(...widgets.map((w) => w.y + w.h))

  return {
    x: left,
    y: top,
    w: right - left,
    h: bottom - top,
  }
}

// =============================================================================
// COORDINATE TRANSFORMATIONS
// =============================================================================

/**
 * Convert screen coordinates to world coordinates
 * @param screenPos - Screen position
 * @param viewport - Viewport state
 * @returns World position
 */
export const screenToWorld = (
  screenPos: Position,
  viewport: { x: number; y: number; zoom: number }
): Position => {
  return {
    x: (screenPos.x - viewport.x) / viewport.zoom,
    y: (screenPos.y - viewport.y) / viewport.zoom,
  }
}

/**
 * Convert world coordinates to screen coordinates
 * @param worldPos - World position
 * @param viewport - Viewport state
 * @returns Screen position
 */
export const worldToScreen = (
  worldPos: Position,
  viewport: { x: number; y: number; zoom: number }
): Position => {
  return {
    x: worldPos.x * viewport.zoom + viewport.x,
    y: worldPos.y * viewport.zoom + viewport.y,
  }
}

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

/**
 * Throttle function to limit execution frequency
 * @param func - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        func(...args)
      }, delay - (now - lastCall))
    }
  }
}

/**
 * Debounce function to delay execution until after delay
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * RequestAnimationFrame-based throttle for smooth animations
 * @param func - Function to throttle
 * @returns RAF-throttled function
 */
export const rafThrottle = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => void) => {
  let rafId: number | null = null

  return (...args: Parameters<T>) => {
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    rafId = requestAnimationFrame(() => func(...args))
  }
}

// =============================================================================
// BOUNDS CHECKING UTILITIES
// =============================================================================

/**
 * Clamp value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

/**
 * Ensure widget stays within container bounds
 * @param widget - Widget to constrain
 * @param containerBounds - Container bounds
 * @returns Constrained widget position
 */
export const constrainToContainer = (
  widget: { x: number; y: number; w: number; h: number },
  containerBounds: Bounds
): Position => {
  return {
    x: clamp(widget.x, containerBounds.x, containerBounds.x + containerBounds.w - widget.w),
    y: clamp(widget.y, containerBounds.y, containerBounds.y + containerBounds.h - widget.h),
  }
}

/**
 * Calculate distance between two points
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance between points
 */
export const distance = (p1: Position, p2: Position): number => {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Check if two rectangles are adjacent (touching but not overlapping)
 * @param rect1 - First rectangle
 * @param rect2 - Second rectangle
 * @returns True if rectangles are adjacent
 */
export const areAdjacent = (
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number }
): boolean => {
  // Check if they're touching horizontally
  const touchingHorizontally = 
    (rect1.x + rect1.w === rect2.x || rect2.x + rect2.w === rect1.x) &&
    !(rect1.y + rect1.h <= rect2.y || rect2.y + rect2.h <= rect1.y)

  // Check if they're touching vertically
  const touchingVertically = 
    (rect1.y + rect1.h === rect2.y || rect2.y + rect2.h === rect1.y) &&
    !(rect1.x + rect1.w <= rect2.x || rect2.x + rect2.w <= rect1.x)

  return touchingHorizontally || touchingVertically
} 