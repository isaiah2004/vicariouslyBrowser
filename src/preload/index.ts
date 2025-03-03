import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Add any custom APIs here
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    // Expose Electron APIs to the renderer process when context isolation is enabled
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI, // Spread all electron toolkit APIs
      ipcRenderer: {
        ...ipcRenderer,
        on: ipcRenderer.on.bind(ipcRenderer),
        send: ipcRenderer.send.bind(ipcRenderer),
        invoke: ipcRenderer.invoke.bind(ipcRenderer),
        removeAllListeners: ipcRenderer.removeAllListeners.bind(ipcRenderer)
      },
      desktopCapturer: {
        // Expose screen capture functionality
        getSources: (opts) => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', opts)
      },
      // Add this new method
      createWindow: () => ipcRenderer.invoke('create-browser-window')
    })
    // Expose custom APIs to the renderer process
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // When context isolation is disabled, directly attach APIs to window object
  // @ts-ignore (define in dts)
  window.electron = {
    ...electronAPI,
    ipcRenderer: {
      ...ipcRenderer,
      on: ipcRenderer.on.bind(ipcRenderer),
      send: ipcRenderer.send.bind(ipcRenderer),
      removeAllListeners: ipcRenderer.removeAllListeners.bind(ipcRenderer)
    },
    desktopCapturer: {
      // Type-safe implementation of screen capture API
      getSources: (
        options
      ): Promise<
        {
          id: string // Source identifier
          name: string // Display name
          thumbnail: Electron.NativeImage // Preview image
          display_id: string // Display identifier
          appIcon: Electron.NativeImage | null // Application icon if available
        }[]
      > => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', options)
    }
  }
  // @ts-ignore (define in dts)
  window.api = api
}
