# AriesUI v3.1 - Project Structure Documentation

## 📁 Project Overview

AriesUI v3.1 is a performance-optimized, hardware-integrated dashboard system built with Next.js, TypeScript, and Electron. This document provides a comprehensive overview of the project structure and organization.

## 🏗️ Root Structure

```
ui/ariesUI/
├── 📁 app/                          # Next.js App Router pages
├── 📁 ariesMods/                    # AriesMods plugin system
├── 📁 components/                   # React components
├── 📁 electron/                     # Electron main process
├── 📁 hooks/                        # Custom React hooks
├── 📁 lib/                          # Utility libraries
├── 📁 public/                       # Static assets
├── 📁 scripts/                      # Build and development scripts
├── 📁 styles/                       # Global CSS styles
├── 📁 types/                        # TypeScript type definitions
├── 📄 *.config.js                   # Configuration files
├── 📄 *.md                          # Documentation files
└── 📄 package.json                  # Dependencies and scripts
```

## 📱 App Directory (Next.js App Router)

```
app/
├── 📄 globals.css                   # Global styles with Tailwind
├── 📄 layout.tsx                    # Root layout component
├── 📄 page.tsx                      # Main dashboard page
├── 📁 api/                          # API routes (future use)
├── 📁 ariesmods-demo/               # AriesMods demo page
│   └── 📄 page.tsx                  # Demo page component
├── 📁 comms-test/                   # Hardware testing page
├── 📁 futuristic-demo/              # UI demo page
├── 📁 hardware-test/                # Hardware integration tests
└── 📁 performance-test/             # Performance testing page
```

## 🧩 AriesMods Plugin System

```
ariesMods/
├── 📁 controls/                     # Interactive control widgets
│   └── 📄 ToggleControl.tsx         # Hardware toggle switches
├── 📁 sensors/                      # Hardware sensor widgets
│   ├── 📄 TemperatureSensor.tsx     # Temperature displays
│   └── 📄 PressureSensor.tsx        # Pressure monitoring
├── 📁 templates/                    # Development templates
│   ├── 📄 AdvancedAriesMod.tsx      # Advanced template with dependencies
│   └── 📄 BasicAriesMod.tsx         # Basic template for beginners
├── 📁 utility/                      # General purpose widgets
│   └── 📄 Clock.tsx                 # Digital clock widget
└── 📁 visualization/                # Data visualization widgets
    ├── 📄 LineChart.tsx             # Real-time line charts
    ├── 📄 PlotlyChart.tsx           # Advanced Plotly visualizations
    └── 📄 PointCloudVis.tsx         # 3D point cloud visualization
```

## 🎨 Components Architecture

