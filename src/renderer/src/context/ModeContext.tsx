import { createContext, useState, ReactNode } from 'react'

export interface ModeContextType {
  isOsMode: boolean
  toggleMode: () => void
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

export function ModeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [isOsMode, setIsOsMode] = useState(true)

  const toggleMode = (): void => {
    setIsOsMode((prev) => !prev)
  }

  return <ModeContext.Provider value={{ isOsMode, toggleMode }}>{children}</ModeContext.Provider>
}

export { ModeContext }
