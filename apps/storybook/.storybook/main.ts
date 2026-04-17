import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../../../packages/**/*.doc.mdx',
    '../../../packages/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: '@storybook/react-vite',
}
export default config
