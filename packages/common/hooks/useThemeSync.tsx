import { useTheme } from 'next-themes'
import { useEffect } from 'react'

type App = 'docs' | 'studio' | 'www'

const useThemeSync = (app: App) => {
  const { setTheme } = useTheme()
  const isWww = app === 'www'

  useEffect(() => {
    const handleSetLocalStorage = (e: any) => {
      const theme = e.target?.localStorage?.theme
      const wwwTheme = e.target?.localStorage['www-theme']

      if (theme && isWww) {
        setTheme(theme === 'dark' && wwwTheme === 'deep-dark' ? 'deep-dark' : theme)
      }

      if (wwwTheme && !isWww) {
        setTheme(wwwTheme.includes('dark') ? 'dark' : wwwTheme)
      }
    }

    window.addEventListener('storage', handleSetLocalStorage)
    return window.removeEventListener('storage', () => null)
  }, [])
}

export default useThemeSync
