const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron')
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
    icon: path.join(__dirname, '../public/branding/Comms.ico'), // Use Comms logo
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
    ? (process.env.NEXT_DEV_URL || 'http://localhost:3002')
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
      'http://localhost:3002'
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
    label: 'File',
    submenu: [
      {
        label: 'New Project',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          mainWindow.webContents.send('file-new-project')
        }
      },
      {
        label: 'Open Project...',
        accelerator: 'CmdOrCtrl+O',
        click: () => {
          mainWindow.webContents.send('file-open-project')
        }
      },
      {
        label: 'Save Project',
        accelerator: 'CmdOrCtrl+S',
        click: () => {
          mainWindow.webContents.send('file-save-project')
        }
      },
      {
        label: 'Save Project As...',
        accelerator: 'CmdOrCtrl+Shift+S',
        click: () => {
          mainWindow.webContents.send('file-save-project-as')
        }
      },
      { type: 'separator' },
      {
        label: 'Import Configuration...',
        click: () => {
          mainWindow.webContents.send('file-import-config')
        }
      },
      {
        label: 'Export Configuration...',
        click: () => {
          mainWindow.webContents.send('file-export-config')
        }
      },
      { type: 'separator' },
      {
        label: 'Recent Projects',
        submenu: [
          {
            label: 'Clear Recent',
            click: () => {
              mainWindow.webContents.send('file-clear-recent')
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Preferences',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          mainWindow.webContents.send('open-preferences')
        }
      },
      { type: 'separator' },
      {
        label: process.platform === 'darwin' ? 'Quit AriesUI' : 'Exit',
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
      { 
        role: 'undo',
        accelerator: 'CmdOrCtrl+Z'
      },
      { 
        role: 'redo',
        accelerator: process.platform === 'darwin' ? 'Cmd+Shift+Z' : 'Ctrl+Y'
      },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectall' },
      { type: 'separator' },
      {
        label: 'Find',
        accelerator: 'CmdOrCtrl+F',
        click: () => {
          mainWindow.webContents.send('edit-find')
        }
      },
      {
        label: 'Find and Replace',
        accelerator: 'CmdOrCtrl+H',
        click: () => {
          mainWindow.webContents.send('edit-find-replace')
        }
      },
      { type: 'separator' },
      {
        label: 'Clear All Widgets',
        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'warning',
            title: 'Clear All Widgets',
            message: 'Are you sure you want to clear all widgets?',
            detail: 'This action cannot be undone.',
            buttons: ['Cancel', 'Clear All'],
            defaultId: 0,
            cancelId: 0
          }).then((result) => {
            if (result.response === 1) {
              mainWindow.webContents.send('edit-clear-all-widgets')
            }
          })
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      { 
        role: 'reload',
        accelerator: 'CmdOrCtrl+R'
      },
      { 
        role: 'forceReload',
        accelerator: 'CmdOrCtrl+Shift+R'
      },
      { 
        role: 'toggleDevTools',
        accelerator: 'F12'
      },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      {
        label: 'Toggle Sidebar',
        accelerator: 'CmdOrCtrl+B',
        click: () => {
          mainWindow.webContents.send('view-toggle-sidebar')
        }
      },
      {
        label: 'Toggle Widget Palette',
        accelerator: 'CmdOrCtrl+P',
        click: () => {
          mainWindow.webContents.send('view-toggle-palette')
        }
      },
      {
        label: 'Toggle Debug Panel',
        accelerator: 'CmdOrCtrl+D',
        click: () => {
          mainWindow.webContents.send('view-toggle-debug')
        }
      },
      {
        label: 'Toggle Status Bar',
        click: () => {
          mainWindow.webContents.send('view-toggle-status-bar')
        }
      },
      { type: 'separator' },
      {
        label: 'Grid Options',
        submenu: [
          {
            label: 'Show Grid',
            type: 'checkbox',
            checked: true,
            click: () => {
              mainWindow.webContents.send('view-toggle-grid')
            }
          },
          {
            label: 'Snap to Grid',
            type: 'checkbox',
            checked: true,
            click: () => {
              mainWindow.webContents.send('view-toggle-snap')
            }
          },
          { type: 'separator' },
          {
            label: 'Grid Size: 20px',
            click: () => {
              mainWindow.webContents.send('view-set-grid-size', 20)
            }
          },
          {
            label: 'Grid Size: 40px',
            click: () => {
              mainWindow.webContents.send('view-set-grid-size', 40)
            }
          },
          {
            label: 'Grid Size: 60px',
            click: () => {
              mainWindow.webContents.send('view-set-grid-size', 60)
            }
          }
        ]
      },
      {
        label: 'Zoom',
        submenu: [
          {
            label: 'Fit to Window',
            accelerator: 'CmdOrCtrl+0',
            click: () => {
              mainWindow.webContents.send('view-fit-to-window')
            }
          },
          {
            label: 'Actual Size',
            accelerator: 'CmdOrCtrl+1',
            click: () => {
              mainWindow.webContents.send('view-actual-size')
            }
          },
          { type: 'separator' },
          {
            label: '25%',
            click: () => {
              mainWindow.webContents.send('view-set-zoom', 0.25)
            }
          },
          {
            label: '50%',
            click: () => {
              mainWindow.webContents.send('view-set-zoom', 0.5)
            }
          },
          {
            label: '75%',
            click: () => {
              mainWindow.webContents.send('view-set-zoom', 0.75)
            }
          },
          {
            label: '100%',
            click: () => {
              mainWindow.webContents.send('view-set-zoom', 1.0)
            }
          },
          {
            label: '150%',
            click: () => {
              mainWindow.webContents.send('view-set-zoom', 1.5)
            }
          },
          {
            label: '200%',
            click: () => {
              mainWindow.webContents.send('view-set-zoom', 2.0)
            }
          }
        ]
      },
      { type: 'separator' },
      { 
        role: 'togglefullscreen',
        accelerator: 'F11'
      }
    ]
  },
  {
    label: 'Hardware',
    submenu: [
      {
        label: 'Connection Status',
        accelerator: 'CmdOrCtrl+Shift+C',
        click: () => {
          mainWindow.webContents.send('hardware-connection-status')
        }
      },
      {
        label: 'Refresh All Modules',
        accelerator: 'CmdOrCtrl+Shift+R',
        click: () => {
          mainWindow.webContents.send('hardware-refresh-modules')
        }
      },
      { type: 'separator' },
      {
        label: 'StreamHandler',
        submenu: [
          {
            label: 'Connect to StreamHandler',
            click: () => {
              mainWindow.webContents.send('hardware-connect-streamhandler')
            }
          },
          {
            label: 'Disconnect StreamHandler',
            click: () => {
              mainWindow.webContents.send('hardware-disconnect-streamhandler')
            }
          },
          {
            label: 'StreamHandler Status',
            click: () => {
              mainWindow.webContents.send('hardware-streamhandler-status')
            }
          }
        ]
      },
      {
        label: 'Engine',
        submenu: [
          {
            label: 'Engine Status',
            click: () => {
              mainWindow.webContents.send('hardware-engine-status')
            }
          },
          {
            label: 'Reload DynamicModules',
            click: () => {
              mainWindow.webContents.send('hardware-reload-modules')
            }
          },
          {
            label: 'Module Configuration',
            click: () => {
              mainWindow.webContents.send('hardware-module-config')
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Hardware Configuration',
        click: () => {
          mainWindow.webContents.send('hardware-open-config')
        }
      },
      {
        label: 'Stream Configuration',
        click: () => {
          mainWindow.webContents.send('hardware-stream-config')
        }
      },
      { type: 'separator' },
      {
        label: 'Hardware Diagnostics',
        click: () => {
          mainWindow.webContents.send('hardware-diagnostics')
        }
      },
      {
        label: 'Export Hardware Logs',
        click: () => {
          mainWindow.webContents.send('hardware-export-logs')
        }
      }
    ]
  },
  {
    label: 'Tools',
    submenu: [
      {
        label: 'AriesMods Marketplace',
        accelerator: 'CmdOrCtrl+M',
        click: () => {
          mainWindow.webContents.send('tools-ariesmods-marketplace')
        }
      },
      {
        label: 'Widget Inspector',
        accelerator: 'CmdOrCtrl+I',
        click: () => {
          mainWindow.webContents.send('tools-widget-inspector')
        }
      },
      { type: 'separator' },
      {
        label: 'Performance Monitor',
        click: () => {
          mainWindow.webContents.send('tools-performance-monitor')
        }
      },
      {
        label: 'Memory Usage',
        click: () => {
          mainWindow.webContents.send('tools-memory-usage')
        }
      },
      { type: 'separator' },
      {
        label: 'Terminal',
        accelerator: 'CmdOrCtrl+`',
        click: () => {
          mainWindow.webContents.send('tools-terminal')
        }
      },
      {
        label: 'Command Palette',
        accelerator: 'CmdOrCtrl+Shift+P',
        click: () => {
          mainWindow.webContents.send('tools-command-palette')
        }
      }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' },
      { type: 'separator' },
      {
        label: 'Bring All to Front',
        click: () => {
          const windows = BrowserWindow.getAllWindows()
          windows.forEach(win => win.show())
        }
      },
      { type: 'separator' },
      {
        label: 'New Window',
        accelerator: 'CmdOrCtrl+Shift+N',
        click: () => {
          createWindow()
        }
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Getting Started',
        click: () => {
          mainWindow.webContents.send('help-getting-started')
        }
      },
      {
        label: 'User Guide',
        click: () => {
          shell.openExternal('https://github.com/AryanRai/Comms/wiki')
        }
      },
      {
        label: 'Keyboard Shortcuts',
        accelerator: 'CmdOrCtrl+/',
        click: () => {
          mainWindow.webContents.send('help-keyboard-shortcuts')
        }
      },
      { type: 'separator' },
      {
        label: 'AriesMods Development Guide',
        click: () => {
          mainWindow.webContents.send('help-ariesmods-guide')
        }
      },
      {
        label: 'Hardware Integration Guide',
        click: () => {
          mainWindow.webContents.send('help-hardware-guide')
        }
      },
      { type: 'separator' },
      {
        label: 'Report Issue',
        click: () => {
          shell.openExternal('https://github.com/AryanRai/Comms/issues/new')
        }
      },
      {
        label: 'Feature Request',
        click: () => {
          shell.openExternal('https://github.com/AryanRai/Comms/issues/new?template=feature_request.md')
        }
      },
      { type: 'separator' },
      {
        label: 'Check for Updates',
        click: () => {
          if (autoUpdater) {
            autoUpdater.checkForUpdatesAndNotify()
          } else {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Updates',
              message: 'Auto-updater not available in development mode.',
              detail: 'Please build the application for production to enable auto-updates.'
            })
          }
        }
      },
      {
        label: 'About AriesUI',
        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About AriesUI',
            message: 'AriesUI v3 - Comms Integration',
            detail: 'Modern React frontend for hardware control and monitoring via Comms v3 backend.\n\nBuilt with Next.js, Electron, and TailwindCSS.\nDeveloped by Aryan Rai.\n\nFor more information, visit: https://github.com/AryanRai/Comms'
          })
        }
      }
    ]
  }
]

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow()
  
  // Set up menu
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  // Window state management IPC handlers
  ipcMain.handle('get-window-state', () => {
    if (mainWindow) {
      return {
        isFullScreen: mainWindow.isFullScreen(),
        isMaximized: mainWindow.isMaximized(),
        isMinimized: mainWindow.isMinimized(),
        bounds: mainWindow.getBounds()
      }
    }
    return null
  })

  ipcMain.on('toggle-fullscreen', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
    }
  })

  ipcMain.on('toggle-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  })

  ipcMain.on('minimize-window', () => {
    if (mainWindow) {
      mainWindow.minimize()
    }
  })

  ipcMain.on('restore-window', () => {
    if (mainWindow) {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false)
      }
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      }
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
    }
  })

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