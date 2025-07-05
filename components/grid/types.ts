/**
 * TypeScript interfaces and types for the AriesUI Grid System
 * 
 * This file contains all the core type definitions used throughout the grid system,
 * including widgets, containers, state management, and interaction types.
 */

import type { AriesWidget, NestedAriesWidget } from "@/types/ariesmods"

// =============================================================================
// CORE WIDGET INTERFACES
// =============================================================================

/**
 * Base interface for all widgets in the grid system
 */
export interface BaseWidget {
  /** Unique identifier for the widget */
  id: string
  /** Type/category of the widget */
  type: string
  /** Display title of the widget */
  title: string
  /** Content/data of the widget */
  content: string
  /** X position in grid coordinates */
  x: number
  /** Y position in grid coordinates */
  y: number
  /** Width in grid units */
  w: number
  /** Height in grid units */
  h: number
  /** Timestamp when widget was created */
  createdAt: string
  /** Timestamp when widget was last updated */
  updatedAt: string
}

/**
 * Widget that exists in the main grid container
 */
export interface MainGridWidget extends BaseWidget {
  container: "main"
}

/**
 * Widget that exists inside a nest container
 */
export interface NestedWidget extends BaseWidget {
  container: "nest"
  /** ID of the nest container this widget belongs to */
  nestId: string
}

/**
 * Container that can hold nested widgets
 */
export interface NestContainer {
  /** Unique identifier for the nest */
  id: string
  /** Type of nest container */
  type: string
  /** Display title of the nest */
  title: string
  /** X position in grid coordinates */
  x: number
  /** Y position in grid coordinates */
  y: number
  /** Width in grid units */
  w: number
  /** Height in grid units */
  h: number
  /** Timestamp when nest was created */
  createdAt: string
  /** Timestamp when nest was last updated */
  updatedAt: string
}

// =============================================================================
// GRID STATE MANAGEMENT
// =============================================================================

/**
 * Complete state of the grid system
 */
export interface GridState {
  /** Standard widgets in the main grid */
  mainWidgets: MainGridWidget[]
  /** Nest containers in the main grid */
  nestContainers: NestContainer[]
  /** Widgets inside nest containers */
  nestedWidgets: NestedWidget[]
  /** AriesWidgets in the main grid */
  mainAriesWidgets: AriesWidget[]
  /** AriesWidgets inside nest containers */
  nestedAriesWidgets: NestedAriesWidget[]
  /** Viewport state (pan and zoom) */
  viewport: {
    /** X offset of the viewport */
    x: number
    /** Y offset of the viewport */
    y: number
    /** Zoom level (1.0 = 100%) */
    zoom: number
  }
  /** Size of grid units in pixels */
  gridSize: number
  /** Timestamp of last save operation */
  lastSaved: string | null
  /** Version of the grid state format */
  version: string
}

/**
 * Props for the main content component
 */
export interface MainContentProps {
  /** Current grid state */
  gridState: GridState
  /** Function to update grid state */
  setGridState: React.Dispatch<React.SetStateAction<GridState>>
}

// =============================================================================
// INTERACTION STATES
// =============================================================================

/**
 * State for drag operations
 */
export interface DragState {
  /** Whether a drag operation is active */
  isDragging: boolean
  /** ID of the item being dragged */
  draggedId: string | null
  /** Type of item being dragged */
  draggedType: "widget" | "nest" | null
  /** Starting position of the drag */
  startPos: { x: number; y: number }
  /** Current offset from start position */
  offset: { x: number; y: number }
  /** Original position before drag started */
  originalPos: { x: number; y: number }
}

/**
 * State for resize operations
 */
export interface ResizeState {
  /** Whether a resize operation is active */
  isResizing: boolean
  /** ID of the item being resized */
  resizedId: string | null
  /** Type of item being resized */
  resizedType: "widget" | "nest" | null
  /** Which resize handle is being used */
  handle: ResizeHandle | null
  /** Starting position of the resize */
  startPos: { x: number; y: number }
  /** Original dimensions before resize */
  originalSize: { w: number; h: number }
  /** Original position before resize */
  originalPos: { x: number; y: number }
}

