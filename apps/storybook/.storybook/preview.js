import { withThemeByClassName, withThemeByDataAttribute } from '@storybook/addon-themes'
import './preview.css'

export const decorators = [
  withThemeByClassName({
    themes: {
      light: 'light',
      dark: 'dark',
      'deep-dark': 'deep-dark',
    },
    defaultTheme: 'dark',
  }),
  withThemeByDataAttribute({
    themes: {
      light: 'light',
      dark: 'dark',
      'deep-dark': 'dark',
    },
    defaultTheme: 'dark',
  }),
]
