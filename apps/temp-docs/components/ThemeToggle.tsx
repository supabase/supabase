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
    <button onClick={() => toggleDarkMode()}>
      {isDarkMode ? (
        <IconMoon className="text-scale-1100 stroke-2" />
      ) : (
        <IconSun className="text-scale-1100 stroke-2" />
      )}
    </button>
  )
}

export default DarkModeToggle
