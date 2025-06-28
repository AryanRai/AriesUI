# AriesUI v3 - Implementation Guide for Comms Integration

## 🚀 Start Here: Enhancing Your Existing AriesUI Project

### What This Documentation Does
**Transforms your existing AriesUI** from mock data to real hardware integration by connecting it to your Comms v3 backend. Your existing Next.js project structure, widgets, modals, and grid system will be enhanced - not replaced.

### Your Current Setup (What We're Keeping)
✅ **Existing AriesUI Components** - Your grid system, widget palette, modals, theme system  
✅ **Existing UI Structure** - All your existing React components and styling  
✅ **Existing State Management** - Your comms-context.tsx (we'll enhance it)  
✅ **Existing Features** - Drag/drop, collision detection, responsive design

### What We're Adding
🔧 **Hardware Integration** - Connect to your StreamHandler and Engine  
📊 **Real-time Data** - Replace mock streams with actual sensor data  
🎛️ **Hardware Control** - Two-way communication with DynamicModules  
🔌 **Auto-reconnection** - Robust connection handling  

---

**AriesUI v3** is the enhancement of your existing AriesUI frontend for the **Comms v3** ecosystem. This guide shows you how to connect your current React/Next.js architecture to your existing Comms backend components (Engine, StreamHandler, HyperThreader).

## Migration from Previous AriesUI

### What We're Keeping from Previous Version
- **Core Dashboard Concept**: Widget-based grid layout system
- **Stream Integration**: WebSocket communication with StreamHandler
- **Backend Compatibility**: Full compatibility with existing Engine and DynamicModules
- **Real-time Updates**: Live data streaming and visualization
- **Hardware Control**: Two-way communication with hardware modules

### What We're Modernizing
- **Architecture**: HTML/CSS/JS → React/TypeScript/Next.js
- **State Management**: DOM manipulation → React Context + useReducer
- **UI Framework**: Custom CSS → Tailwind CSS + Radix UI
- **Grid System**: Custom implementation → Advanced physics-based system
- **Module System**: Basic JS → TypeScript AriesMods with marketplace
- **Performance**: Basic rendering → Optimized high-frequency data handling

## Comms v3 Backend Integration (Unchanged)

The following backend components remain compatible:
- **Engine + DynamicModules (Python)**: Your existing hardware modules work as-is
- **Stream Handler v2.3+ (Python + WebSocket)**: Existing message format supported
- **HyperThreader**: Process management integration
- **Message Format**: Full compatibility with existing JSON stream format

## 🏗️ Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
**Priority: Critical - Foundation for everything else**

#### 1.1 Project Setup & Basic Structure
```bash
# Initialize Next.js project with TypeScript
npx create-next-app@latest ariesui-v3 --typescript --tailwind --app
cd ariesui-v3
npm install @radix-ui/react-* lucide-react class-variance-authority clsx tailwind-merge
```

#### 1.2 Integrate Comms Backend (Modify Existing Files)
- **Enhance `components/comms-context.tsx`** - Add Comms stream integration to existing state
- **Create `lib/comms/stream-client.ts`** - WebSocket client for StreamHandler
- **Create `types/comms.ts`** - TypeScript definitions matching your backend
- **Enhance `hooks/use-comms.ts`** - Extend existing hook with stream integration
- **Update existing widgets** - Connect to Comms streams instead of mock data

#### 1.3 Leverage Existing Structure
- ✅ **`components/comms-app.tsx`** - Already exists, enhance with stream client
- ✅ **Grid system in `main-content.tsx`** - Already built, add stream binding
- ✅ **Widget system** - Already exists, connect to real hardware streams
- ✅ **Modal system** - Already built, add hardware management modals

### Phase 2: Stream Integration (Week 2-3)  
**Priority: Critical - Required for any hardware functionality**

#### 2.1 WebSocket Client Implementation
```typescript
// lib/comms/stream-client.ts - Your primary integration point
export class CommsStreamClient {
  private ws: WebSocket | null = null
  private messageQueue: CommsMessage[] = []
  private subscriptions: Map<string, Set<string>> = new Map()
  
  async connect(url: string = 'ws://localhost:8000'): Promise<void> {
    // Connect to your existing StreamHandler
  }
  
  subscribe(streamId: string, widgetId: string): void {
    // Subscribe widget to specific stream
  }
  
  sendCommand(moduleId: string, command: any): void {
    // Send commands to your DynamicModules
  }
}
```

#### 2.2 Message Format Integration
```typescript
// types/comms.ts - Match your existing backend exactly
interface CommsMessage {
  type: 'negotiation' | 'control' | 'query' | 'ping' | 'config'
  status: 'active' | 'inactive' | 'error'
  data: { [moduleId: string]: CommsModule }
  'msg-sent-timestamp': string
}

// This should match your backend stream format exactly
interface CommsStream {
  stream_id: number
  name: string
  datatype: 'float' | 'int' | 'string' | 'boolean' | 'array'
  unit?: string
  status: 'active' | 'inactive' | 'error'
  metadata: {
    sensor?: string
    precision?: number
    location?: string
    calibration_date?: string
  }
  value: any
  'stream-update-timestamp': string
  priority: 'high' | 'medium' | 'low'
}
```

#### 2.3 State Management with Comms
```typescript
// components/comms-context.tsx
interface CommsState {
  streamClient: CommsStreamClient | null
  connectedModules: Map<string, CommsModule>
  activeStreams: Map<string, CommsStream>
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  lastMessage: string | null
}
```

### Phase 3: Basic Dashboard (Week 3-4)
**Priority: High - Core functionality**

#### 3.1 Grid System Implementation  
- `components/main-content.tsx` - Basic draggable grid
- Physics-based collision detection
- Widget resize handles
- Grid persistence

#### 3.2 Basic Widgets (Start with these)
- `components/widgets/sensor-widgets/basic-value-display.tsx`
- `components/widgets/sensor-widgets/basic-chart.tsx` 
- `components/widgets/control-widgets/toggle-control.tsx`

#### 3.3 Widget-Stream Binding
```typescript
// hooks/use-stream.ts
export const useCommsStream = (streamId: string) => {
  const { streamClient, activeStreams } = useComms()
  const [value, setValue] = useState(null)
  const [metadata, setMetadata] = useState(null)
  
  useEffect(() => {
    if (streamClient && streamId) {
      streamClient.subscribe(streamId, 'widget-id')
      // Handle stream updates
    }
  }, [streamClient, streamId])
  
  return { value, metadata, status: 'active' }
}
```

### Phase 4: Hardware Integration (Week 4-5)
**Priority: High - Your core use case**

#### 4.1 DynamicModule Management Interface
- `components/modals/hardware-modal.tsx` - Module discovery and control
- `lib/comms/module-manager.ts` - Module lifecycle management
- Real-time module status display

#### 4.2 Hardware-Specific Widgets
- Auto-detect widget type from stream metadata
- Temperature widgets with unit conversion
- Pressure gauges with configurable ranges
- Serial communication status widgets

#### 4.3 Two-Way Control Implementation
```typescript
// components/widgets/control-widgets/hardware-control.tsx
const HardwareControlWidget = ({ moduleId, streamId }) => {
  const { control } = useHardwareModule(moduleId)
  const { value, metadata } = useCommsStream(streamId)
  
  const handleCommand = async (command: any) => {
    await control.sendCommand(command)
    // Handle response and update UI
  }
  
  return (
    // Control interface with real-time feedback
  )
}
```

### Phase 5: Advanced Features (Week 5-6)
**Priority: Medium - Polish and advanced functionality**

#### 5.1 Modal System
- Configuration modals for different system components
- Debug interface with live message inspection
- Performance monitoring dashboard

#### 5.2 Profile Management
- Save/load dashboard configurations
- Hardware profile management
- Stream association persistence

#### 5.3 AriesMods System
- Basic marketplace interface
- Widget template system
- Dynamic widget loading

### Phase 6: Performance & Polish (Week 6+)
**Priority: Low - Optimization**

#### 6.1 High-Frequency Data Optimization
- Data downsampling for display
- Memory-efficient stream buffering
- Frame rate optimization

#### 6.2 Advanced UI Features
- Theme system
- Keyboard shortcuts
- Advanced grid features

## 🚀 Quick Start Implementation Guide

### Immediate Next Steps (Start Here)

#### 1. Setup Existing AriesUI Project
```bash
# Navigate to your existing AriesUI project
cd AriesUI

# Install additional dependencies for Comms integration
npm install recharts  # For real-time charts (if not already installed)

# Verify existing dependencies are compatible
# Your existing setup should already have:
# - @radix-ui components
# - lucide-react
# - class-variance-authority, clsx, tailwind-merge
```

#### 2. Add Comms Integration Files (Priority Order)

**File 1: Create `types/comms.ts` (Critical - Define your data structures first)**
```typescript
// This should exactly match your existing StreamHandler message format
export interface CommsMessage {
  type: 'negotiation' | 'control' | 'query' | 'ping' | 'config'
  status: 'active' | 'inactive' | 'error'
  data: { [moduleId: string]: CommsModule }
  'msg-sent-timestamp': string
}

export interface CommsModule {
  module_id: string
  name: string
  status: 'active' | 'inactive' | 'error'
  'module-update-timestamp': string
  config: {
    update_rate: number
    enabled_streams: string[]
    debug_mode: boolean
    [key: string]: any
  }
  streams: { [streamId: string]: CommsStream }
}

export interface CommsStream {
  stream_id: number
  name: string
  datatype: 'float' | 'int' | 'string' | 'boolean' | 'array'
  unit?: string
  status: 'active' | 'inactive' | 'error'
  metadata: {
    sensor?: string
    precision?: number
    location?: string
    calibration_date?: string
    [key: string]: any
  }
  value: any
  'stream-update-timestamp': string
  priority: 'high' | 'medium' | 'low'
}
```

**File 2: `lib/comms/stream-client.ts` (Critical - Your connection to backend)**
```typescript
import { CommsMessage, CommsModule, CommsStream } from '@/types/comms'

export class CommsStreamClient {
  private ws: WebSocket | null = null
  private url: string = 'ws://localhost:8000' // Your StreamHandler URL
  private messageQueue: CommsMessage[] = []
  private subscriptions: Map<string, Set<string>> = new Map()
  private messageHandlers: Set<(message: CommsMessage) => void> = new Set()
  private connectionHandlers: Set<(connected: boolean) => void> = new Set()

  async connect(url?: string): Promise<void> {
    if (url) this.url = url
    
    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        console.log('Connected to StreamHandler')
        this.connectionHandlers.forEach(handler => handler(true))
        this.processMessageQueue()
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message: CommsMessage = JSON.parse(event.data)
          this.messageHandlers.forEach(handler => handler(message))
        } catch (error) {
          console.error('Failed to parse message:', error)
        }
      }
      
      this.ws.onclose = () => {
        console.log('Disconnected from StreamHandler')
        this.connectionHandlers.forEach(handler => handler(false))
        // Auto-reconnect logic
        setTimeout(() => this.connect(), 5000)
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect to StreamHandler:', error)
    }
  }

  subscribe(streamId: string, widgetId: string): void {
    if (!this.subscriptions.has(streamId)) {
      this.subscriptions.set(streamId, new Set())
    }
    this.subscriptions.get(streamId)!.add(widgetId)
  }

  unsubscribe(streamId: string, widgetId: string): void {
    this.subscriptions.get(streamId)?.delete(widgetId)
  }

  sendCommand(moduleId: string, command: any): void {
    const message: CommsMessage = {
      type: 'control',
      status: 'active',
      data: {
        [moduleId]: {
          command: command
        }
      } as any,
      'msg-sent-timestamp': new Date().toISOString()
    }
    this.sendMessage(message)
  }

  sendQuery(queryType: string, params?: any): void {
    const message: CommsMessage = {
      type: 'query',
      status: 'active', 
      data: { queryType, params } as any,
      'msg-sent-timestamp': new Date().toISOString()
    }
    this.sendMessage(message)
  }

  private sendMessage(message: CommsMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      this.messageQueue.push(message)
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!
      this.sendMessage(message)
    }
  }

  onMessage(callback: (message: CommsMessage) => void): void {
    this.messageHandlers.add(callback)
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.connectionHandlers.add(callback)
  }

  disconnect(): void {
    this.ws?.close()
  }
}
```

**File 3: Enhance `components/comms-context.tsx` (Add Comms integration to existing state)**

Add these imports and types to your existing `comms-context.tsx`:
```typescript
// Add these imports at the top
import { CommsStreamClient } from '@/lib/comms/stream-client'
import { CommsMessage, CommsModule, CommsStream } from '@/types/comms'

// Enhance your existing CommsState interface with these new fields:
interface CommsState {
  // Your existing state fields (keep these)
  streams: Stream[]
  widgets: Widget[]
  activeModal: string | null
  theme: "light" | "dark"
  gridLayouts: any[]
  installedMods: string[]
  logs: string[]
  terminalHistory: string[]
  
  // Add these new fields for hardware integration
  streamClient: CommsStreamClient | null
  connectedModules: Map<string, CommsModule>
  activeStreams: Map<string, CommsStream>
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  lastMessage: CommsMessage | null
}

// Add these new action types to your existing CommsAction:
type CommsAction = 
  // Your existing actions (keep these)
  | { type: "SET_MODAL"; payload: string | null }
  | { type: "ADD_WIDGET"; payload: Widget }
  // ... other existing actions ...
  
  // Add these new actions for hardware integration
  | { type: 'SET_STREAM_CLIENT', payload: CommsStreamClient }
  | { type: 'SET_CONNECTION_STATUS', payload: 'connected' | 'disconnected' | 'reconnecting' }
  | { type: 'UPDATE_COMMS_MESSAGE', payload: CommsMessage }
  | { type: 'ADD_HARDWARE_LOG', payload: string }

// Add these to your existing initialState:
const initialState: CommsState = {
  // Your existing initial state (keep these)
  streams: [...],
  widgets: [],
  // ... other existing fields ...
  
  // Add these new fields
  streamClient: null,
  connectedModules: new Map(),
  activeStreams: new Map(),
  connectionStatus: 'disconnected',
  lastMessage: null,
}

// Enhance your existing commsReducer with these new cases:
function commsReducer(state: CommsState, action: CommsAction): CommsState {
  switch (action.type) {
    // Your existing cases (keep these)
    case "SET_MODAL":
      return { ...state, activeModal: action.payload }
    // ... other existing cases ...
    
    // Add these new cases for hardware integration
    case 'SET_STREAM_CLIENT':
      return { ...state, streamClient: action.payload }
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload }
    
    case 'UPDATE_COMMS_MESSAGE':
      const message = action.payload
      const newModules = new Map(state.connectedModules)
      const newStreams = new Map(state.activeStreams)
      
      Object.entries(message.data).forEach(([moduleId, module]) => {
        newModules.set(moduleId, module)
        Object.entries(module.streams || {}).forEach(([streamId, stream]) => {
          newStreams.set(`${moduleId}.${streamId}`, stream)
        })
      })
      
      return {
        ...state,
        lastMessage: message,
        connectedModules: newModules,
        activeStreams: newStreams
      }
    
    case 'ADD_HARDWARE_LOG':
      return {
        ...state,
        logs: [...state.logs, `[${new Date().toISOString()}] ${action.payload}`]
      }
    
    default:
      return state
  }
}

// Enhance your existing CommsProvider with hardware integration:
export function CommsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(commsReducer, initialState)

  // Add this hardware integration useEffect to your existing provider
  useEffect(() => {
    const client = new CommsStreamClient()
    dispatch({ type: 'SET_STREAM_CLIENT', payload: client })

    client.onConnectionChange((connected) => {
      dispatch({ 
        type: 'SET_CONNECTION_STATUS', 
        payload: connected ? 'connected' : 'disconnected' 
      })
      dispatch({ 
        type: 'ADD_HARDWARE_LOG', 
        payload: connected ? 'Connected to StreamHandler' : 'Disconnected from StreamHandler' 
      })
    })

    client.onMessage((message) => {
      dispatch({ type: 'UPDATE_COMMS_MESSAGE', payload: message })
      dispatch({ type: 'ADD_HARDWARE_LOG', payload: `Received ${message.type} message` })
    })

    // Auto-connect to StreamHandler
    client.connect()

    return () => client.disconnect()
  }, [])

  // Your existing provider return (keep as is)
  return (
    <CommsContext.Provider value={{ state, dispatch }}>
      {children}
    </CommsContext.Provider>
  )
}
```

**File 4: `hooks/use-comms-stream.ts` (High Priority - Widget integration)**
```typescript
import { useState, useEffect } from 'react'
import { useComms } from '@/components/comms-context'
import { CommsStream } from '@/types/comms'

export function useCommsStream(streamId: string) {
  const { state } = useComms()
  const [stream, setStream] = useState<CommsStream | null>(null)

  useEffect(() => {
    const currentStream = state.activeStreams.get(streamId)
    if (currentStream) {
      setStream(currentStream)
    }
  }, [streamId, state.activeStreams])

  const subscribe = () => {
    if (state.streamClient) {
      state.streamClient.subscribe(streamId, 'widget-id') // Replace with actual widget ID
    }
  }

  const unsubscribe = () => {
    if (state.streamClient) {
      state.streamClient.unsubscribe(streamId, 'widget-id')
    }
  }

  return {
    value: stream?.value,
    metadata: stream?.metadata,
    status: stream?.status || 'inactive',
    lastUpdate: stream?.['stream-update-timestamp'],
    unit: stream?.unit,
    datatype: stream?.datatype,
    subscribe,
    unsubscribe
  }
}
```

#### 3. Test Backend Connection First
Create `app/test/page.tsx` to verify your StreamHandler connection:

```typescript
'use client'

import { useComms } from '@/components/comms-context'
import { useEffect } from 'react'

export default function TestPage() {
  const { state } = useComms()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Comms Connection Test</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Connection Status:</strong> {state.connectionStatus}
        </div>
        
        <div>
          <strong>Connected Modules:</strong> {state.connectedModules.size}
          <ul className="ml-4">
            {Array.from(state.connectedModules.entries()).map(([id, module]) => (
              <li key={id}>{module.name} ({module.status})</li>
            ))}
          </ul>
        </div>
        
        <div>
          <strong>Active Streams:</strong> {state.activeStreams.size}
          <ul className="ml-4">
            {Array.from(state.activeStreams.entries()).map(([id, stream]) => (
              <li key={id}>{stream.name}: {stream.value} {stream.unit}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <strong>Recent Logs:</strong>
          <div className="bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
            {state.logs.slice(-10).map((log, i) => (
              <div key={i} className="text-sm">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Development Order (Critical Path)

1. **Week 1**: Set up project structure + implement files 1-4 above
2. **Week 1**: Test connection with existing StreamHandler using test page
3. **Week 2**: Build basic widget system with stream binding
4. **Week 2**: Implement basic grid layout for widgets
5. **Week 3**: Add hardware control widgets with two-way communication
6. **Week 4**: Build module management interface
 7. **Week 5+**: Add advanced features (modals, profiles, marketplace)

#### 4. Update App Layout and Main Page

**Update `app/layout.tsx` to include CommsProvider:**
```typescript
import { CommsProvider } from '@/components/comms-context'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <CommsProvider>
          {children}
        </CommsProvider>
      </body>
    </html>
  )
}
```

**Create `app/page.tsx` as main dashboard:**
```typescript
'use client'

