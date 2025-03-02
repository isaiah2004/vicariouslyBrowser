import { ElectronAPI } from '@electron-toolkit/preload'
import { IpcRenderer } from 'electron'

declare global {
  interface Window {
    electron: ElectronAPI & {
      ipcRenderer: IpcRenderer
      desktopCapturer: {
        getSources: (opts: {
          types: string[]
          thumbnailSize?: { width: number; height: number }
        }) => Promise<{
          id: string
          name: string
          thumbnail: Electron.NativeImage
          display_id: string
          appIcon: Electron.NativeImage | null
        }[]>
      }
    }
    api: unknown
  }
}
