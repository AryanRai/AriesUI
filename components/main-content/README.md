# MainContent Module Refactoring

## Overview

The original `main-content.tsx` file was a monolithic component with over 1700 lines of code that handled multiple responsibilities. This module breaks it down into focused, maintainable components.

## Architecture

### Before Refactoring
```
main-content.tsx (1700+ lines)
├── State management
├── Performance optimizations  
├── Event handling
├── Grid rendering
├── Auto-save functionality
├── Undo/redo system
├── Viewport management
├── Hardware integration
└── UI rendering
```

### After Refactoring
```
components/main-content/
├── MainContent.tsx           # Main orchestrator (< 200 lines)
├── StateManager.tsx          # State management & auto-save
├── PerformanceManager.tsx    # Performance optimizations
├── EventHandlers.tsx         # Mouse/keyboard events
├── types.ts                  # TypeScript definitions
├── index.ts                  # Module exports
└── README.md                 # This documentation
```

## Components

### 1. MainContent.tsx
**Purpose**: Main orchestrator component that composes all other modules.

**Responsibilities**:
- Wraps components in proper order (StateManager → PerformanceManager → EventHandlers)
- Provides container references
- Renders debug panels and toolbars
- Minimal logic, maximum composition

**Size**: ~200 lines (reduced from 1700+)

### 2. StateManager.tsx
**Purpose**: Centralized state management and persistence.

**Responsibilities**:
- Viewport state (zoom, pan, position)
- Drag/resize/drop states
- Auto-save configuration and execution
- Undo/redo history management
- localStorage persistence
- Profile management integration

**Key Features**:
- Auto-save with retry logic
- State history for undo/redo
- Local storage quota checking
- Error handling and recovery

### 3. PerformanceManager.tsx
**Purpose**: Performance optimizations and virtual rendering.

**Responsibilities**:
- Virtual grid calculations (viewport culling)
- Hardware acceleration status
- Batched widget updates (60fps)
- Performance metrics tracking
- RequestAnimationFrame optimization

**Key Features**:
- Virtual rendering with 300px buffer
- Exponential moving average for frame time
- Batched updates every 16ms
- Hardware acceleration indicators

### 4. EventHandlers.tsx
**Purpose**: All mouse and keyboard event handling.

**Responsibilities**:
- Mouse down/up/move events
- Drag and drop logic
- Resize handle management
- Wheel events (zoom/pan)
- Keyboard shortcuts
- Touch/gesture support

**Key Features**:
- Ultra-responsive dragging (2ms throttling)
- Hardware-accelerated movement with RAF
- Smart interactive element detection
- Auto-snap to grid on release

### 5. types.ts
**Purpose**: TypeScript type definitions for the module.

**Includes**:
- All interface definitions
- State type definitions
- Event handler types
- Configuration interfaces
- Re-exported grid types

## Usage

### Basic Usage
```tsx
import { MainContent } from '@/components/main-content'

function Dashboard() {
  const [gridState, setGridState] = useState(initialGridState)
  
  return (
    <MainContent 
      gridState={gridState} 
      setGridState={setGridState} 
    />
  )
}
```

### Using Individual Components
```tsx
import { 
  StateManager, 
  PerformanceManager, 
  EventHandlers 
} from '@/components/main-content'

// Use components individually for custom layouts
function CustomGrid() {
  return (
    <StateManager gridState={gridState} setGridState={setGridState}>
      <PerformanceManager {...performanceProps}>
        <EventHandlers {...eventProps}>
          <CustomGridContent />
        </EventHandlers>
      </PerformanceManager>
    </StateManager>
  )
}
```

### Accessing Context
```tsx
import { useStateContext, usePerformanceContext } from '@/components/main-content'

function CustomComponent() {
  const stateContext = useStateContext()
  const performanceContext = usePerformanceContext()
  
  // Access state and performance utilities
  const { viewport, dragState, saveGridState } = stateContext
  const { virtualGrid, batchWidgetUpdate } = performanceContext
  
  return <div>Custom component with context access</div>
}
```

## Benefits of Refactoring

### 1. Maintainability
- **Single Responsibility**: Each component has one clear purpose
- **Focused Files**: Easier to understand and modify individual features
- **Clear Dependencies**: Explicit component relationships

### 2. Testability
- **Unit Testing**: Each component can be tested in isolation
- **Mock Dependencies**: Easy to mock individual modules
- **Focused Tests**: Test specific functionality without side effects

### 3. Reusability
- **Modular Components**: Use individual pieces in other contexts
- **Composition**: Mix and match components for different layouts
- **Context Hooks**: Access functionality from anywhere in the tree

### 4. Performance
- **Lazy Loading**: Components can be loaded on demand
- **Code Splitting**: Smaller bundle sizes
- **Optimized Updates**: Focused re-renders

### 5. Developer Experience
- **Better IntelliSense**: Smaller files with focused types
- **Easier Debugging**: Isolated component logic
- **Clearer Git History**: Changes affect specific modules

## Migration Guide

### From Original main-content.tsx
1. **Import Change**:
   ```tsx
   // Before
   import { MainContent } from '@/components/main-content'
   
   // After (no change needed)
   import { MainContent } from '@/components/main-content'
   ```

2. **Props Remain the Same**:
   ```tsx
   // Interface unchanged
   <MainContent gridState={gridState} setGridState={setGridState} />
   ```

3. **Context Access**:
   ```tsx
   // Before: Direct state access
   const [viewport, setViewport] = useState(...)
   
   // After: Context hook
   const { viewport, setViewport } = useStateContext()
   ```

### Custom Event Handlers
If you had custom event handlers, move them to EventHandlers.tsx or create a custom EventHandlers component.

### Custom Performance Logic
Performance optimizations should be added to PerformanceManager.tsx or use the performance context.

## File Structure
```
components/main-content/
├── MainContent.tsx           # 📦 Main orchestrator
├── StateManager.tsx          # 🗃️ State & persistence  
├── PerformanceManager.tsx    # ⚡ Performance & virtual grid
├── EventHandlers.tsx         # 🖱️ Events & interactions
├── types.ts                  # 📝 TypeScript definitions
├── index.ts                  # 📤 Module exports
└── README.md                 # 📚 Documentation
```

## Performance Metrics

### Before Refactoring
- **File Size**: 1700+ lines
- **Responsibilities**: 8+ major areas
- **Complexity**: High cognitive load
- **Maintainability**: Difficult to modify

### After Refactoring
- **Main File**: ~200 lines (88% reduction)
- **Total Lines**: ~1500 lines (distributed across modules)
- **Responsibilities**: 1 per component
- **Complexity**: Low cognitive load per file
- **Maintainability**: Easy to modify individual features

## Future Enhancements

### Planned Improvements
1. **Toolbar Manager**: Extract toolbar positioning logic
2. **Viewport Manager**: Dedicated zoom/pan management
3. **Hardware Manager**: Hardware integration logic
4. **Animation Manager**: Animation and transition management

### Extension Points
- **Custom Event Handlers**: Extend EventHandlers for specific needs
- **Performance Plugins**: Add custom performance optimizations
- **State Middleware**: Add custom state management logic
- **Context Providers**: Additional context for specific features

---

**This refactoring provides a solid foundation for maintainable, testable, and performant grid functionality while preserving all existing features and performance optimizations.** 🚀 