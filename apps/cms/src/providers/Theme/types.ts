export type Theme = 'dark' | 'light'

export interface ThemeContextType {
  setTheme: (theme: Theme | null) => void
  theme?: Theme | null
}

export function themeIsValid(string: null | string): string is Theme {
  return string ? ['dark', 'light'].includes(string) : false
}
