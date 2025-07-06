# AriesUI v3.0 - Performance-Optimized Hardware Dashboard

[![Version](https://img.shields.io/badge/Version-v3.0-blue)](https://github.com/AryanRai/AriesUI)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org)
[![Electron](https://img.shields.io/badge/Electron-Ready-purple)](https://electronjs.org)

> **A high-performance, hardware-integrated dashboard system for real-time data visualization and control.**

AriesUI is the frontend component of the Comms v3.0 ecosystem, providing a drag-and-drop widget dashboard with seamless hardware integration, real-time data streaming, and professional-grade performance optimizations.

![AriesUI Dashboard](https://github.com/user-attachments/assets/02e70432-e6f7-4664-9f17-b6b0acd60a67)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **Python 3.8+** (for backend integration)

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/AryanRai/AriesUI.git
cd AriesUI

# Install dependencies
npm install

# Start development server
npm run dev

# Or run as Electron desktop app
npm run electron-dev
```

### Production Build
```bash
# Build for web
npm run build

# Build Electron desktop app
npm run build-electron
```

---

## ✨ Key Features

### 🎯 **Performance Optimized**
- **Hardware Acceleration**: GPU-optimized with `translate3d()` transforms
- **60fps Rendering**: RequestAnimationFrame-based smooth interactions
- **Virtual Grid**: Viewport culling for thousands of widgets
- **Lazy Loading**: Progressive widget loading for optimal performance

### 🔧 **Hardware Integration Ready**
- **Real-time Streams**: WebSocket integration with Comms backend
- **Multi-Stream Widgets**: Connect multiple sensors to single displays  
- **Stream Configurator**: Built-in interface for hardware setup
- **Two-way Communication**: Control hardware devices from the dashboard

### 🎨 **Modern UI/UX**
- **Drag & Drop**: Smooth widget positioning with collision detection
- **Nested Containers**: Organize widgets in resizable containers
- **Dark/Light Themes**: Professional theming with custom color schemes
- **Responsive Design**: Works on desktop, tablet, and mobile

### 🧩 **Extensible Plugin System (AriesMods)**
- **Widget Marketplace**: Install community-created widgets
- **Custom Development**: Create your own sensors, controls, and visualizations
- **Dependency Management**: Automatic handling of external libraries
- **Hot Reload**: Instant plugin development feedback

---

## 🏗️ Architecture Overview

### Core Components
```
📁 AriesUI Structure
├── 🎯 Main Dashboard        # Drag-and-drop widget grid
├── 🔧 Widget System         # Modular AriesMods plugins
├── 📡 Hardware Integration  # Real-time data streaming
├── ⚡ Performance Layer     # Hardware acceleration & optimization
└── 🎨 Theme System         # Dark/light modes & custom colors
```

### AriesMods Plugin Categories
- **🌡️ Sensors**: Temperature, pressure, voltage displays
- **🎛️ Controls**: Toggles, sliders, buttons for hardware control  
- **📊 Visualization**: Charts, graphs, 3D visualizations
- **🔧 Utility**: Clocks, calculators, system monitors

---

## 📚 Documentation

### Essential Guides
- **[📖 Full Documentation](DOCUMENTATION.md)** - Complete implementation guide
- **[🧩 AriesMods Development](ARIESMODS_DEVELOPMENT_GUIDE.md)** - Create custom widgets
- **[⚡ Hardware Integration](HARDWARE_INTEGRATION_GUIDE.md)** - Connect to hardware
- **[🏗️ Project Structure](PROJECT_STRUCTURE.md)** - Codebase architecture

### Quick References
- **[🎨 UI Components Guide](UI_COMPONENTS_GUIDE.md)** - Available UI components
- **[🔌 API Reference](docs/api/)** - Component APIs and hooks
- **[⚙️ Configuration](docs/config/)** - Setup and configuration options

---

## 🔗 Integration with Comms Backend

AriesUI seamlessly integrates with the **Comms v3.0** ecosystem:

```bash
# Start Comms backend components
python HyperThreader.py          # Process manager
python insposoftware/sh/sh.py   # Stream handler  
python insposoftware/en/en.py   # Hardware engine

# Start AriesUI frontend
npm run electron-dev             # Desktop app
# OR
npm run dev                      # Web version
```

### Stream Integration Example
```typescript
// Connect widget to hardware stream
const { value, status, metadata } = useCommsStream('module1.temperature')

// Configure stream mapping
const streamMapping = {
  streamId: 'module1.temperature',
  multiplier: 1.8,
  offset: 32,           // Celsius to Fahrenheit
  unit: '°F',
  precision: 1
}
```

---

## 🛠️ Development

### Creating Custom AriesMods
```typescript
// Basic AriesMod widget template
import { AriesModProps } from '@/types/ariesmods'

const CustomSensor: React.FC<AriesModProps> = ({ 
  id, title, data, config, onConfigChange 
}) => {
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {data?.value || '--'} {config?.unit || ''}
        </div>
      </CardContent>
    </Card>
  )
}

export default CustomSensor
```

### Performance Hooks
```typescript
// Hardware-accelerated dragging
const { isDragging, position } = usePerformanceDrag({
  onDragStart: handleDragStart,
  onDragEnd: handleDragEnd,
  useGPU: true
})

// Virtual grid for large datasets  
const virtualGrid = useVirtualGrid({
  itemCount: widgets.length,
  viewportSize: containerSize,
  bufferSize: 200
})
```

---

## 📊 Performance Metrics

### Optimization Results
- **Main Content**: 2,719 lines → ~400 lines (modular refactor)
- **Frame Rate**: Consistent 60fps during interactions
- **Memory Usage**: 50% reduction with virtual rendering
- **Load Time**: Lazy loading reduces initial bundle size
- **GPU Utilization**: Hardware acceleration for all transforms

### Browser Support
- ✅ **Chrome** 88+ (Recommended)
- ✅ **Firefox** 85+
- ✅ **Safari** 14+  
- ✅ **Edge** 88+
- ⚡ **Electron** (Desktop)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTE.md) for details.

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-widget`
3. **Develop** your changes with tests
4. **Submit** a pull request

### Code Standards
- **TypeScript** for type safety
- **ESLint** + **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Component Tests** with Jest + Testing Library

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🆘 Support & Community

- **📧 Email**: [aryanrai170@gmail.com](mailto:aryanrai170@gmail.com)
- **🐛 Issues**: [GitHub Issues](https://github.com/AryanRai/AriesUI/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/AryanRai/AriesUI/discussions)
- **📖 Wiki**: [Project Wiki](https://github.com/AryanRai/AriesUI/wiki)

---

**Built with ❤️ for the hardware development community**