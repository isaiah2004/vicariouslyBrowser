import { ModeProvider } from './context/ModeContext'

import OsMode from './pages/osMode/osMode'
import InternetMode from './pages/InternetMode/InternetMode'

import Titlebar from './components/Titlebar'
import { useMode } from './hooks/useMode'
// import { useEffect } from 'react'

function AppContent(): JSX.Element {
  const { isOsMode } = useMode()

  return (
    <>
      <Titlebar />
      {isOsMode ? <OsMode /> : <InternetMode />}
    </>
  )
}

function App(): JSX.Element {
  return (
    <ModeProvider>
      <AppContent />
    </ModeProvider>
  )
}

export default App
