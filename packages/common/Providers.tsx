import { createContext, useContext, useEffect, useState } from 'react'

export interface UseThemeProps {
  isDarkMode?: boolean
  /**
   * Toggle between dark mode and light mode.
   *
   * ---
   *
   * If `darkMode` left `undefined`, toggles between modes.
   *
   * If `darkMode` set, forces
   * dark mode if `true` and light mode if `false`.
   */
  toggleTheme: (darkMode?: boolean) => void
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

  useEffect(() => {
    const key = localStorage.getItem('supabaseDarkMode')
    // Default to dark mode if no preference config
    setIsDarkMode(!key || key === 'true')
  }, [])

  const toggleTheme: UseThemeProps['toggleTheme'] = (darkMode) => {
    const newMode = typeof darkMode === 'boolean' ? darkMode : !isDarkMode

    localStorage.setItem('supabaseDarkMode', newMode.toString())

    const key = localStorage.getItem('supabaseDarkMode')
    document.documentElement.className = key === 'true' ? 'dark' : ''

    setIsDarkMode(newMode)
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
