import { useTheme } from 'next-themes'
import { useEffect } from 'react'

type App = 'docs' | 'studio' | 'www'

export const useThemeSync = (app: App) => {
  const { setTheme } = useTheme()
  const isWww = app === 'www'

  useEffect(() => {
    const handleSetLocalStorage = (e: any) => {
      const theme = e.target?.localStorage?.theme
      const wwwTheme = e.target?.localStorage?.wwwTheme?.replace('deep-', '')

      if (theme === wwwTheme) return

      if (theme && isWww) {
        setTheme(theme === 'dark' && wwwTheme === 'deep-dark' ? 'deep-dark' : theme)
      }

      if (wwwTheme && !isWww) {
        setTheme(wwwTheme)
      }
    }

    window.addEventListener('storage', handleSetLocalStorage)
    return window.removeEventListener('storage', () => null)
  }, [])
}
