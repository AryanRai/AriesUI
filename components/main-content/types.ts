/**
 * Type definitions for MainContent module
 */

import type { GridState as GridStateType } from "@/components/grid/types"

// Re-export GridStateType for use in other modules
export type { GridStateType }

export interface MainContentProps {
  gridState: GridStateType
  setGridState: React.Dispatch<React.SetStateAction<GridStateType>>
}

export interface ViewportState {
  x: number
  y: number
  zoom: number
}

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

export interface ResizeState {
  isResizing: boolean
  resizedId: string | null
  resizedType: "widget" | "nest" | null
  handle: ResizeHandle | null
  startPos: { x: number; y: number }
  startSize: { w: number; h: number }
  startPosition: { x: number; y: number }
  lastUpdateTime: number
  animationFrameId?: number
}

export interface DropState {
  isDragOver: boolean
  targetNestId: string | null
}

export interface ToolbarPosition {
  top: number
  right?: number
  left?: number
}

export interface PerformanceMetrics {
  frameCount: number
  lastFrameTime: number
  avgFrameTime: number
  dragOperations: number
  resizeOperations: number
}

// Basic widget/nest interface for virtual grid calculations
export interface GridItem {
  id: string
  x: number
  y: number
  w: number
  h: number
  nestId?: string // For nested widgets
  parentNestId?: string // For nested nests
}

export interface VirtualGrid {
  visibleMainWidgets: GridItem[]
  visibleMainAriesWidgets: GridItem[]
  visibleNestContainers: GridItem[]
  visibleNestedWidgets: GridItem[]
  visibleNestedAriesWidgets: GridItem[]
  totalWidgets: number
  renderedWidgets: number
  culledWidgets: number
  isVirtualizationActive: boolean
  cullingPercentage: number
}

export interface AutoSaveConfig {
  isEnabled: boolean
  interval: number
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSave: string | null
}

export interface StateHistory {
  gridState: GridStateType
  viewport: ViewportState
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export type HardwareConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface ContainerSize {
  width: number
  height: number
}

export interface MainContentState {
  viewport: ViewportState
  dragState: DragState
  resizeState: ResizeState
  dropState: DropState
  isPanning: boolean
  panStart: { x: number; y: number }
  lastPanPoint: { x: number; y: number }
  dragOverNest: string | null
  pushedWidgets: Set<string>
  isHoveringOverNest: boolean
  hasUnsavedChanges: boolean
  containerSize: ContainerSize
  hardwareConnectionStatus: HardwareConnectionStatus
} 