```
components/
├── 📁 debug/                        # Development and debugging tools
│   └── 📄 movable-debug-panel.tsx   # Performance monitoring panel
├── 📁 grid/                         # ✅ Core grid system (Performance Optimized)
│   ├── 📄 GridContainer.tsx         # Main grid container
│   ├── 📄 GridWidget.tsx            # ✅ Hardware-accelerated widget wrapper
│   ├── 📄 NestContainer.tsx         # ✅ Nested container system
│   ├── 📄 ResizeHandles.tsx         # Widget resize functionality
│   ├── 📄 types.ts                  # Grid type definitions
│   ├── 📄 useGridEvents.ts          # Event handling hooks
│   ├── 📄 useGridState.ts           # State management hooks
│   └── 📄 utils.ts                  # Grid utility functions
├── 📁 hardware/                     # Hardware integration components
│   ├── 📄 connection-status.tsx     # Hardware connection indicators
│   ├── 📄 hardware-monitor.tsx      # Real-time hardware monitoring
│   └── 📄 stream-configurator.tsx   # Stream configuration interface
├── 📁 modals/                       # Modal dialog system
│   ├── 📄 ariesmods-modal.tsx       # AriesMods marketplace
│   ├── 📄 config-modal.tsx          # System configuration
│   ├── 📄 logs-modal.tsx            # System logs viewer
│   ├── 📄 performance-modal.tsx     # Performance monitoring
│   ├── 📄 terminal-modal.tsx        # Command line interface
│   └── 📄 widget-config-modal.tsx   # Widget configuration
├── 📁 ui/                           # Radix UI component library (50+ components)
│   ├── 📄 button.tsx                # Button variants
│   ├── 📄 card.tsx                  # Card containers
│   ├── 📄 dialog.tsx                # Dialog modals
│   ├── 📄 form.tsx                  # Form handling
│   ├── 📄 input.tsx                 # Input fields
│   ├── 📄 select.tsx                # Select dropdowns
│   ├── 📄 switch.tsx                # Toggle switches
│   ├── 📄 tooltip.tsx               # Tooltips
│   └── ... (40+ more components)
├── 📁 widgets/                      # Widget system components
│   ├── 📄 ariesmod-selector.tsx     # AriesMod selection interface
│   ├── 📄 ariesmod-widget.tsx       # AriesMod wrapper component
│   ├── 📄 enhanced-sensor-widget.tsx # ✅ Hardware-integrated sensors
│   └── 📄 hardware-accelerated-widget.tsx # ⚠️ Deprecated (use GridWidget)
├── 📄 animated-logo.tsx             # Animated branding
├── 📄 app-performance-provider.tsx  # ✅ Performance monitoring context
├── 📄 app-sidebar.tsx               # ✅ Optimized navigation sidebar
├── 📄 comms-context.tsx             # Hardware communication context
├── 📄 edit-history-panel.tsx        # ✅ Git-like version control
├── 📄 floating-toolbar-merged.tsx   # ✅ Unified floating toolbar
├── 📄 heartbeat-visualizer.tsx      # ✅ Optimized connection status
├── 📄 main-content.tsx              # ✅ Core grid system (~400 lines, optimized)
├── 📄 modal-system.tsx              # Modal management system
├── 📄 status-bar.tsx                # Bottom status information
├── 📄 top-navigation.tsx            # Top navigation bar
└── 📄 window-controls.tsx           # ✅ Window state management
```

## 🔧 Hooks Directory

```
hooks/
├── 📄 use-animation-preferences.tsx  # Animation control preferences
├── 📄 use-comms-socket.ts           # WebSocket communication
├── 📄 use-comms-stream.ts           # Real-time data streaming
├── 📄 use-local-storage.ts          # Persistent local storage
├── 📄 use-optimized-events.ts       # ✅ High-performance event handling
├── 📄 use-performance-drag.ts       # ✅ RAF-based dragging
├── 📄 use-virtual-grid.ts           # ✅ Virtual rendering for performance
├── 📄 use-viewport-manager.ts       # ✅ Smooth zooming and panning
└── 📄 use-window-state.ts           # ✅ Window state management
```

## 📚 Libraries and Utilities

```
lib/
├── 📄 ariesmods-dependency-manager.ts # ✅ Secure dependency loading
├── 📄 ariesmods-registry.ts          # ✅ Plugin discovery and management
├── 📄 comms-stream-client.ts         # Hardware communication client
└── 📄 utils.ts                       # General utility functions
```

## 🖼️ Public Assets

```
public/
├── 📁 branding/                     # Brand assets
│   ├── 📄 favicon.ico               # Application icon
│   └── 📄 logo.png                  # Logo images
├── 📄 favicon.ico                   # Default favicon
├── 📄 placeholder-logo.png          # Placeholder graphics
└── 📄 placeholder-logo.svg          # Vector graphics
```

## 🎨 Styles Directory

```
styles/
├── 📄 aries-widgets.css             # AriesMods widget styles
├── 📄 globals.css                   # Global application styles
└── 📄 grid-optimizations.css        # ✅ Performance-optimized grid styles
```

## 🔧 Scripts and Configuration

