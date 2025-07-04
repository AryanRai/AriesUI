# Zoom Coordinate System Fix

## Issue Description
When zooming out, widgets and nests exhibited buggy/weird placement behavior. The coordinates would become inconsistent, causing widgets to jump to incorrect positions when dragging or resizing.

## Root Cause
The coordinate transformation between screen coordinates and world coordinates was inconsistent:

1. **Mouse Down Handler**: Calculated drag offsets using screen coordinates without accounting for zoom
2. **Mouse Move Handler**: Applied zoom transformation to offsets, causing a mismatch
3. **Resize Handler**: Used screen coordinates for start position but world coordinates for delta calculations

This inconsistency became more apparent at lower zoom levels (zoomed out), where the coordinate transformation discrepancy was magnified.

## Solution
Implemented consistent world coordinate transformation throughout the drag/resize system:

### 1. Mouse Down Handler (handleMouseDown)
```tsx
// Before: Screen coordinates
offset: {
  x: e.clientX - rect.left,
  y: e.clientY - rect.top,
}

// After: World coordinates with proper item offset
const worldMouseX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
const worldMouseY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y
offset: {
  x: worldMouseX - item.x,
  y: worldMouseY - item.y,
}
```

### 2. Mouse Move Handler (handleMouseMove)
```tsx
// Before: Applied zoom transformation to screen offset
const rawX = worldX - dragState.offset.x / viewport.zoom
const rawY = worldY - dragState.offset.y / viewport.zoom

// After: Direct world coordinate calculation
const rawX = worldX - dragState.offset.x
const rawY = worldY - dragState.offset.y
```

### 3. Resize Handler (handleResizeMouseDown)
```tsx
// Before: Screen coordinates
startPos: { x: e.clientX, y: e.clientY }

// After: World coordinates
const worldMouseX = (e.clientX - containerRect.left) / viewport.zoom - viewport.x
const worldMouseY = (e.clientY - containerRect.top) / viewport.zoom - viewport.y
startPos: { x: worldMouseX, y: worldMouseY }
```

### 4. Resize Delta Calculation
```tsx
// Before: Screen delta with zoom division
const deltaX = (e.clientX - resizeState.startPos.x) / viewport.zoom
const deltaY = (e.clientY - resizeState.startPos.y) / viewport.zoom

// After: World coordinate delta
const deltaX = worldX - resizeState.startPos.x
const deltaY = worldY - resizeState.startPos.y
```

## Benefits
1. **Consistent Positioning**: Widgets and nests now maintain accurate positioning at all zoom levels
2. **Smooth Interactions**: Drag and resize operations feel natural regardless of zoom
3. **Predictable Behavior**: No more jumping or weird placement when zooming out
4. **Hardware Acceleration**: Maintained performance optimizations with consistent coordinate system

## Testing
- Verified smooth dragging at various zoom levels (0.1x to 3x)
- Confirmed resize operations work correctly when zoomed out
- Tested nest container interactions at different zoom levels
- Validated coordinate consistency across widget types

## Technical Details
- All coordinate transformations now use the same world coordinate system
- The transformation formula: `(screenX - containerLeft) / zoom - viewportX`
- This ensures pixel-perfect positioning regardless of zoom level
- Maintains backward compatibility with existing smooth drag features
