import { createContext, useContext, useEffect, useState } from 'react'

export interface UseThemeProps {
  isDarkMode: boolean
  /**
   * Toggle between dark mode, light mode, or system default.
   */
  toggleTheme: (isDarkMode: boolean) => void
}

interface ThemeProviderProps {
  children?: any
  detectSystemColorPreference?: boolean
}

export const ThemeContext = createContext<UseThemeProps>({
  isDarkMode: true,
  toggleTheme: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({
  detectSystemColorPreference = true,
  children,
}: ThemeProviderProps) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true)

  useEffect(() => {
    const key = localStorage.getItem('supabaseDarkMode')
    const hasNoKey = key === null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (hasNoKey && detectSystemColorPreference) {
      setIsDarkMode(prefersDark)
      localStorage.setItem('supabaseDarkMode', prefersDark.toString()) // Set the value in localStorage
    } else {
      setIsDarkMode(key === 'true')
    }
  }, [detectSystemColorPreference])

  const toggleTheme: UseThemeProps['toggleTheme'] = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('supabaseDarkMode', newMode.toString())
  }

  // Apply the theme to the body and document element as before
  useEffect(() => {
    const newThemeClass = isDarkMode ? 'dark' : 'light'
    document.body.classList.remove('light', 'dark')
    document.body.classList.add(newThemeClass)
    document.documentElement.style.colorScheme = newThemeClass
  }, [isDarkMode])

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
