import { useState, useEffect } from 'react'
import { Globe, X, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import BrowserView from '../../components/BrowserView'
import { parseUrl } from '../../utils/urlParser'

interface Tab {
  id: string
  title: string
  url: string
  active: boolean
  favicon?: string
  lastPosition?: number
  // Add history tracking
  history: string[]
  currentIndex: number
}

export default function InternetMode(): JSX.Element {
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const savedTabs = localStorage.getItem('browser-tabs')
    return savedTabs
      ? JSON.parse(savedTabs)
      : [
          {
            id: '1',
            title: 'New Tab',
            url: 'about:blank',
            active: true,
            history: ['about:blank'],
            currentIndex: 0
          }
        ]
  })
  const [currentUrl, setCurrentUrl] = useState('')
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('browser-tabs', JSON.stringify(tabs))
  }, [tabs])

  // Update this useEffect to sync currentUrl with active tab's URL
  useEffect(() => {
    const activeTab = tabs.find((tab) => tab.active)
    if (activeTab) {
      setCurrentUrl(activeTab.url)
    }
  }, [tabs])

  const handleUrlSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const activeTab = tabs.find((tab) => tab.active)
    if (activeTab) {
      const formattedUrl = parseUrl(currentUrl)
      const updatedTabs = tabs.map((tab) =>
        tab.id === activeTab.id ? { ...tab, url: formattedUrl } : tab
      )
      setTabs(updatedTabs)
    }
  }

  const handleTitleChange = (tabId: string, newTitle: string): void => {
    setTabs(tabs.map((tab) => (tab.id === tabId ? { ...tab, title: newTitle } : tab)))
  }

  const handleUrlChange = (tabId: string, newUrl: string): void => {
    // Don't update if the URL hasn't actually changed
    const currentTab = tabs.find((tab) => tab.id === tabId)
    if (currentTab && currentTab.url === newUrl) {
      return
    }

    setTabs(
      tabs.map((tab) => {
        if (tab.id === tabId) {
          // Only update history if this is a new URL
          const lastHistoryEntry = tab.history[tab.currentIndex]
          if (lastHistoryEntry !== newUrl) {
            const newHistory = tab.history.slice(0, tab.currentIndex + 1)
            newHistory.push(newUrl)
            return {
              ...tab,
              url: newUrl,
              history: newHistory,
              currentIndex: newHistory.length - 1
            }
          }
          return { ...tab, url: newUrl }
        }
        return tab
      })
    )

    // Update currentUrl when the active tab's URL changes
    const isActiveTab = tabs.find((tab) => tab.id === tabId)?.active
    if (isActiveTab) {
      setCurrentUrl(newUrl)
    }
  }

  const handleFaviconChange = (tabId: string, favicon: string): void => {
    setTabs(tabs.map((tab) => (tab.id === tabId ? { ...tab, favicon } : tab)))
  }

  const addNewTab = (): void => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: 'New Tab',
      url: 'about:blank',
      active: true,
      history: ['about:blank'],
      currentIndex: 0
    }
    setTabs(tabs.map((tab) => ({ ...tab, active: false })).concat(newTab))
    setCurrentUrl('')
  }

  const removeTab = (tabId: string): void => {
    if (tabs.length > 1) {
      const tabIndex = tabs.findIndex((tab) => tab.id === tabId)
      const newTabs = tabs.filter((tab) => tab.id !== tabId)

      // If we're removing the active tab, activate the previous tab (or the next one if it's the first tab)
      if (tabs[tabIndex].active) {
        const newActiveIndex = tabIndex === 0 ? 0 : tabIndex - 1
        newTabs[newActiveIndex].active = true
      }

      setTabs(newTabs)
    }
  }

  const activateTab = (tabId: string): void => {
    const newTabs = tabs.map((tab) => ({
      ...tab,
      active: tab.id === tabId
    }))
    setTabs(newTabs)

    // Update currentUrl when switching tabs
    const activeTab = newTabs.find((tab) => tab.id === tabId)
    if (activeTab) {
      setCurrentUrl(activeTab.url)
    }
  }

  const handleNavigationStateChange = (
    tabId: string,
    canGoBack: boolean,
    canGoForward: boolean
  ): void => {
    if (tabs.find((tab) => tab.id === tabId)?.active) {
      setCanGoBack(canGoBack)
      setCanGoForward(canGoForward)
    }
  }

  const handleGoBack = (): void => {
    const activeTab = tabs.find((tab) => tab.active)
    if (activeTab && activeTab.currentIndex > 0) {
      const webview = document.querySelector(
        `webview[data-id="${activeTab.id}"]`
      ) as Electron.WebviewTag
      if (webview && webview.canGoBack()) {
        webview.goBack()
        setTabs(
          tabs.map((tab) =>
            tab.id === activeTab.id ? { ...tab, currentIndex: tab.currentIndex - 1 } : tab
          )
        )
      }
    }
  }

  const handleGoForward = (): void => {
    const activeTab = tabs.find((tab) => tab.active)
    if (activeTab && activeTab.currentIndex < activeTab.history.length - 1) {
      const webview = document.querySelector(
        `webview[data-id="${activeTab.id}"]`
      ) as Electron.WebviewTag
      if (webview && webview.canGoForward()) {
        webview.goForward()
        setTabs(
          tabs.map((tab) =>
            tab.id === activeTab.id ? { ...tab, currentIndex: tab.currentIndex + 1 } : tab
          )
        )
      }
    }
  }

  const handleReload = (): void => {
    const activeTab = tabs.find((tab) => tab.active)
    if (activeTab) {
      const webview = document.querySelector(
        `webview[data-id="${activeTab.id}"]`
      ) as Electron.WebviewTag
      if (webview) {
        webview.reload()
      }
    }
  }

  return (
    <div className="internet-mode-layout">
      <div className="browser-content">
        <div className="url-bar-container">
          <form onSubmit={handleUrlSubmit}>
            <div className="url-bar">
              <div className="navigation-buttons">
                <button
                  type="button"
                  onClick={handleGoBack}
                  disabled={!canGoBack}
                  className="nav-button"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleGoForward}
                  disabled={!canGoForward}
                  className="nav-button"
                >
                  <ArrowRight size={16} />
                </button>
                <button type="button" onClick={handleReload} className="nav-button">
                  <RotateCcw size={16} />
                </button>
              </div>
              <Globe size={16} />
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="Enter URL"
              />
            </div>
          </form>
        </div>

        <div className="webview-container">
          {tabs.map((tab) => (
            <BrowserView
              key={tab.id}
              url={tab.url}
              active={tab.active}
              tabId={tab.id}
              onTitleChange={(title) => handleTitleChange(tab.id, title)}
              onUrlChange={(url) => handleUrlChange(tab.id, url)}
              onFaviconChange={(favicon) => handleFaviconChange(tab.id, favicon)}
              onNavigationStateChange={(canGoBack, canGoForward) =>
                handleNavigationStateChange(tab.id, canGoBack, canGoForward)
              }
            />
          ))}
        </div>
      </div>

      <div className="vertical-tabs">
        <div className="tabs-list">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab ${tab.active ? 'active' : ''}`}
              onClick={() => activateTab(tab.id)}
            >
              {tab.favicon && (
                <img src={tab.favicon} alt="" className="tab-favicon" width={16} height={16} />
              )}
              <span className="tab-title">{tab.title}</span>
              <button
                className="close-tab"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTab(tab.id)
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <button className="new-tab" onClick={addNewTab}>
          + New Tab
        </button>
      </div>
    </div>
  )
}
