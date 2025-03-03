import { useEffect, useRef, useState } from 'react'

interface BrowserViewProps {
  url: string
  active: boolean
  tabId: string
  onTitleChange: (title: string) => void
  onUrlChange: (url: string) => void
  onFaviconChange: (favicon: string) => void
  onNavigationStateChange: (canGoBack: boolean, canGoForward: boolean) => void
}

export default function BrowserView({
  url,
  active,
  tabId,
  onTitleChange,
  onUrlChange,
  onFaviconChange,
  onNavigationStateChange
}: BrowserViewProps): JSX.Element {
  const webviewRef = useRef<Electron.WebviewTag>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const webview = webviewRef.current

    if (!webview) return

    const handleTitleChange = (): void => {
      onTitleChange(webview.getTitle())
    }

    const handleUrlChange = (): void => {
      const currentUrl = webview.getURL()
      onUrlChange(currentUrl)
      onNavigationStateChange(webview.canGoBack(), webview.canGoForward())
    }

    const handleDomReady = (): void => {
      // Update URL when DOM is ready
      handleUrlChange()
    }

    const handleLoadCommit = (event: Electron.LoadCommitEvent): void => {
      // Update URL when navigation commits
      if (event.isMainFrame) {
        handleUrlChange()
      }
    }

    const handleFaviconChange = (event: { favicons: string[] }): void => {
      const favicons: string[] = event.favicons
      if (favicons && favicons.length > 0) {
        onFaviconChange(favicons[0])
      }
    }

    const handleStartLoading = (): void => {
      setIsLoading(true)
      setError(null)
    }

    const handleStopLoading = (): void => {
      setIsLoading(false)
    }

    const handleLoadFail = (event: Electron.DidFailLoadEvent): void => {
      setIsLoading(false)
      // Only show error for main frame failures
      if (event.isMainFrame) {
        setError('Unable to connect. Please check your internet connection.')
      }
    }

    webview.addEventListener('page-title-updated', handleTitleChange)
    webview.addEventListener('did-navigate', handleUrlChange)
    webview.addEventListener('did-navigate-in-page', handleUrlChange)
    webview.addEventListener('did-frame-navigate', handleUrlChange)
    webview.addEventListener('load-commit', handleLoadCommit)
    webview.addEventListener('dom-ready', handleDomReady)
    webview.addEventListener('page-favicon-updated', handleFaviconChange)
    webview.addEventListener('did-start-loading', handleStartLoading)
    webview.addEventListener('did-stop-loading', handleStopLoading)
    webview.addEventListener('did-fail-load', handleLoadFail)

    return (): void => {
      webview.removeEventListener('page-title-updated', handleTitleChange)
      webview.removeEventListener('did-navigate', handleUrlChange)
      webview.removeEventListener('did-navigate-in-page', handleUrlChange)
      webview.removeEventListener('did-frame-navigate', handleUrlChange)
      webview.removeEventListener('load-commit', handleLoadCommit)
      webview.removeEventListener('dom-ready', handleDomReady)
      webview.removeEventListener('page-favicon-updated', handleFaviconChange)
      webview.removeEventListener('did-start-loading', handleStartLoading)
      webview.removeEventListener('did-stop-loading', handleStopLoading)
      webview.removeEventListener('did-fail-load', handleLoadFail)
    }
  }, [onTitleChange, onUrlChange, onFaviconChange, onNavigationStateChange])

  return (
    <div
      style={{
        display: active ? 'flex' : 'none',
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      <webview
        ref={webviewRef}
        data-id={tabId}
        src={url}
        style={{ width: '100%', height: '100%' }}
        // eslint-disable-next-line react/no-unknown-property
        webpreferences="contextIsolation=yes, nodeIntegration=no"
        // eslint-disable-next-line react/no-unknown-property
        partition="persist:browserview"
      />
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      {error && (
        <div className="error-overlay">
          <div className="error-message">{error}</div>
        </div>
      )}
    </div>
  )
}
