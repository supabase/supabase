import { createContext, useContext, useEffect, useState } from 'react'

export interface UseThemeProps {
  isDarkMode?: boolean
  toggleTheme: () => void
}

interface ThemeProviderProps {
  children?: any
}

export const ThemeContext = createContext<UseThemeProps>({
  isDarkMode: true,
  toggleTheme: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  console.log('isDarkMode', isDarkMode)

  useEffect(() => {
    const key = localStorage.getItem('supabaseDarkMode')
    // Default to dark mode if no preference config
    setIsDarkMode(!key || key === 'true')
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <>
      <ThemeContext.Provider
        value={{
          isDarkMode,
          toggleTheme,
        }}
      >
        {children}
      </ThemeContext.Provider>
    </>
  )
}
