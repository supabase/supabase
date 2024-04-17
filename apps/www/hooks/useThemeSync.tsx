import { useTheme } from 'next-themes'
import { useEffect } from 'react'

const useThemeSync = () => {
  const { setTheme } = useTheme()

  useEffect(() => {
    const handleSetLocalStorage = (e: any) => {
      const detectedTheme = e.target?.localStorage?.theme
      const wwwTheme = e.target.localStorage['www-theme']

      if (detectedTheme) {
        setTheme(
          detectedTheme === 'dark' && wwwTheme === 'deep-dark'
            ? 'deep-dark'
            : localStorage?.getItem('theme')!
        )
      }
    }

    window.addEventListener('storage', handleSetLocalStorage)
    return window.removeEventListener('storage', () => null)
  }, [])
}

export default useThemeSync
