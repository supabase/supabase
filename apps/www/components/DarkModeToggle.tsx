import { useTheme } from '~/components/Providers'
import { IconSun, IconMoon } from 'ui'

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
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none ${
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
                  } dark:bg-scale-300 inline-block h-5 w-5
                  transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out
                `}
        />
      </button>
      <IconMoon className="text-scale-900" strokeWidth={2} />
    </div>
  )
}

export default DarkModeToggle