/**
 * State for drag and drop operations
 */
export interface DropState {
  /** Whether a drop operation is active */
  isDragOver: boolean
  /** ID of the nest being dragged over */
  dragOverNestId: string | null
}

/**
 * State for viewport operations (pan and zoom)
 */
export interface ViewportState {
  /** Whether panning is active */
  isPanning: boolean
  /** Starting position of pan operation */
  startPos: { x: number; y: number }
  /** Original viewport position */
  originalViewport: { x: number; y: number }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Union type for all widget types
 */
export type Widget = MainGridWidget | NestedWidget

/**
 * Available resize handles
 */
export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

/**
 * Position coordinates
 */
export interface Position {
  x: number
  y: number
}

/**
 * Size dimensions
 */
export interface Size {
  w: number
  h: number
}

/**
 * Rectangular bounds
 */
export interface Bounds extends Position, Size {}

/**
 * Collision detection result
 */
export interface CollisionResult {
  /** Whether collision occurred */
  hasCollision: boolean
  /** Overlap in X direction */
  overlapX: number
  /** Overlap in Y direction */
  overlapY: number
  /** Primary direction of collision */
  direction: "horizontal" | "vertical"
}

/**
 * Push physics result
 */
export interface PushResult {
  /** Displacement in X direction */
  dx: number
  /** Displacement in Y direction */
  dy: number
}

// =============================================================================
// TOOLBAR AND UI TYPES
// =============================================================================

/**
 * Floating toolbar state
 */
export interface ToolbarState {
  /** Whether toolbar is visible */
  isVisible: boolean
  /** Position of the toolbar */
  position: Position
  /** Whether toolbar is being dragged */
  isDragging: boolean
}

/**
 * Zoom toolbar state
 */
export interface ZoomToolbarState {
  /** Whether zoom toolbar is visible */
  isVisible: boolean
  /** Position of the zoom toolbar */
  position: Position
  /** Whether zoom toolbar is being dragged */
  isDragging: boolean
}

/**
 * Modal state
 */
export interface ModalState {
  /** Currently active modal */
  activeModal: string | null
  /** Modal-specific data */
  modalData: any
}

// =============================================================================
// AUTO-SAVE AND PERSISTENCE
// =============================================================================

/**
 * Auto-save configuration
 */
export interface AutoSaveConfig {
  /** Whether auto-save is enabled */
  enabled: boolean
  /** Interval between saves in milliseconds */
  interval: number
  /** Whether to show save notifications */
  showNotifications: boolean
  /** Maximum number of retries for failed saves */
  maxRetries: number
}

/**
 * Save operation result
 */
export interface SaveResult {
  /** Whether save was successful */
  success: boolean
  /** Error message if save failed */
  error?: string
  /** Timestamp of save operation */
  timestamp: string
}

// =============================================================================
// HISTORY AND UNDO/REDO
// =============================================================================

/**
 * History entry for undo/redo functionality
 */
export interface HistoryEntry {
  /** Unique identifier for the history entry */
  id: string
  /** Timestamp when entry was created */
  timestamp: string
  /** Description of the action */
  description: string
  /** Grid state before the action */
  beforeState: GridState
  /** Grid state after the action */
  afterState: GridState
}

/**
 * History management state
 */
export interface HistoryState {
  /** Array of history entries */
  entries: HistoryEntry[]
  /** Current position in history */
  currentIndex: number
  /** Maximum number of history entries to keep */
  maxEntries: number
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Frames per second during interactions */
  fps: number
  /** Memory usage in MB */
  memoryUsage: number
  /** Number of re-renders per second */
  rerenders: number
  /** GPU usage percentage */
  gpuUsage: number
  /** Event handling latency in ms */
  eventLatency: number
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Whether performance monitoring is enabled */
  enabled: boolean
  /** Sampling interval in milliseconds */
  samplingInterval: number
  /** Whether to log performance data */
  logData: boolean
  /** Performance thresholds for warnings */
  thresholds: {
    fps: number
    memoryUsage: number
    eventLatency: number
  }
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for GridWidget component
 */
export interface GridWidgetProps {
  /** The widget to render */
  widget: Widget
  /** Whether the widget is being dragged */
  isDragging: boolean
  /** Whether the widget is being resized */
  isResizing: boolean
  /** Whether the widget has been pushed by physics */
  isPushed: boolean
  /** Callback for drag start */
  onDragStart: (e: React.MouseEvent, id: string) => void
  /** Callback for resize start */
  onResizeStart: (e: React.MouseEvent, id: string, handle: ResizeHandle) => void
  /** Callback for widget removal */
  onRemove: (id: string) => void
  /** Callback for widget update */
  onUpdate: (id: string, updates: Partial<Widget>) => void
}

/**
 * Props for ResizeHandles component
 */
export interface ResizeHandlesProps {
  /** ID of the item being resized */
  itemId: string
  /** Type of item being resized */
  itemType: "widget" | "nest"
  /** Whether resize handles should be visible */
  isVisible: boolean
  /** Callback for resize start */
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void
}

/**
 * Props for NestContainer component
 */
export interface NestContainerProps {
  /** The nest container to render */
  nest: NestContainer
  /** Widgets inside this nest */
  widgets: NestedWidget[]
  /** AriesWidgets inside this nest */
  ariesWidgets: NestedAriesWidget[]
  /** Whether the nest is being dragged */
  isDragging: boolean
  /** Whether the nest is being resized */
  isResizing: boolean
  /** Whether drag over is active */
  isDragOver: boolean
  /** Callback for drag start */
  onDragStart: (e: React.MouseEvent, id: string) => void
  /** Callback for resize start */
  onResizeStart: (e: React.MouseEvent, id: string, handle: ResizeHandle) => void
  /** Callback for drag over */
  onDragOver: (e: React.DragEvent) => void
  /** Callback for drag leave */
  onDragLeave: (e: React.DragEvent) => void
  /** Callback for drop */
  onDrop: (e: React.DragEvent) => void
  /** Callback for nest removal */
  onRemove: (id: string) => void
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

/**
 * Return type for useGridState hook
 */
export interface UseGridStateReturn {
  /** Current grid state */
  gridState: GridState
  /** Function to update grid state */
  setGridState: React.Dispatch<React.SetStateAction<GridState>>
  /** Function to add a widget */
  addWidget: (type: string, position?: Position) => void
  /** Function to remove a widget */
  removeWidget: (id: string) => void
  /** Function to update a widget */
  updateWidget: (id: string, updates: Partial<Widget>) => void
  /** Function to add a nest container */
  addNestContainer: (position?: Position) => void
  /** Function to remove a nest container */
  removeNestContainer: (id: string) => void
  /** Function to save grid state */
  saveGridState: () => Promise<SaveResult>
  /** Function to load grid state */
  loadGridState: () => Promise<GridState>
  /** Function to export grid state */
  exportGridState: () => string
  /** Function to import grid state */
  importGridState: (data: string) => boolean
  /** Undo function */
  undo: () => void
  /** Redo function */
  redo: () => void
  /** Whether undo is available */
  canUndo: boolean
  /** Whether redo is available */
  canRedo: boolean
  /** Auto-save configuration */
  autoSaveConfig: AutoSaveConfig
  /** Function to update auto-save config */
  setAutoSaveConfig: (config: Partial<AutoSaveConfig>) => void
}

/**
 * Return type for useGridEvents hook
 */
export interface UseGridEventsReturn {
  /** Drag state */
  dragState: DragState
  /** Resize state */
  resizeState: ResizeState
  /** Drop state */
  dropState: DropState
  /** Viewport state */
  viewportState: ViewportState
  /** Set of widgets that have been pushed */
  pushedWidgets: Set<string>
  /** Function to handle mouse down for dragging */
  handleMouseDown: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest") => void
  /** Function to handle resize mouse down */
  handleResizeMouseDown: (e: React.MouseEvent, itemId: string, itemType: "widget" | "nest", handle: ResizeHandle) => void
  /** Function to handle pan start */
  handlePanStart: (e: React.MouseEvent) => void
  /** Function to handle drag over */
  handleDragOver: (e: React.DragEvent, targetNestId?: string) => void
  /** Function to handle drag leave */
  handleDragLeave: (e: React.DragEvent) => void
  /** Function to handle drop */
  handleDrop: (e: React.DragEvent, targetNestId?: string) => void
}

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Grid system constants
 */
export const GRID_CONSTANTS = {
  /** Default grid size in pixels */
  DEFAULT_GRID_SIZE: 20,
  /** Default widget width */
  DEFAULT_WIDGET_WIDTH: 200,
  /** Default widget height */
  DEFAULT_WIDGET_HEIGHT: 150,
  /** Default nest width */
  DEFAULT_NEST_WIDTH: 400,
  /** Default nest height */
  DEFAULT_NEST_HEIGHT: 300,
  /** Minimum widget width */
  MIN_WIDGET_WIDTH: 100,
  /** Minimum widget height */
  MIN_WIDGET_HEIGHT: 80,
  /** Minimum nest width */
  MIN_NEST_WIDTH: 200,
  /** Minimum nest height */
  MIN_NEST_HEIGHT: 150,
  /** Maximum widget width */
  MAX_WIDGET_WIDTH: 1000,
  /** Maximum widget height */
  MAX_WIDGET_HEIGHT: 800,
  /** Snap threshold for grid alignment */
  SNAP_THRESHOLD: 10,
  /** Push physics force multiplier */
  PUSH_FORCE: 1.2,
  /** Maximum push distance */
  MAX_PUSH_DISTANCE: 100,
  /** Collision buffer distance */
  COLLISION_BUFFER: 5,
  /** Animation duration in milliseconds */
  ANIMATION_DURATION: 200,
  /** Throttle delay for events in milliseconds */
  THROTTLE_DELAY: 16, // ~60fps
  /** Debounce delay for auto-save in milliseconds */
  DEBOUNCE_DELAY: 1000,
  /** Maximum history entries */
  MAX_HISTORY_ENTRIES: 50,
  /** Zoom limits */
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 3.0,
  /** Zoom step */
  ZOOM_STEP: 0.1,
} as const

/**
 * Resize handle configuration
 */
export const RESIZE_HANDLE_CONFIG = {
  /** Size of resize handles in pixels */
  HANDLE_SIZE: 8,
  /** Offset from edge in pixels */
  HANDLE_OFFSET: 2,
  /** Minimum distance for resize activation */
  MIN_RESIZE_DISTANCE: 20,
  /** Handles for different item types */
  HANDLES: {
    widget: ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as ResizeHandle[],
    nest: ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as ResizeHandle[],
  },
} as const

/**
 * Performance optimization constants
 */
export const PERFORMANCE_CONSTANTS = {
  /** Virtualization threshold */
  VIRTUALIZATION_THRESHOLD: 50,
  /** Render batch size */
  RENDER_BATCH_SIZE: 20,
  /** Event throttle intervals */
  EVENT_THROTTLE: {
    DRAG: 4, // 240fps capability
    RESIZE: 8, // 120fps capability
    SCROLL: 16, // 60fps
    ZOOM: 16, // 60fps
  },
  /** Memory cleanup interval */
  CLEANUP_INTERVAL: 30000, // 30 seconds
} as const 