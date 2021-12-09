import { useEffect, useState } from 'react'
import { IconSun, IconMoon } from '@supabase/ui'

const ThemeToggle = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true)

  useEffect(() => {
    const isDarkMode = localStorage.getItem('supabaseDarkMode')
    if (isDarkMode) {
      setDarkMode(isDarkMode === 'true')
      document.documentElement.className = isDarkMode === 'true' ? 'dark' : ''
    }
  }, [])

  const updateTheme = (isDarkMode: boolean) => {
    document.documentElement.className = isDarkMode ? 'dark' : ''
    setDarkMode(isDarkMode)
    localStorage.setItem('supabaseDarkMode', (!darkMode).toString())
  }

  return (
    <button className="w-full flex justify-between" onClick={() => updateTheme(!darkMode)}>
      {darkMode ? <span>Light Mode</span> : <span>Dark Mode</span>}
      {darkMode ? <IconSun /> : <IconMoon />}
    </button>
  )
}

export default ThemeToggle
