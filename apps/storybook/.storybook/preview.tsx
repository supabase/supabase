import type { Preview } from '@storybook/react-vite'

import './globals.css'

import { ReactNode } from 'react'

const preview: Preview = {
  parameters: {
    backgrounds: {
      grid: {
        disable: true
      },
      options: {
        // 👇 Default options
        dark: { name: 'Dark', value: 'dark' },
        light: { name: 'Light', value: 'light' },
      },
    },
  },
  initialGlobals: {
    // 👇 Set the initial background color
    backgrounds: { value: 'light' },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.backgrounds.value || 'light';
      const isDoc = context.viewMode === 'docs';
      return (
        <div
          className={`flex flex-col bg p-8 min-w-full${isDoc ? '' : ' min-h-screen'}`}
          data-theme={theme}
        >
          <Story />
        </div>
      )
    },
  ],
}

export default preview
