const path = require('path')
module.exports = {
  stories: ['./*.stories.mdx', '../components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-dark-mode',
  ],

  webpackFinal: async (config) => {
    config.resolve.modules = [...(config.resolve.modules || []), path.resolve(__dirname, '../')]
    return config
  },
}
