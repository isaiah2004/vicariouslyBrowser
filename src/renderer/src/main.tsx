/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-refresh/only-export-components */
import './assets/main.css'

import React, { createContext, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import App from './App'
import GridOverlay from './Grid'
import WebRTCService from './services/WebRTCService'

// Create WebRTC context
const WebRTCContext = createContext(null)

// eslint-disable-next-line react/prop-types
const WebRTCProvider = ({ children }) => {
  const [webRTCState, setWebRTCState] = useState({
    isActive: false
    // other WebRTC state...
  })

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <WebRTCContext.Provider value={{ webRTCState, setWebRTCState } as any}>
      {children}
    </WebRTCContext.Provider>
  )
}

const RouteChangeHandler = ({ children }) => {
  const location = useLocation()
  const webRTCService = WebRTCService.getInstance()

  useEffect(() => {
    return () => {
      if (webRTCService.getState()) {
        webRTCService.cleanup().catch(console.error)
      }
    }
  }, [location, webRTCService])

  return children
}

const AppWrapper = () => {
  return (
    <Router>
      <RouteChangeHandler>
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/grid"
            element={
              <React.Suspense fallback={<div>Loading...</div>}>
                <GridOverlay />
              </React.Suspense>
            }
          />
        </Routes>
      </RouteChangeHandler>
    </Router>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
)
