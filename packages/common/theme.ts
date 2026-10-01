export const THEME_DOM_VALUES = {
  dark: 'dark',
  light: 'light',
  'classic-dark': 'dark',
}

export function migrateLegacyTheme(theme: string | undefined) {
  return theme === 'classic-dark' ? 'dark' : theme
}
