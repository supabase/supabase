import { withThemeByClassName } from '@storybook/addon-themes'
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
]