import { useComms } from '@/components/comms-context'
import { useCommsStream } from '@/hooks/use-comms-stream'
import Link from 'next/link'

// Simple widget component to test stream integration
function BasicSensorWidget({ moduleId, streamId }: { moduleId: string, streamId: string }) {
  const { value, metadata, status, unit } = useCommsStream(`${moduleId}.${streamId}`)
  
  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <h3 className="font-semibold">{metadata?.sensor || 'Sensor'}</h3>
      <div className="text-2xl font-bold">
        {value !== null ? `${value} ${unit || ''}` : 'No Data'}
      </div>
      <div className="text-sm text-gray-500">
        Status: {status} | Location: {metadata?.location}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { state } = useComms()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">AriesUI v3 - Comms Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded text-sm ${
              state.connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {state.connectionStatus}
            </div>
            <Link href="/test" className="text-blue-600 hover:underline">
              Connection Test
            </Link>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Render widgets for each connected module */}
          {Array.from(state.connectedModules.entries()).map(([moduleId, module]) => (
            <div key={moduleId} className="space-y-4">
              <h2 className="text-lg font-semibold">{module.name}</h2>
              {Object.entries(module.streams || {}).map(([streamId, stream]) => (
                <BasicSensorWidget 
                  key={`${moduleId}.${streamId}`}
                  moduleId={moduleId} 
                  streamId={streamId} 
                />
              ))}
            </div>
          ))}
          
          {state.connectedModules.size === 0 && (
            <div className="col-span-full text-center py-12">
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                No Hardware Modules Connected
              </h2>
              <p className="text-gray-500 mb-4">
                Make sure your StreamHandler and Engine are running with DynamicModules
              </p>
              <Link 
                href="/test" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Test Connection
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
```

#### 5. First Week Milestone Checklist

- [ ] Project initialized with Next.js + TypeScript + Tailwind
- [ ] Core files created (types, stream-client, context, hooks)
- [ ] CommsProvider integrated in app layout
- [ ] Test page shows connection status to StreamHandler
- [ ] Main page displays connected modules and streams
- [ ] Basic sensor widgets showing real-time data
- [ ] Auto-reconnection working when StreamHandler restarts

**Test with your existing setup:**
1. Start your existing StreamHandler: `python insposoftware/sh/sh.py`
2. Start your Engine with DynamicModules: `python insposoftware/en/en.py`
3. Start your enhanced AriesUI: `npm run dev`
4. Navigate to `http://localhost:3000` - your existing UI should now show hardware connection status
5. Check your existing widgets for live sensor data from connected modules

**Verify existing components are enhanced:**
- ✅ Status bar should show "Connected" when StreamHandler is running
- ✅ Existing modals should still work (config, logs, terminal, etc.)
- ✅ Your existing widget system should now bind to real hardware streams
- ✅ Theme switching should still work normally

#### 6. Week 2 Priority: Basic Grid System

Once connection is working, implement basic draggable grid:

```typescript
// components/widgets/widget-container.tsx
'use client'

import { useState, useRef } from 'react'

interface Position {
  x: number
  y: number
}

interface WidgetContainerProps {
  children: React.ReactNode
  initialPosition?: Position
  onPositionChange?: (position: Position) => void
}

export function WidgetContainer({ 
  children, 
  initialPosition = { x: 0, y: 0 },
  onPositionChange 
}: WidgetContainerProps) {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    // Implement drag logic
  }

  return (
    <div
      ref={dragRef}
      className={`absolute border rounded-lg bg-white shadow ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translate3d(0, 0, 0)' // Hardware acceleration
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  )
}
```

## 📋 Migration from HTML Version

### Key Architectural Changes

**State Management:**
- **Old**: Direct DOM manipulation with jQuery-style selectors
- **New**: React Context + useReducer with TypeScript safety
- **Migration**: Convert global variables to React state, event handlers to React callbacks

**Widget System:**
- **Old**: HTML templates with inline styles
- **New**: React components with TypeScript props and Tailwind CSS
- **Migration**: Convert HTML widgets to React components, CSS classes to Tailwind utilities

**Stream Integration:**
- **Old**: Direct WebSocket connection with manual message parsing
- **New**: Abstracted CommsStreamClient with automatic reconnection and TypeScript interfaces
- **Migration**: Your existing stream format is compatible - just need to wrap in TypeScript interfaces

**Grid Layout:**
- **Old**: CSS Grid or absolute positioning
- **New**: Physics-based collision detection with drag/drop
- **Migration**: Convert static layouts to dynamic React-based grid system

### Reusable Components from Old Version

You can migrate these concepts directly:
- **Widget Templates**: Convert to React components
- **Stream Subscriptions**: Use new useCommsStream hook
- **Hardware Control Logic**: Wrap in React event handlers
- **Dashboard Layouts**: Save as JSON, load into React state

### Backward Compatibility

- **Stream Handler**: No changes needed - same WebSocket endpoint and message format
- **Engine & DynamicModules**: No changes needed - same interface
- **Hardware Modules**: No changes needed - existing modules work as-is
- **Message Format**: Fully compatible with existing JSON structure

## 📋 Next Steps Checklist

### Week 1: Foundation (Integrate with Existing AriesUI)
- [ ] Add Comms integration files to existing Next.js project (types, stream-client)
- [ ] Enhance existing comms-context.tsx with hardware state management
- [ ] Test connection to existing StreamHandler from your current UI
- [ ] Connect existing widgets to live sensor data from DynamicModules
- [ ] Verify auto-reconnection functionality works with your existing components

### Week 2: Enhance Existing Widgets 
- [ ] Connect your existing sensor widgets to real hardware streams
- [ ] Enhance your existing drag/drop system with hardware awareness
- [ ] Improve your existing grid layout system with collision detection
- [ ] Implement stream-to-widget binding in existing components
- [ ] Add hardware data persistence to your existing widget restoration

### Week 3: Hardware Control
- [ ] Implement two-way communication widgets
- [ ] Toggle controls with hardware feedback
- [ ] Slider controls with real-time updates
- [ ] Command interface for DynamicModules
- [ ] Error handling and status display

### Week 4: Module Management
- [ ] Hardware module discovery interface
- [ ] Module configuration panels
- [ ] Real-time module health monitoring
- [ ] Module start/stop controls
- [ ] Debug message display

### Week 5+: Advanced Features
- [ ] Modal system for different configurations
- [ ] Profile management for dashboard layouts
- [ ] AriesMods marketplace and extension system
- [ ] Performance monitoring and optimization
- [ ] Theme system and accessibility

## 🔗 Repository Structure

```
AriesUI/                    # Your existing Next.js project
├── app/                    # Next.js app directory
├── components/             # Your existing components
│   ├── comms-context.tsx   # Enhanced with hardware integration
│   ├── main-content.tsx    # Your existing grid system
│   ├── modals/             # Your existing modal system
│   └── ui/                 # Your existing UI components
├── lib/
│   └── comms/              # New: Integration with backend
│       ├── stream-client.ts
│       └── message-parser.ts
├── types/
│   └── comms.ts            # New: TypeScript definitions
└── insposoftware/          # Your existing Python backend
    ├── en/                 # Engine (en.py) and DynamicModules
    ├── sh/                 # StreamHandler (sh.py)
    └── HyperThreader.py    # Process management
```

## 🚀 Quick Reference

**Start Backend (Terminal 1):**
```bash
cd AriesUI/insposoftware/sh
python sh.py
```

**Start Engine (Terminal 2):**
```bash  
cd AriesUI/insposoftware/en
python en.py
```

**Start Enhanced AriesUI (Terminal 3):**
```bash
cd AriesUI
npm run dev
```

**Test Your Enhanced AriesUI:**
- Navigate to `http://localhost:3000` (your existing interface)
- Verify StreamHandler connection status in your existing status bar
- Check for detected DynamicModules in your existing widget system
- Confirm real-time data streaming to your existing components

## 📞 Support

The implementation templates above provide:
- Full TypeScript integration with your existing Comms backend
- Backward compatibility with current DynamicModules
- Real-time WebSocket communication
- Scalable React architecture for future features
- Migration path from HTML version

Focus on the Week 1 checklist first - once you have the basic connection working, building widgets and advanced features becomes much easier.

---

*Ready to start building AriesUI v3? Begin with the Week 1 foundation and you'll have a working Comms-integrated dashboard in no time!* 