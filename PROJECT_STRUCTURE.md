# AriesUI Project Structure Documentation

## Overview
AriesUI is a high-performance, hardware-integrated dashboard system built with Next.js, React, and Electron. It provides real-time data visualization, drag-and-drop widget management, and seamless integration with the Comms v3 backend.

## Core Architecture

### 📁 Root Structure
```
ui/ariesUI/
├── app/                          # Next.js App Router
├── components/                   # React Components
├── hooks/                        # Custom React Hooks
├── lib/                         # Utility Libraries
├── types/                       # TypeScript Type Definitions
├── styles/                      # Global Styles
├── public/                      # Static Assets
├── ariesMods/                   # Widget Plugin System
├── electron/                    # Electron Main Process
├── scripts/                     # Build & Development Scripts
└── docs/                        # Documentation
```

## 🔧 Core Components Architecture

### Main Layout System
```
components/
├── main-content.tsx             # ⚠️ NEEDS REFACTORING (1700+ lines)
├── app-sidebar.tsx              # Navigation sidebar
├── top-navigation.tsx           # Header navigation
├── status-bar.tsx               # Bottom status bar
└── floating-toolbar-merged.tsx  # Unified floating toolbar
```

### Grid System (Performance Optimized)
```
components/grid/
├── GridWidget.tsx               # Hardware-accelerated widget wrapper
├── NestContainer.tsx            # Container for nested widgets
├── ResizeHandles.tsx            # Widget resize controls
├── types.ts                     # Grid type definitions
├── utils.ts                     # Grid utility functions
├── useGridEvents.tsx            # Event handling hook
└── useGridState.tsx             # State management hook
```

### Widget System
```
components/widgets/
├── ariesmod-widget.tsx          # AriesMod implementation wrapper
├── enhanced-sensor-widget.tsx   # Hardware-integrated sensors
└── stream-configurator.tsx     # Stream configuration interface
```

### Modal System
```
components/modals/
├── ariesmods-modal.tsx          # Plugin marketplace
├── config-modal.tsx            # System configuration
├── logs-modal.tsx              # System logs
├── performance-modal.tsx       # Performance monitoring
├── terminal-modal.tsx          # Command interface
└── widget-config-modal.tsx     # Widget configuration
```

### Hardware Integration
```
components/hardware/
├── connection-status.tsx       # Hardware connection indicators
├── stream-monitor.tsx          # Real-time data monitoring
└── device-manager.tsx          # Hardware device management
```

## 🎮 AriesMods Plugin System

### Plugin Architecture
```
ariesMods/
├── sensors/                    # Hardware sensor widgets
│   ├── TemperatureSensor.tsx
│   ├── PressureSensor.tsx
│   └── VoltageSensor.tsx
├── controls/                   # Interactive control widgets
│   ├── ToggleControl.tsx
│   ├── SliderControl.tsx
│   └── ButtonControl.tsx
├── visualization/              # Data display widgets
│   ├── LineChart.tsx
│   ├── PlotlyChart.tsx
│   └── PointCloudVis.tsx
├── utility/                    # General purpose widgets
│   ├── Clock.tsx
│   └── Calculator.tsx
└── templates/                  # Development templates
    ├── BasicAriesMod.tsx
    └── AdvancedAriesMod.tsx
```

### Plugin Management
```
lib/
├── ariesmods-registry.ts       # Plugin discovery & management
├── ariesmods-dependency-manager.ts # Dependency management
└── comms-stream-client.ts      # Hardware communication
```

## 🔗 Hooks & State Management

### Performance Hooks
```
hooks/
├── use-performance-drag.ts     # RAF-based dragging
├── use-virtual-grid.ts         # Viewport culling
├── use-viewport-manager.ts     # Smooth zooming/panning
├── use-optimized-events.ts     # High-performance events
├── use-local-storage.ts        # Persistent storage
└── use-animation-preferences.ts # Animation controls
```

### Hardware Integration Hooks
```
hooks/
├── use-comms-socket.ts         # WebSocket communication
├── use-comms-stream.ts         # Real-time data streams
└── use-hardware-status.ts     # Connection monitoring
```

## 📱 Application Structure

### Next.js App Router
```
app/
├── page.tsx                    # Main dashboard page
├── layout.tsx                  # Root layout
├── globals.css                 # Global styles
├── ariesmods-demo/            # Plugin demo page
├── comms-test/                # Communication testing
├── hardware-test/             # Hardware testing
├── performance-test/          # Performance testing
└── futuristic-demo/           # UI showcase
```

