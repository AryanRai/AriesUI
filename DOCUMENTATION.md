# AriesUI v3.0 - Complete Implementation & Development Guide

[![Version](https://img.shields.io/badge/Version-v3.0-blue)](https://github.com/AryanRai/AriesUI)
[![Performance](https://img.shields.io/badge/Performance-60fps-green)](https://github.com/AryanRai/AriesUI)
[![Hardware](https://img.shields.io/badge/Hardware-Ready-orange)](https://github.com/AryanRai/AriesUI)

> **Complete guide for developing, deploying, and extending AriesUI - a high-performance hardware dashboard**

---

## 📖 Table of Contents

1. [🚀 Getting Started](#-getting-started)
2. [🏗️ Architecture Overview](#-architecture-overview)
3. [⚡ Performance Features](#-performance-features)
4. [🔧 Hardware Integration](#-hardware-integration)
5. [🧩 AriesMods Development](#-ariesmods-development)
6. [🎨 UI Components & Theming](#-ui-components--theming)
7. [🔌 API Reference](#-api-reference)
8. [📊 Performance Optimization](#-performance-optimization)
9. [🛠️ Development Workflow](#-development-workflow)
10. [🚀 Deployment](#-deployment)

---

## 🚀 Getting Started

### Quick Start
```bash
# Clone and setup
git clone https://github.com/AryanRai/AriesUI.git
cd AriesUI
npm install

# Development modes
npm run dev          # Web development
npm run electron-dev # Desktop development

# Production builds
npm run build        # Web build
npm run build-electron # Desktop build
```

### Integration with Comms Backend
```bash
# Start backend components first
python HyperThreader.py          # Process manager
python insposoftware/sh/sh.py   # Stream handler
python insposoftware/en/en.py   # Hardware engine

# Then start AriesUI
npm run electron-dev             # Recommended for desktop
```

### Key Scripts
- **`npm run dev`** - Next.js development server
- **`npm run electron-dev`** - Electron + Next.js development
- **`npm run build`** - Production web build
- **`npm run build-electron`** - Production desktop build
- **`npm run lint`** - Code linting
- **`npm run type-check`** - TypeScript validation

---

## 🏗️ Architecture Overview

### Core System Structure
```
AriesUI Architecture
├── 🎯 Main Dashboard (components/main-content/)
│   ├── StateManager.tsx      # Centralized state management
│   ├── PerformanceManager.tsx # GPU acceleration & optimization
│   ├── EventHandlers.tsx     # Mouse/keyboard interactions
│   └── MainContent.tsx       # Component orchestrator
│
├── 🔧 Widget System (components/widgets/)
│   ├── ariesmod-widget.tsx   # AriesMod wrapper
│   └── enhanced-sensor-widget.tsx # Hardware-integrated widgets
│
├── 🎨 Grid System (components/grid/)
│   ├── GridWidget.tsx        # Individual widget renderer
│   ├── NestContainer.tsx     # Nested widget containers
│   ├── ResizeHandles.tsx     # Resize controls
│   └── utils.ts             # Grid calculations & physics
│
├── 🧩 AriesMods (ariesMods/)
│   ├── sensors/             # Hardware sensor widgets
│   ├── controls/            # Interactive control widgets
│   ├── visualization/       # Data visualization widgets
│   ├── utility/            # Utility widgets
│   └── templates/          # Development templates
│
└── 🔌 Hardware Integration (lib/)
    ├── comms-stream-client.ts    # Backend communication
    ├── ariesmods-registry.ts     # Plugin management
    └── ariesmods-dependency-manager.ts # Dependencies
```

### Modular Main Content
The main content has been refactored from a monolithic 2,719-line file into focused modules:

**StateManager.tsx** - Handles:
- Viewport state (zoom, pan, position)
- Drag/resize states with hardware acceleration
- Auto-save functionality with localStorage persistence
- Undo/redo history system
- Grid state management

**PerformanceManager.tsx** - Provides:
- Virtual grid calculations with viewport culling
- Hardware acceleration detection and management
- Batched widget updates (16ms intervals for 60fps)
- Performance monitoring and metrics

**EventHandlers.tsx** - Manages:
- Hardware-accelerated mouse/keyboard events
- Drag and drop with RequestAnimationFrame
- Resize operations with smooth feedback
- Wheel events for zoom/pan with trackpad support

---

## ⚡ Performance Features

### Hardware Acceleration
All widgets and interactions use GPU acceleration:

```typescript
// Every widget automatically gets hardware acceleration
const widgetStyle = {
  transform: `translate3d(${x}px, ${y}px, 0)`,
  willChange: 'transform',
  // Forces GPU layer creation
}
```

### Virtual Grid System
Renders only visible widgets for optimal performance:

```typescript
// Virtual grid with 300px buffer for smooth scrolling
const virtualGrid = useMemo(() => {
  const bufferSize = 300
  const viewportBounds = {
    left: -viewport.x - bufferSize,
    top: -viewport.y - bufferSize,
    right: -viewport.x + containerSize.width / viewport.zoom + bufferSize,
    bottom: -viewport.y + containerSize.height / viewport.zoom + bufferSize,
  }
  
  return gridState.widgets.filter(widget => isVisible(widget, viewportBounds))
}, [gridState, viewport, containerSize])
```

### RequestAnimationFrame Optimization
All animations use RAF for smooth 60fps performance:

```typescript
// Smooth dragging with RAF
const rafRef = useRef<number | null>(null)

const handleMouseMove = useCallback((e: MouseEvent) => {
  if (rafRef.current) {
    cancelAnimationFrame(rafRef.current)
  }
  
  rafRef.current = requestAnimationFrame(() => {
    updateWidgetPosition(newX, newY)
    rafRef.current = null
  })
}, [])
```

### Performance Monitoring
Real-time performance metrics are available:

```typescript
// Performance status bar shows:
⚡ Hardware Acceleration: ACTIVE | Virtual Grid: 75.2% | Rendered: 12/48
```

---

## 🔧 Hardware Integration

### Stream Connection
Connect widgets to hardware streams from the Comms backend:

```typescript
// Using the comms stream hook
const { value, status, metadata } = useCommsStream('module1.temperature')

// Stream configuration
const streamMapping = {
  id: 'temp1',
  streamId: 'module1.temperature',
  streamName: 'Chamber Temperature',
  multiplier: 1.8,
  offset: 32,        // Convert Celsius to Fahrenheit
  unit: '°F',
  precision: 1,
  enabled: true
}
```

### Enhanced Sensor Widgets
All sensor widgets support hardware integration:

```typescript
<EnhancedSensorWidget
  widgetId="temp-sensor-1"
  title="Temperature Sensor"
  sensorType="temperature"
  streamMappings={streamMappings}
  onStreamMappingsChange={updateStreamMappings}
  showTrend={true}
  precision={1}
  thresholds={{
    warning: { min: 0, max: 50 },
    critical: { min: -10, max: 70 }
  }}
/>
```

### Two-Way Communication
Control hardware devices through widgets:

```typescript
// Send control commands to hardware
const sendCommand = async (moduleId: string, command: any) => {
  await commsClient.sendControl(moduleId, command)
}

// Toggle switch example
const handleToggle = (checked: boolean) => {
  sendCommand('relay1', { action: 'toggle', state: checked })
}
```

### Hardware Status Monitoring
Real-time connection and performance indicators:

```typescript
const { status, latency, lastUpdate } = useHardwareStatus()

// Status indicators:
// 🟢 Connected (< 100ms latency)
// 🟡 Warning (100-500ms latency)  
// 🔴 Disconnected (> 500ms or no response)
```

---

## 🧩 AriesMods Development

### Creating Custom AriesMods

#### 1. Basic AriesMod Template
```typescript
// ariesMods/sensors/CustomSensor.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AriesModProps } from '@/types/ariesmods'

const CustomSensor: React.FC<AriesModProps> = ({
  id,
  title = "Custom Sensor",
  width,
  height,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const value = data?.value ?? '--'
  const unit = config?.unit ?? ''
  const theme = config?.theme ?? 'default'

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Badge variant={theme === 'success' ? 'default' : 'secondary'}>
            {data?.status ?? 'offline'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-3xl font-bold mb-2">
            {value} {unit}
          </div>
          {data?.timestamp && (
            <div className="text-xs text-muted-foreground">
              Last: {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomSensor
```

#### 2. Advanced AriesMod with Configuration
```typescript
// ariesMods/visualization/AdvancedChart.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AriesModProps } from '@/types/ariesmods'

export interface AdvancedChartConfig {
  chartType: 'line' | 'bar' | 'scatter'
  title: string
  dataPoints: number
  refreshRate: number
  showLegend: boolean
}

const AdvancedChart: React.FC<AriesModProps> = ({
  id,
  title,
  data,
  config,
  onConfigChange,
  onDataRequest
}) => {
  const [chartData, setChartData] = useState([])
  
  const chartConfig = config as AdvancedChartConfig
  
  useEffect(() => {
    // Request data updates based on refresh rate
    const interval = setInterval(() => {
      onDataRequest?.(id, { type: 'chart_data', points: chartConfig?.dataPoints })
    }, chartConfig?.refreshRate || 1000)
    
    return () => clearInterval(interval)
  }, [id, chartConfig, onDataRequest])

  const renderChart = () => {
    // Chart rendering logic here
    return <div>Chart visualization</div>
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>{chartConfig?.title || title}</CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        {renderChart()}
      </CardContent>
    </Card>
  )
}

export default AdvancedChart
```

### AriesMod Categories

#### Sensors (ariesMods/sensors/)
- **TemperatureSensor.tsx** - Temperature displays with thresholds
- **PressureSensor.tsx** - Pressure monitoring with units
- **VoltageSensor.tsx** - Voltage readings with safety limits
- **GenericSensor.tsx** - Configurable sensor template

#### Controls (ariesMods/controls/)
- **ToggleControl.tsx** - On/off switches with hardware feedback
- **SliderControl.tsx** - Range controls with real-time updates
- **ButtonControl.tsx** - Command buttons with confirmation

#### Visualization (ariesMods/visualization/)
- **LineChart.tsx** - Time-series data visualization
- **PlotlyChart.tsx** - Advanced plotting with Plotly.js
- **PointCloudVis.tsx** - 3D point cloud visualization

#### Utility (ariesMods/utility/)
- **Clock.tsx** - Digital clock with time zones
- **Calculator.tsx** - Basic calculator widget

### Plugin Registry
```typescript
// lib/ariesmods-registry.ts
export const ARIESMODS_REGISTRY = {
  sensors: {
    'temperature-sensor': {
      name: 'Temperature Sensor',
      component: () => import('@/ariesMods/sensors/TemperatureSensor'),
      category: 'sensors',
      defaultSize: { w: 200, h: 150 },
      configurable: true,
      hardwareIntegrated: true
    }
  },
  // ... more categories
}
```

---

## 🎨 UI Components & Theming

### Available UI Components (50+ Radix UI Components)
```typescript
// Core UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
// ... and 40+ more components
```

### Theme System
```typescript
// Multiple theme colors available
import { useThemeColors } from '@/hooks/use-theme-colors'

const { currentTheme, setTheme, colors } = useThemeColors()

// Available themes: default, emerald, blue, violet, rose, orange, yellow, lime
setTheme('emerald') // Changes entire UI theme
```

### Custom Styling
```css
/* styles/globals.css - Hardware-accelerated animations */
.aries-widget-smooth-drag {
  transition: none;
  will-change: transform;
  transform: translate3d(var(--x), var(--y), 0);
}

.aries-grid-smooth-drag * {
  pointer-events: none; /* Improve drag performance */
}

/* Performance optimizations */
.aries-widget-card {
  will-change: transform;
  transform: translate3d(0, 0, 0); /* Force GPU layer */
}
```

---

## 🔌 API Reference

### Core Hooks

#### useCommsStream
```typescript
const useCommsStream = (streamId: string) => {
  return {
    value: any,           // Current stream value
    status: string,       // 'connected' | 'disconnected' | 'error'
    metadata: object,     // Stream metadata
    lastUpdate: Date,     // Last update timestamp
    history: array        // Historical values
  }
}
```

#### usePerformanceDrag
```typescript
const usePerformanceDrag = (options: {
  onDragStart?: (e: MouseEvent) => void
  onDragEnd?: (e: MouseEvent) => void
  useGPU?: boolean
}) => {
  return {
    isDragging: boolean,
    position: { x: number, y: number },
    dragHandleProps: object
  }
}
```

#### useVirtualGrid
```typescript
const useVirtualGrid = (options: {
  items: array,
  viewportSize: { width: number, height: number },
  bufferSize?: number
}) => {
  return {
    visibleItems: array,
    totalItems: number,
    renderedItems: number,
    culledItems: number,
    cullingPercentage: number
  }
}
```

### Component APIs

#### GridWidget Props
```typescript
interface GridWidgetProps {
  widget: MainGridWidget | AriesWidget
  isDragging: boolean
  isResizing: boolean
  isPushed: boolean
  onMouseDown: (e: React.MouseEvent, id: string, type: string) => void
  onRemove: (id: string) => void
  onUpdate?: (id: string, updates: any) => void
  getResizeHandles: (id: string, type: string) => React.ReactNode
}
```

#### AriesModProps Interface
```typescript
interface AriesModProps {
  id: string
  title: string
  width: number
  height: number
  data?: AriesModData
  config?: Record<string, any>
  onConfigChange?: (config: Record<string, any>) => void
  onDataRequest?: (id: string, request: any) => void
}
```

---

## 📊 Performance Optimization

### Current Optimizations

#### 1. Hardware Acceleration
- All transforms use `translate3d()` for GPU acceleration
- `willChange` properties force GPU layer creation
- Hardware acceleration status monitoring

#### 2. Virtual Rendering
- Viewport culling renders only visible widgets
- 300px buffer zone for smooth scrolling
- Configurable culling percentage monitoring

#### 3. RequestAnimationFrame
- All animations use RAF for 60fps performance
- Batched widget updates every 16ms
- Optimized mouse event handling

#### 4. Memory Management
- Lazy loading of AriesMods
- Component memoization with React.memo
- Cleanup of animation frames and intervals

### Performance Monitoring
```typescript
// Real-time performance metrics
const performanceMetrics = {
  frameRate: 60,           // Current FPS
  avgFrameTime: 16.67,     // Average frame time in ms
  widgetCount: 48,         // Total widgets
  renderedWidgets: 12,     // Currently rendered
  culledWidgets: 36,       // Culled by virtual grid
  cullingPercentage: 75.0, // Culling efficiency
  memoryUsage: 45.2,       // MB memory usage
  gpuAcceleration: true    // Hardware acceleration status
}
```

### Optimization Guidelines

#### For Developers
1. **Use Hardware Acceleration**: Always use `translate3d()` for transforms
2. **Minimize Re-renders**: Use React.memo and useMemo appropriately
3. **Batch Updates**: Group state updates where possible
4. **Virtual Rendering**: Implement viewport culling for large datasets
5. **Cleanup Resources**: Always cleanup intervals, timeouts, and event listeners

#### For AriesMod Authors
1. **Optimize Rendering**: Avoid expensive calculations in render
2. **Use Throttling**: Throttle high-frequency updates
3. **Memory Management**: Cleanup resources in useEffect cleanup
4. **Hardware Integration**: Use provided hooks for stream connections

---

## 🛠️ Development Workflow

### Project Structure
```
ui/ariesUI/
├── app/                     # Next.js App Router
│   ├── page.tsx            # Main dashboard page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── main-content/       # Modular main content
│   ├── grid/              # Grid system
│   ├── widgets/           # Widget system
│   ├── ui/                # UI components (50+)
│   └── modals/            # Modal dialogs
├── ariesMods/             # Plugin system
│   ├── sensors/           # Sensor widgets
│   ├── controls/          # Control widgets
│   ├── visualization/     # Charts & graphs
│   ├── utility/           # Utility widgets
│   └── templates/         # Development templates
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── types/                 # TypeScript definitions
├── styles/                # Global styles
└── public/                # Static assets
```

### Development Commands
```bash
# Development
npm run dev                 # Start Next.js development server
npm run electron-dev        # Start Electron + Next.js development
npm run lint               # Run ESLint
npm run type-check         # TypeScript validation

# Building
npm run build              # Production web build
npm run build-electron     # Production desktop build

# Testing (Future)
npm run test               # Run tests
npm run test:watch         # Watch mode tests
npm run test:coverage      # Coverage report
```

### Code Standards
- **TypeScript** for type safety
- **ESLint** + **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Component Documentation** with JSDoc
- **Performance First** development approach

### Adding New Features

#### 1. Creating New Components
```bash
# Create component with proper structure
mkdir components/my-component
touch components/my-component/index.tsx
touch components/my-component/my-component.tsx
touch components/my-component/types.ts
```

#### 2. Adding New AriesMods
```bash
# Create in appropriate category
touch ariesMods/sensors/MyNewSensor.tsx

# Register in registry
# Update lib/ariesmods-registry.ts
```

#### 3. Performance Considerations
- Always use hardware acceleration for animations
- Implement virtual rendering for large datasets
- Use React.memo for expensive components
- Cleanup resources in useEffect

---

## 🚀 Deployment

### Web Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel (recommended)
npx vercel deploy

# Or deploy to any static host
npm run export  # Static export
```

### Desktop Application
```bash
# Build Electron app
npm run build-electron

# Distributable files created in dist/
# Available for Windows, macOS, and Linux
```

### Environment Configuration
```env
# .env.local
NEXT_PUBLIC_COMMS_WS_URL=ws://localhost:8000
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
```

### Production Optimizations
- Bundle splitting for faster loading
- Image optimization with Next.js Image
- Performance monitoring in production
- Error boundary implementation
- Service worker for offline support (future)

---

## 📋 Troubleshooting

### Common Issues

#### Performance Issues
```typescript
// Check hardware acceleration status
const isHardwareAccelerated = CSS.supports('transform', 'translate3d(0,0,0)')

// Monitor performance metrics
const metrics = usePerformanceMetrics()
console.log('FPS:', metrics.frameRate)
```

#### Stream Connection Issues
```typescript
// Check connection status
const { status, latency } = useCommsSocket()

// Verify stream configuration
const streamConfig = useStreamConfiguration('module1.temperature')
```

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Tools
- **Performance Panel**: Ctrl+D to toggle
- **Debug Console**: Available in development mode
- **Stream Monitor**: Real-time data flow visualization
- **Hardware Status**: Connection and latency monitoring

---

## 📚 Additional Resources

### Documentation
- **[AriesMods Development Guide](ARIESMODS_DEVELOPMENT_GUIDE.md)** - Widget development
- **[Hardware Integration Guide](HARDWARE_INTEGRATION_GUIDE.md)** - Backend integration  
- **[UI Components Guide](UI_COMPONENTS_GUIDE.md)** - Available components
- **[Project Structure](PROJECT_STRUCTURE.md)** - Codebase architecture

### External References
- **[Next.js Documentation](https://nextjs.org/docs)** - Framework reference
- **[Radix UI](https://www.radix-ui.com/)** - UI component library
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[TypeScript](https://www.typescriptlang.org/)** - Type system

### Community
- **Issues**: [GitHub Issues](https://github.com/AryanRai/AriesUI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AryanRai/AriesUI/discussions)  
- **Email**: [aryanrai170@gmail.com](mailto:aryanrai170@gmail.com)

---

**🎯 AriesUI v3.0 - Built for Performance, Designed for Hardware Integration** 