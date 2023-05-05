import { createContext, useContext, useEffect, useState } from 'react'

export interface UseThemeProps {
  isDarkMode: boolean
  /**
   * Toggle between dark mode and light mode.
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
    const mode = key === 'true'

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    prefersDark ? toggleTheme(true) : toggleTheme(mode)
  }, [])

  const toggleTheme: UseThemeProps['toggleTheme'] = (darkMode) => {
    const newMode = typeof darkMode === 'boolean' ? darkMode : !isDarkMode
    localStorage.setItem('supabaseDarkMode', newMode.toString())

    const newTheme = newMode ? 'dark' : 'light'

    document.body.classList.remove('light', 'dark')
    document.body.classList.add(newTheme)

    // Color scheme must be applied to document element (`<html>`)
    document.documentElement.style.colorScheme = newTheme

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
