import { useTheme } from '~/components/Providers'
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
    <div className="flex items-center">
      <IconSun className="text-scale-900" strokeWidth={2} />
      <button
        type="button"
        aria-pressed="false"
        className={`
                relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer 
                transition-colors ease-in-out duration-200 focus:outline-none ${
                  isDarkMode ? 'bg-scale-500' : 'bg-scale-900'
                } mx-5
              `}
        onClick={() => toggleDarkMode()}
      >
        <span className="sr-only">Toggle Themes</span>
        <span
          aria-hidden="true"
          className={`
                  ${
                    isDarkMode ? 'translate-x-5' : 'translate-x-0'
                  } inline-block h-5 w-5 rounded-full
                  bg-white dark:bg-scale-300 shadow-lg transform ring-0 transition ease-in-out duration-200
                `}
        />
      </button>
      <IconMoon className="text-scale-900" strokeWidth={2} />
    </div>
  )
}

export default DarkModeToggle
