import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'

export function useForceDeepDark() {
  const router = useRouter()
  const { resolvedTheme, theme } = useTheme()

  const isDarkTheme = resolvedTheme?.includes('dark')
  const forceDarkMode = router.pathname === '/' || router.pathname.startsWith('/launch-week')
  const isGaSection = router.pathname.includes('/ga-week') || router.pathname === '/ga'

  useEffect(() => {
    const handleDocumentLoad = () => {
      // Update the HTML element attributes
      const theme = forceDarkMode || isDarkTheme ? (isGaSection ? 'deep-dark' : 'dark') : 'light'

      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.style.colorScheme = theme

      // wait before setting the theme
      setTimeout(() => {
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.style.colorScheme = theme
      }, 200)

      // Clean up the event listener
      window.removeEventListener('load', handleDocumentLoad)
    }

    // Check if document is already loaded
    if (document.readyState === 'complete') {
      handleDocumentLoad()
    } else {
      // Add a global load event listener
      window.addEventListener('load', handleDocumentLoad)
    }

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('load', handleDocumentLoad)
    }
  }, [resolvedTheme, theme, isDarkTheme, router])
}
