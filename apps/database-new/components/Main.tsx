import { useMonaco } from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { PropsWithChildren, useEffect } from 'react'

const getTheme = (theme: string) => {
  const isDarkMode = theme.includes('dark')
  // [TODO] Probably need better theming for light mode
  return {
    base: isDarkMode ? 'vs-dark' : 'vs', // can also be vs-dark or hc-black
    inherit: true, // can also be false to completely replace the builtin rules
    rules: [
      { background: isDarkMode ? '1f1f1f' : 'f0f0f0' },
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

export const Main = ({ children }: PropsWithChildren<{}>) => {
  const monaco = useMonaco()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (monaco && resolvedTheme) {
      const mode: any = getTheme(resolvedTheme)
      monaco.editor.defineTheme('supabase', mode)
    }
  }, [resolvedTheme, monaco])

  return <main className="flex max-h-screen flex-col">{children}</main>
}
