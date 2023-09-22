import { useTheme } from 'next-themes'
import { IconSun, IconMoon } from 'ui'

function DarkModeToggle({ disabled = false }: { disabled?: boolean }) {
  const { theme, setTheme } = useTheme()

  return (
    <div className={`flex items-center ${disabled && 'opacity-30'}`}>
      <IconSun className="text-scale-900" strokeWidth={2} />
      <button
        type="button"
        aria-pressed="false"
        disabled={disabled}
        className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none ${
                  theme === 'dark' ? 'bg-scale-500' : 'bg-scale-900'
                } ${disabled && '!cursor-not-allowed'} mx-5
              `}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <span className="sr-only">Toggle Themes</span>
        <span
          aria-hidden="true"
          className={`
                  ${
                    theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
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
