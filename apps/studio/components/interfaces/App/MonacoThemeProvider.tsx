import { useMonaco } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'

const getTheme = (theme: string) => {
  const isDarkMode = theme.includes('dark')
  // [TODO] Probably need better theming for light mode
  return {
    base: isDarkMode ? ('vs-dark' as const) : ('vs' as const), // can also be vs-dark or hc-black
    inherit: true, // can also be false to completely replace the builtin rules
    rules: [
      { token: '', background: isDarkMode ? '1f1f1f' : 'f0f0f0' },
      {
        token: '',
        background: isDarkMode ? '1f1f1f' : 'f0f0f0',
        foreground: isDarkMode ? 'd4d4d4' : '444444',
      },
      { token: 'string.sql', foreground: '24b47e' },
      { token: 'comment', foreground: '666666' },
      { token: 'predefined.sql', foreground: isDarkMode ? 'D4D4D4' : '444444' },
    ],
    colors: { 'editor.background': isDarkMode ? '#1f1f1f' : '#f0f0f0' },
  }
}

/**
 * This component is used to set the theme for the Monaco editor. This would be a hook but it needs to be placed between
 * ThemeProvider and the layout page so a component is the most convenient way to do this.
 */
export const MonacoThemeProvider = () => {
  const monaco = useMonaco()
  const { resolvedTheme } = useTheme()

  // Define the supabase theme for Monaco before anything is rendered. Using useEffect would sometime load the theme
  // after the editor was loaded, so it looked off. useMemo will always be run before rendering
  useMemo(() => {
    if (monaco && resolvedTheme) {
      const mode = getTheme(resolvedTheme)
      monaco.editor.defineTheme('supabase', mode)
    }
  }, [resolvedTheme, monaco])

  return null
}
