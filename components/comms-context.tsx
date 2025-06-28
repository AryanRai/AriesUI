"use client"

import type React from "react"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import { useLocalStorage } from '@/hooks/use-local-storage'

interface Stream {
  id: string
  name: string
  status: "connected" | "disconnected"
  data?: any
}

interface Widget {
  id: string
  type: string
  streamId?: string
  config: any
  position: { x: number; y: number; w: number; h: number }
}

interface CommsState {
  streams: Stream[]
  widgets: Widget[]
  activeModal: string | null
  theme: "light" | "dark"
  gridLayouts: any[]
  installedMods: string[]
  logs: string[]
  terminalHistory: string[]
  profiles: Record<string, any>
  activeProfile: string
}

type CommsAction =
  | { type: "SET_MODAL"; payload: string | null }
  | { type: "ADD_WIDGET"; payload: Widget }
  | { type: "REMOVE_WIDGET"; payload: string }
  | { type: "UPDATE_WIDGET"; payload: { id: string; updates: Partial<Widget> } }
  | { type: "ADD_STREAM"; payload: Stream }
  | { type: "UPDATE_STREAM"; payload: { id: string; updates: Partial<Stream> } }
  | { type: "ADD_LOG"; payload: string }
  | { type: "CLEAR_LOGS" }
  | { type: "ADD_TERMINAL_COMMAND"; payload: string }
  | { type: "TOGGLE_THEME" }
  | { type: "CLEAR_WIDGETS" }

const initialState: CommsState = {
  streams: [
    { id: "stream1", name: "Sensor Array Alpha", status: "connected" },
    { id: "stream2", name: "Communication Link Beta", status: "disconnected" },
    { id: "stream3", name: "Hardware Monitor Gamma", status: "connected" },
  ],
  widgets: [],
  activeModal: null,
  theme: "dark",
  gridLayouts: [],
  installedMods: [],
  logs: [
    "[2024-01-15 10:30:15] System initialized",
    "[2024-01-15 10:30:16] Connecting to data streams...",
    "[2024-01-15 10:30:17] Stream 'Sensor Array Alpha' connected",
    "[2024-01-15 10:30:18] Stream 'Communication Link Beta' failed to connect",
    "[2024-01-15 10:30:19] Stream 'Hardware Monitor Gamma' connected",
  ],
  terminalHistory: [],
  profiles: {},
  activeProfile: "default",
}

function commsReducer(state: CommsState, action: CommsAction): CommsState {
  switch (action.type) {
    case "SET_MODAL":
      return { ...state, activeModal: action.payload }
    case "ADD_WIDGET":
      return { ...state, widgets: [...state.widgets, action.payload] }
    case "REMOVE_WIDGET":
      return { ...state, widgets: state.widgets.filter((w) => w.id !== action.payload) }
    case "UPDATE_WIDGET":
      return {
        ...state,
        widgets: state.widgets.map((w) => (w.id === action.payload.id ? { ...w, ...action.payload.updates } : w)),
      }
    case "ADD_STREAM":
      return { ...state, streams: [...state.streams, action.payload] }
    case "UPDATE_STREAM":
      return {
        ...state,
        streams: state.streams.map((s) => (s.id === action.payload.id ? { ...s, ...action.payload.updates } : s)),
      }
    case "ADD_LOG":
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19)
      return {
        ...state,
        logs: [...state.logs, `[${timestamp}] ${action.payload}`],
      }
    case "CLEAR_LOGS":
      return { ...state, logs: [] }
    case "ADD_TERMINAL_COMMAND":
      return {
        ...state,
        terminalHistory: [...state.terminalHistory, action.payload],
      }
    case "TOGGLE_THEME":
      return { ...state, theme: state.theme === "light" ? "dark" : "light" }
    case "CLEAR_WIDGETS":
      return { ...state, widgets: [] }
    default:
      return state
  }
}

const CommsContext = createContext<{
  state: CommsState
  dispatch: React.Dispatch<CommsAction>
  loadProfile: (name: string) => void
  updateProfiles: (profiles: Record<string, any>) => void
} | null>(null)

export function CommsProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useLocalStorage<Record<string, any>>("aries-grid-profiles", { default: {} })
  const [activeProfile, setActiveProfile] = useLocalStorage<string>("aries-grid-active-profile", "default")

  const [state, dispatch] = useReducer(commsReducer, { ...initialState, profiles, activeProfile })

  const value = {
    state: { ...state, profiles, activeProfile },
    dispatch,
    loadProfile: setActiveProfile,
    updateProfiles: setProfiles,
  }

  return <CommsContext.Provider value={value}>{children}</CommsContext.Provider>
}

export function useComms() {
  const context = useContext(CommsContext)
  if (!context) {
    throw new Error("useComms must be used within CommsProvider")
  }
  return context
}
