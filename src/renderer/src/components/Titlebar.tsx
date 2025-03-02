import { useState, useEffect } from 'react'
import { useMode } from '../hooks/useMode'
import { SwitchCameraIcon } from 'lucide-react'

function Titlebar(): JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)
  const { isOsMode, toggleMode } = useMode()

  const handleToggleMode = (e: React.MouseEvent): void => {
    toggleMode()
    e.preventDefault()
    window.electron.ipcRenderer.send(`mode-${isOsMode ? 'internet' : 'os'}`)
  }

  const handleMinimize = (e: React.MouseEvent): void => {
    e.preventDefault()
    window.electron.ipcRenderer.send('window-minimize')
  }

  const handleMaximize = (e: React.MouseEvent): void => {
    e.preventDefault()
    window.electron.ipcRenderer.send('window-maximize')
  }

  const handleClose = (e: React.MouseEvent): void => {
    e.preventDefault()
    window.electron.ipcRenderer.send('window-close')
  }

  useEffect(() => {
    window.electron.ipcRenderer.on('window-maximized', () => setIsMaximized(true))
    window.electron.ipcRenderer.on('window-unmaximized', () => setIsMaximized(false))

    return (): void => {
      window.electron.ipcRenderer.removeAllListeners('window-maximized')
      window.electron.ipcRenderer.removeAllListeners('window-unmaximized')
    }
  }, [])

  return (
    <div className="titlebar">
      <div className="titlebar-drag-region"></div>
      <div className="window-title">Vicariously Beta</div>
      <div className="window-controls right">
        <div className="mode-toggle">
          <button
            type="button"
            className={`toggle-button ${isOsMode ? 'os-mode' : 'internet-mode'}`}
            onClick={handleToggleMode}
          >
            <div className="toggle-button-content">
              {isOsMode ? 'OS Mode' : 'Internet Mode'}
              <SwitchCameraIcon height={16} />
            </div>
          </button>
        </div>
      </div>
      <div className="window-controls right">
        <button type="button" className="window-control minimize" onClick={handleMinimize}>
          ─
        </button>
        <button type="button" className="window-control maximize" onClick={handleMaximize}>
          {isMaximized ? '❐' : '□'}
        </button>
        <button type="button" className="window-control close" onClick={handleClose}>
          ✕
        </button>
      </div>
    </div>
  )
}

export default Titlebar
