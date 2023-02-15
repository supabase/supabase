const path = require('path')
module.exports = {
  stories: [
    './*.stories.mdx',
    '../components/**/*.stories.@(js|jsx|ts|tsx)',
    {
      directory: '../../packages/ui/src',
      titlePrefix: 'UI',
      files: '**/*.stories.*',
    },
  ],
  addons: [
    '@storybook/preset-scss',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-dark-mode',
    '@storybook/addon-docs',
    '@storybook/addon-actions',
  ],

  webpackFinal: async (config) => {
    config.resolve.modules = [...(config.resolve.modules || []), path.resolve(__dirname, '../')]
    return config
  },
}