```
scripts/
└── 📄 dev.js                        # Development coordination script

Configuration Files:
├── 📄 .eslintrc.json                # ESLint configuration
├── 📄 .gitignore                    # Git ignore patterns
├── 📄 next.config.mjs               # Next.js configuration
├── 📄 package.json                  # Dependencies and scripts
├── 📄 postcss.config.mjs            # PostCSS configuration
├── 📄 tailwind.config.ts            # Tailwind CSS configuration
└── 📄 tsconfig.json                 # TypeScript configuration
```

## 📝 Type Definitions

```
types/
├── 📄 ariesmods.ts                  # ✅ AriesMods type definitions
└── 📄 comms.ts                      # Hardware communication types
```

## 🖥️ Electron Integration

```
electron/
└── 📄 main.js                       # ✅ Enhanced Electron main process
```

## 📖 Documentation Files

```
Documentation:
├── 📄 ARIESMODS_DEVELOPMENT_GUIDE.md # ✅ Updated AriesMods development guide
├── 📄 AUTO_NEURAL_LOCATION_UPDATE.md # AI location update system
├── 📄 AUTO_NEURAL_MESSAGE_ENHANCEMENT.md # AI message enhancement
├── 📄 DOCUMENTATION.md              # ✅ Main documentation (updated)
├── 📄 PROJECT_STRUCTURE.md          # ✅ This file
├── 📄 README.md                     # Project overview
└── 📄 UI_COMPONENTS_GUIDE.md        # UI component integration guide
```

## 🚀 Performance Optimizations (v3.1)

### ✅ Completed Optimizations

1. **Hardware Acceleration**:
   - All widgets use `translate3d()` for GPU layers
   - `willChange` property for optimized transforms
   - Hardware-accelerated grid system

2. **RequestAnimationFrame**:
   - All animations use RAF for 60fps
   - Optimized dragging with 500fps capability
   - Smooth zooming and panning

3. **Virtual Rendering**:
   - Viewport culling for large widget counts
   - Performance monitoring and metrics
   - Optimized component updates

4. **Code Optimization**:
   - `main-content.tsx` reduced from 2127 to ~400 lines
   - Enhanced component architecture
   - Improved state management

### 🎯 Key Performance Features

- **Ultra-smooth dragging**: 2ms throttling, RAF-based updates
- **Hardware acceleration**: GPU-optimized transforms
- **Virtual grid**: Viewport culling for performance
- **Optimized animations**: Reduced stiffness, better performance
- **Enhanced widgets**: All widgets performance-optimized

## 🔧 Development Workflow

### Starting Development
```bash
# Start development server
npm run dev

# Start Electron development
npm run electron-dev

# Build for production
npm run build-electron
```

### Key Development Files
- `components/main-content.tsx` - Core grid system
- `components/floating-toolbar-merged.tsx` - Unified toolbar
- `ariesMods/` - Plugin development
- `hooks/` - Custom functionality
- `components/grid/` - Grid system components

### Performance Monitoring
- Debug panel available (Ctrl+D)
- Performance metrics in status bar
- Virtual rendering statistics
- Hardware acceleration indicators

## 📁 File Organization Principles

1. **Feature-based organization**: Components grouped by functionality
2. **Performance-first**: Optimized components clearly marked
3. **Hardware integration**: Dedicated hardware components
4. **Plugin architecture**: AriesMods system for extensibility
5. **Type safety**: Comprehensive TypeScript definitions

## 🗂️ Deprecated/Legacy Files

### ⚠️ Files to Remove/Update
- `components/widgets/hardware-accelerated-widget.tsx` - Use `GridWidget` instead
- Old performance hooks - Integrated into main system
- Legacy grid components - Replaced with optimized versions

### 🔄 Migration Notes
- All widgets now use `GridWidget` for hardware acceleration
- Stream configuration moved to built-in configurator
- Performance hooks integrated into main components

---

## 🚀 Next Steps

1. **Complete hardware integration** - Connect to Comms StreamHandler
2. **Add more AriesMods** - Expand plugin library
3. **Performance testing** - Stress test with many widgets
4. **Documentation updates** - Keep guides current
5. **File cleanup** - Remove deprecated components

**AriesUI v3.1 provides a clean, organized, and performance-optimized codebase ready for production deployment!** 🎯 