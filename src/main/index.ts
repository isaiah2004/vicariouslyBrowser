import { app, shell, BrowserWindow, ipcMain, desktopCapturer } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import './ephermal-key'
import './screenDescribe'
import './Control'
import 'dotenv'
import { configDotenv } from 'dotenv'

// Add this if you haven't set up environment variables yet
configDotenv()
// console.log(process.env.OPENAI_API_KEY)

ipcMain.handle('get-env-variable', (_event, variableName: string) => {
  return process.env[variableName]
})

// Add this handler
ipcMain.handle('toggle-grid-overlay', () => {
  const overlayWindow = BrowserWindow.getAllWindows().find(
    (win) => win.webContents.getURL() === 'http://localhost:5173/grid'
  )
  console.log('we are here')
  if (overlayWindow) {
    console.log('detected')
    overlayWindow.close()
    return
  }

  const window = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: false,
    title: 'grid-overlay', // Add title to identify this window
    webPreferences: {
      nodeIntegration: true
    }
  })

  window.setIgnoreMouseEvents(true)
  window.maximize()
  window.loadURL('http://localhost:5173/grid')
  // Auto-cleanup when window is closed
  window.on('closed', () => {
    // overlayWindow = null
    // Optional: Notify renderer that overlay was closed
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('grid-overlay-closed')
    })
  })
})

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: 'vicariously',
    width: 400,
    height: 400,
    show: false,
    frame: false, // Remove default frame
    transparent: true,
    titleBarStyle: 'hidden',
    backgroundColor: '#00000000',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
      webviewTag: true // Enable webview tag
    }
  })

  // Add permission handling for screen capture
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      if (permission === 'media') {
        callback(true)
      } else {
        callback(false)
      }
    }
  )
  shell.beep()
  // Handle desktop capture request from renderer
  ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', (_event, opts) => {
    return desktopCapturer.getSources(opts)
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  // Add these handlers after creating the window
  ipcMain.on('window-minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
      win.webContents.send('window-unmaximized')
    } else {
      win?.maximize()
      win?.webContents.send('window-maximized')
    }
  })

  ipcMain.on('window-close', () => {
    console.log('window-close')
    BrowserWindow.getFocusedWindow()?.close()
  })

  ipcMain.on('mode-os', () => {
    shell.beep()

    console.log('mode-os')
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
      win.setBounds({ width: 400, height: 400 })
      win.webContents.send('window-unmaximized')
    } else {
      // win?.maximize()
      if (win) {
        win.setBounds({ width: 400, height: 400 })
        win.webContents.send('window-unmaximized')
      }
    }
  })
  ipcMain.on('mode-internet', () => {
    shell.beep()
    console.log('mode-internet')

    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win?.setBounds({ width: 900, height: 700 })
    }
    if (win?.isMaximized()) {
      win.unmaximize()
      win.webContents.send('window-unmaximized')
    } else {
      if (win) {
        win.maximize()
        win.webContents.send('window-maximized')
      }
    }
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
