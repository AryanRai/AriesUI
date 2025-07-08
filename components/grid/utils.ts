import { MainGridWidget, NestedWidget, NestContainer } from "./types"

// Utility function to generate unique IDs
export const generateUniqueId = (prefix: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}-${timestamp}-${random}`
}

// Enhanced collision detection utilities with push physics
export const checkCollision = (
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number },
): boolean => {
  return !(
    rect1.x + rect1.w <= rect2.x ||
    rect2.x + rect2.w <= rect1.x ||
    rect1.y + rect1.h <= rect2.y ||
    rect2.y + rect2.h <= rect1.y
  )
}

export const getCollisionOverlap = (
  rect1: { x: number; y: number; w: number; h: number },
  rect2: { x: number; y: number; w: number; h: number },
): { overlapX: number; overlapY: number; direction: "horizontal" | "vertical" } => {
  const overlapX = Math.min(rect1.x + rect1.w, rect2.x + rect2.w) - Math.max(rect1.x, rect2.x)
  const overlapY = Math.min(rect1.y + rect1.h, rect2.y + rect2.h) - Math.max(rect1.y, rect2.y)

  // Determine primary push direction based on smaller overlap
  const direction = overlapX < overlapY ? "horizontal" : "vertical"

  return { overlapX, overlapY, direction }
}

export const calculatePushDirection = (
  draggedWidget: { x: number; y: number; w: number; h: number },
  targetWidget: { x: number; y: number; w: number; h: number },
): { dx: number; dy: number } => {
  const draggedCenterX = draggedWidget.x + draggedWidget.w / 2
  const draggedCenterY = draggedWidget.y + draggedWidget.h / 2
  const targetCenterX = targetWidget.x + targetWidget.w / 2
  const targetCenterY = targetWidget.y + targetWidget.h / 2

  const deltaX = targetCenterX - draggedCenterX
  const deltaY = targetCenterY - draggedCenterY

  const overlap = getCollisionOverlap(draggedWidget, targetWidget)

  if (overlap.direction === "horizontal") {
    // Push horizontally
    const pushDistance = overlap.overlapX + 10 // Add small buffer
    return {
      dx: deltaX > 0 ? pushDistance : -pushDistance,
      dy: 0,
    }
  } else {
    // Push vertically
    const pushDistance = overlap.overlapY + 10 // Add small buffer
    return {
      dx: 0,
      dy: deltaY > 0 ? pushDistance : -pushDistance,
    }
  }
}

export const findNonCollidingPosition = (
  newWidget: { x: number; y: number; w: number; h: number },
  existingWidgets: { x: number; y: number; w: number; h: number }[],
  gridSize: number,
  containerBounds?: { x: number; y: number; w: number; h: number },
): { x: number; y: number } => {
  let { x, y } = newWidget
  const maxAttempts = 1000
  let attempts = 0

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

    // Try next position
    x += gridSize
    if (containerBounds && x + newWidget.w > containerBounds.x + containerBounds.w) {
      x = containerBounds?.x || 0
      y += gridSize
    } else if (!containerBounds && x > 2000) {
      x = 0
      y += gridSize
    }

    attempts++
  }

  // Fallback to original position if no valid position found
  return { x: newWidget.x, y: newWidget.y }
}

export const applyPushPhysics = (
  draggedWidget: { id: string; x: number; y: number; w: number; h: number },
  widgets: Array<{ id: string; x: number; y: number; w: number; h: number }>,
  gridSize: number,
  containerBounds?: { x: number; y: number; w: number; h: number },
): Array<{ id: string; x: number; y: number; w: number; h: number; pushed?: boolean }> => {
  const result = widgets.map((w) => ({ ...w, pushed: false }))
  const pushedWidgets = new Set<string>()

  // Find widgets that collide with the dragged widget
  const collidingWidgets = result.filter(
    (widget) => widget.id !== draggedWidget.id && checkCollision(draggedWidget, widget),
  )

  // Apply push physics to colliding widgets
  for (const collidingWidget of collidingWidgets) {
    if (pushedWidgets.has(collidingWidget.id)) continue

    const pushDirection = calculatePushDirection(draggedWidget, collidingWidget)
    let newX = collidingWidget.x + pushDirection.dx
    let newY = collidingWidget.y + pushDirection.dy

    // Snap to grid
    newX = Math.round(newX / gridSize) * gridSize
    newY = Math.round(newY / gridSize) * gridSize

    // Ensure within bounds
    if (containerBounds) {
      newX = Math.max(containerBounds.x, Math.min(newX, containerBounds.x + containerBounds.w - collidingWidget.w))
      newY = Math.max(containerBounds.y, Math.min(newY, containerBounds.y + containerBounds.h - collidingWidget.h))
    } else {
      newX = Math.max(0, newX)
      newY = Math.max(0, newY)
    }

    // Update the widget position
    const widgetIndex = result.findIndex((w) => w.id === collidingWidget.id)
    if (widgetIndex !== -1) {
      result[widgetIndex] = {
        ...result[widgetIndex],
        x: newX,
        y: newY,
        pushed: true,
      }
      pushedWidgets.add(collidingWidget.id)
    }

    // Check for chain reactions - if the pushed widget now collides with others
    const pushedWidgetRect = { ...result[widgetIndex] }
    const secondaryCollisions = result.filter(
      (widget) =>
        widget.id !== pushedWidgetRect.id &&
        widget.id !== draggedWidget.id &&
        !pushedWidgets.has(widget.id) &&
        checkCollision(pushedWidgetRect, widget),
    )

    // Apply secondary pushes (chain reaction)
    for (const secondaryWidget of secondaryCollisions) {
      const secondaryPush = calculatePushDirection(pushedWidgetRect, secondaryWidget)
      let secondaryX = secondaryWidget.x + secondaryPush.dx
      let secondaryY = secondaryWidget.y + secondaryPush.dy

      // Snap to grid
      secondaryX = Math.round(secondaryX / gridSize) * gridSize
      secondaryY = Math.round(secondaryY / gridSize) * gridSize

      // Ensure within bounds
      if (containerBounds) {
        secondaryX = Math.max(
          containerBounds.x,
          Math.min(secondaryX, containerBounds.x + containerBounds.w - secondaryWidget.w),
        )
        secondaryY = Math.max(
          containerBounds.y,
          Math.min(secondaryY, containerBounds.y + containerBounds.h - secondaryWidget.h),
        )
      } else {
        secondaryX = Math.max(0, secondaryX)
        secondaryY = Math.max(0, secondaryY)
      }

      const secondaryIndex = result.findIndex((w) => w.id === secondaryWidget.id)
      if (secondaryIndex !== -1) {
        result[secondaryIndex] = {
          ...result[secondaryIndex],
          x: secondaryX,
          y: secondaryY,
          pushed: true,
        }
        pushedWidgets.add(secondaryWidget.id)
      }
    }
  }

  return result
}

export const calculateNestAutoSize = (
  nestWidgets: NestedWidget[],
  minWidth = 400,
  minHeight = 300,
  padding = 20,
): { w: number; h: number } => {
  if (nestWidgets.length === 0) {
    return { w: minWidth, h: minHeight }
  }

  let maxX = 0
  let maxY = 0

  nestWidgets.forEach((widget) => {
    const rightEdge = widget.x + widget.w
    const bottomEdge = widget.y + widget.h
    if (rightEdge > maxX) maxX = rightEdge
    if (bottomEdge > maxY) maxY = bottomEdge
  })

  const calculatedWidth = Math.max(minWidth, maxX + padding)
  const calculatedHeight = Math.max(minHeight, maxY + padding + 40) // +40 for header

  return { w: calculatedWidth, h: calculatedHeight }
}

export const getDefaultContent = (type: string): string => {
  switch (type) {
    case "sensor":
      return "23.5°C"
    case "chart":
    case "line-chart":
      return "Chart Data"
    case "pie-chart":
      return "Pie Chart"
    case "trend-chart":
      return "Trend Data"
    case "status":
      return "Online"
    case "gauge":
      return "75%"
    case "monitor":
      return "CPU: 45%"
    case "power":
      return "120W"
    case "network-status":
      return "Connected"
    case "bandwidth":
      return "1.2 Mbps"
    case "data-table":
      return "Data Table"
    default:
      return "No Data"
  }
}