### Type Definitions
```
types/
├── ariesmods.ts               # AriesMod interfaces
├── comms.ts                   # Communication types
├── grid.ts                    # Grid system types
└── hardware.ts                # Hardware integration types
```

## 🎨 Styling & UI

### Styling System
```
styles/
├── globals.css                # Global styles
├── aries-widgets.css          # Widget-specific styles
└── grid-optimizations.css     # Performance optimizations
```

### UI Components (50+ Radix UI Components)
```
components/ui/
├── button.tsx                 # Button component
├── card.tsx                   # Card layouts
├── dialog.tsx                 # Modal dialogs
├── form.tsx                   # Form components
├── input.tsx                  # Input controls
├── select.tsx                 # Dropdown selects
├── switch.tsx                 # Toggle switches
├── slider.tsx                 # Range sliders
└── ... (40+ more components)
```

## 🖥️ Desktop Application

### Electron Integration
```
electron/
└── main.js                    # Electron main process

scripts/
├── dev.js                     # Development coordination
└── build-electron.js          # Production build
```

## 📊 Performance Optimizations

### Current Performance Features
- **Hardware Acceleration**: GPU-optimized transforms with `translate3d()`
- **RequestAnimationFrame**: Smooth 60fps rendering
- **Virtual Rendering**: Viewport culling for large widget counts
- **Lazy Loading**: Progressive widget loading
- **Batched Updates**: Optimized state management

### Performance Monitoring
- Real-time frame rate tracking
- Memory usage monitoring
- Widget render count optimization
- Hardware acceleration status

## 🔌 Hardware Integration

### Communication Stack
```
Backend (Python)               Frontend (TypeScript)
├── Engine + DynamicModules ←→ ├── comms-stream-client.ts
├── StreamHandler (WebSocket) ←→ ├── use-comms-stream.ts
└── HyperThreader            ←→ └── hardware status monitoring
```

### Data Flow
1. **Hardware Sensors** → **DynamicModules** → **Engine**
2. **Engine** → **StreamHandler** → **WebSocket**
3. **WebSocket** → **AriesUI** → **Widget Display**
4. **User Controls** → **AriesUI** → **WebSocket** → **Hardware**

## 🚀 Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Electron app
npm run electron-dev

# Build for production
npm run build-electron
```

### File Organization Principles
1. **Separation of Concerns**: Each file has a single responsibility
2. **Performance First**: Hardware acceleration and optimization
3. **Type Safety**: Comprehensive TypeScript coverage
4. **Modularity**: Plugin-based architecture
5. **Maintainability**: Clear documentation and structure

## 📋 Current Issues & Refactoring Needs

### ⚠️ Critical Refactoring Required

#### main-content.tsx (1700+ lines)
**Current Issues:**
- Monolithic component with too many responsibilities
- Complex state management
- Performance optimization code mixed with UI logic
- Event handling scattered throughout
- Difficult to maintain and test

**Proposed Refactoring:**
```
components/main-content/
├── MainContent.tsx             # Main orchestrator (< 200 lines)
├── GridContainer.tsx           # Grid rendering logic
├── PerformanceManager.tsx     # Performance optimizations
├── EventHandlers.tsx          # Mouse/keyboard events
├── StateManager.tsx           # State management
├── ToolbarManager.tsx         # Toolbar positioning
├── ViewportManager.tsx        # Zoom/pan controls
└── types.ts                   # Local type definitions
```

### Next Steps for Refactoring
1. **Extract Performance Logic** → `PerformanceManager.tsx`
2. **Extract Event Handlers** → `EventHandlers.tsx`
3. **Extract State Management** → `StateManager.tsx`
4. **Extract Toolbar Logic** → `ToolbarManager.tsx`
5. **Extract Viewport Logic** → `ViewportManager.tsx`
6. **Create Main Orchestrator** → `MainContent.tsx`

## 📈 Performance Metrics

### Current Performance Status
- **Frame Rate**: 60fps smooth interactions
- **Widget Capacity**: 100+ widgets with virtual rendering
- **Memory Usage**: Optimized with lazy loading
- **Hardware Acceleration**: Active on all transforms
- **Build Size**: ~2MB (optimized)

### Performance Goals
- **Ultra-responsive**: < 16ms frame times
- **Scalable**: 500+ widgets with virtual rendering
- **Efficient**: < 100MB memory usage
- **Fast Loading**: < 3s initial load time

---

**AriesUI v3.1 - Performance Optimized Hardware Dashboard** 🚀

*Last Updated: January 2025*
*Status: Production Ready with Ongoing Refactoring*