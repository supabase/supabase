import { withThemeByClassName } from '@storybook/addon-themes'
import './preview.css'

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

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

export default preview
