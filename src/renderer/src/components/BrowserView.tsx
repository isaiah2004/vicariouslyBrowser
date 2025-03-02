import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    const webview = webviewRef.current

    if (!webview) return

    const handleTitleChange = (): void => {
      onTitleChange(webview.getTitle())
    }

    const handleUrlChange = (): void => {
      onUrlChange(webview.getURL())
      onNavigationStateChange(webview.canGoBack(), webview.canGoForward())
    }

    const handleFaviconChange = (event: { favicons: string[] }): void => {
      const favicons: string[] = event.favicons
      if (favicons && favicons.length > 0) {
        onFaviconChange(favicons[0])
      }
    }

    webview.addEventListener('page-title-updated', handleTitleChange)
    webview.addEventListener('did-navigate', handleUrlChange)
    webview.addEventListener('did-navigate-in-page', handleUrlChange)
    webview.addEventListener('page-favicon-updated', handleFaviconChange)

    return (): void => {
      webview.removeEventListener('page-title-updated', handleTitleChange)
      webview.removeEventListener('did-navigate', handleUrlChange)
      webview.removeEventListener('did-navigate-in-page', handleUrlChange)
      webview.removeEventListener('page-favicon-updated', handleFaviconChange)
    }
  }, [onTitleChange, onUrlChange, onFaviconChange, onNavigationStateChange])

  return (
    <webview
      ref={webviewRef}
      data-id={tabId}
      src={url}
      style={{ display: active ? 'flex' : 'none', width: '100%', height: '100%' }}
      // eslint-disable-next-line react/no-unknown-property
      webpreferences="contextIsolation=yes, nodeIntegration=no"
    />
  )
}
