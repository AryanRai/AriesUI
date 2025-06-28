# AriesUI v3 - Electron Desktop App Setup

## 🚀 Quick Start

### Development Mode
```bash
# Start both Next.js and Electron together
npm run electron-dev
```
This will:
1. Start the Next.js development server on http://localhost:3000
2. Wait for the server to be ready
3. Launch the Electron desktop application
4. Enable hot reload for both web and desktop versions

### Production Build
```bash
# Build desktop installer for distribution
npm run build-electron
```
The installer will be created in the `/dist` folder.

## 📁 Project Structure

```
AriesUI/
├── electron/
│   └── main.js          # Electron main process
├── scripts/
│   └── dev.js           # Development launcher script
├── out/                 # Built Next.js static files (after npm run export)
├── dist/                # Built desktop installers (after npm run build-electron)
└── package.json         # Updated with Electron scripts and config
```

## 🎛️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Web version only (Next.js dev server) |
| `npm run electron-dev` | **Recommended** - Desktop app with hot reload |
| `npm run electron` | Desktop app only (requires build first) |
| `npm run build-electron` | Build desktop installer |
| `npm run export` | Export Next.js to static files |

## 🖥️ Desktop Features

### Menu Bar
- **AriesUI Menu**: About, Preferences, Quit
- **Edit Menu**: Standard copy/paste/undo
- **View Menu**: Zoom, DevTools, Fullscreen  
- **Hardware Menu**: Connection status, Refresh modules, Hardware config
- **Window Menu**: Minimize, Close

### Security Features
- Context isolation enabled
- Node integration disabled  
- External links open in system browser
- Secure defaults for production

### Platform Support
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG disk image (.dmg) 
- **Linux**: AppImage (.AppImage)

## 🔧 Configuration

### Window Settings
- Default size: 1400x900px
- Minimum size: 1000x700px
- Icon: Uses `public/placeholder-logo.png`
- Resizable and has standard window controls

### Build Settings
- App ID: `com.insposoftware.ariesui`
- Product Name: `AriesUI v3`
- Output directory: `dist/`
- Auto-updater enabled for production

## 🐛 Troubleshooting

### Common Issues

**1. Electron won't start / "Cannot find module 'electron-updater'"**
```bash
# Make sure all dependencies are installed (including electron-updater)
npm install --legacy-peer-deps

# If you get electron-updater errors, install it separately:
npm install --save-dev electron-updater --legacy-peer-deps

# Try running components separately
npm run dev          # Test Next.js first
npm run electron     # Then test Electron (after building)
```

**2. Windows "spawn npx ENOENT" error**
This has been fixed automatically! The development script now:
- Uses `npx.cmd` on Windows instead of `npx`
- Includes fallback to direct electron executable
- Uses shell mode for better Windows compatibility

**3. Hot reload not working**
- The web version (`http://localhost:3000` or `3001`) should reload automatically
- The desktop app will need to be refreshed manually (Cmd/Ctrl+R)
- The dev script automatically detects which port Next.js is using (3000, 3001, etc.)

**4. Next.js starts on different port**
- This is automatically handled! The dev script detects ports 3000-3003
- Electron will connect to whichever port Next.js actually uses
- You'll see a message like "✅ Next.js server is ready on port 3001"

**5. Build fails**
```bash
# Clear cache and rebuild
rm -rf out/ dist/ .next/
npm run build
npm run export
npm run build-electron
```

## 🔄 Development Workflow

1. **Daily Development**: Use `npm run electron-dev`
2. **Web Testing**: Use `npm run dev` 
3. **Build Testing**: Use `npm run build-electron`
4. **Distribution**: Upload from `dist/` folder

## 🚢 Deployment

The desktop app can be distributed by:
1. Building with `npm run build-electron`
2. Uploading the installer from `/dist` to your distribution platform
3. Users download and install the native application
4. Auto-updater will handle future updates (in production)

---

Your AriesUI is now a full desktop application that works alongside your existing web interface! 🎉 