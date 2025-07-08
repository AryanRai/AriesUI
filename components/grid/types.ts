export interface BaseWidget {
  id: string
  type: string
  title: string
  content: string
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
}

export interface MainGridWidget extends BaseWidget {
  container: "main"
}

export interface NestedWidget extends BaseWidget {
  container: "nest"
  nestId: string
}

export interface NestContainer {
  id: string
  title: string
  x: number
  y: number
  w: number
  h: number
  createdAt: string
  updatedAt: string
}

export interface GridState {
  mainWidgets: MainGridWidget[]
  nestContainers: NestContainer[]
  nestedWidgets: NestedWidget[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  gridSize: number
  lastSaved: string | null
  version: string
}

export type Widget = MainGridWidget | NestedWidget
export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

export interface DragState {
  isDragging: boolean
  draggedId: string | null
  draggedType: "widget" | "nest" | null
  sourceContainer: "main" | "nest" | null
  sourceNestId?: string
  offset: { x: number; y: number }
}

export interface ResizeState {
  isResizing: boolean
  resizedId: string | null
  resizedType: "widget" | "nest" | null
  handle: ResizeHandle | null
  startPos: { x: number; y: number }
  startSize: { w: number; h: number }
  startPosition: { x: number; y: number }
}

export interface DropState {
  isDragOver: boolean
  targetNestId: string | null
}

export interface ViewportState {
  x: number
  y: number
  zoom: number
}

export interface GridOperations {
  addWidget: () => void
  addNestContainer: () => void
  removeWidget: (id: string) => void
  removeNestContainer: (id: string) => void
  updateGridState: (updater: (prev: GridState) => GridState) => void
  saveGridState: () => void
  loadGridState: () => void
  exportGridState: () => void
  importGridState: (event: React.ChangeEvent<HTMLInputElement>) => void
}