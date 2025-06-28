const { app, BrowserWindow, Menu, shell, dialog } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

// Only require auto-updater in production
let autoUpdater = null
if (!isDev) {
  try {
    autoUpdater = require('electron-updater').autoUpdater
  } catch (err) {
    console.log('Auto-updater not available:', err.message)
  }
}

// Keep a global reference of the window object
let mainWindow

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false, // Don't show until ready
    icon: path.join(__dirname, '../public/placeholder-logo.png'), // Use your logo
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      // Allow loading local files in development
      webSecurity: !isDev
    },
    titleBarStyle: 'default',
    frame: true,
    titleBarOverlay: false
  })

  // Load the app
  const startUrl = isDev 
    ? (process.env.NEXT_DEV_URL || 'http://localhost:3000')
    : `file://${path.join(__dirname, '../out/index.html')}`
  
  mainWindow.loadURL(startUrl)

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // Focus on window creation
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Handle navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    const allowedOrigins = [
      new URL(startUrl).origin,
      'http://localhost:3000',
      'http://localhost:3001'
    ]
    
    if (!allowedOrigins.includes(parsedUrl.origin)) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
}

// Create menu template
const menuTemplate = [
  {
    label: 'AriesUI',
    submenu: [
      {
        label: 'About AriesUI',
        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About AriesUI',
            message: 'AriesUI v3 - Comms Integration',
            detail: 'Modern React frontend for hardware control and monitoring via Comms v3 backend.'
          })
        }
      },
      { type: 'separator' },
      {
        label: 'Preferences',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          // Send message to renderer to open preferences
          mainWindow.webContents.send('open-preferences')
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit()
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectall' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Hardware',
    submenu: [
      {
        label: 'Connection Status',
        click: () => {
          mainWindow.webContents.send('show-connection-status')
        }
      },
      {
        label: 'Refresh Modules',
        click: () => {
          mainWindow.webContents.send('refresh-hardware-modules')
        }
      },
      { type: 'separator' },
      {
        label: 'Hardware Configuration',
        click: () => {
          mainWindow.webContents.send('open-hardware-config')
        }
      }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  }
]

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow()
  
  // Set up menu
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  // Handle app activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  // Auto-updater setup (for production)
  if (!isDev && autoUpdater) {
    autoUpdater.checkForUpdatesAndNotify()
  }
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // In development, ignore certificate errors
    event.preventDefault()
    callback(true)
  } else {
    // In production, use default behavior
    callback(false)
  }
})

// Auto-updater events (only if autoUpdater is available)
if (autoUpdater) {
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version of AriesUI is available. It will be downloaded in the background.',
      buttons: ['OK']
    })
  })

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  })
} 