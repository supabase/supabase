import { useTheme } from './Providers'
import { IconSun, IconMoon } from '@supabase/ui'

function DarkModeToggle() {
  const { isDarkMode, toggleTheme } = useTheme()

  const toggleDarkMode = () => {
    localStorage.setItem('supabaseDarkMode', (!isDarkMode).toString())
    toggleTheme()

    const key = localStorage.getItem('supabaseDarkMode')
    document.documentElement.className = key === 'true' ? 'dark' : ''
  }

  return (
    <button className="flex w-full justify-between" onClick={() => toggleDarkMode()}>
      {isDarkMode ? <span>Dark Mode</span> : <span>Light Mode</span>}
      {isDarkMode ? <IconMoon /> : <IconSun />}
    </button>
  )
}

export default DarkModeToggle
