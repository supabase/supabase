const path = require('path')

module.exports = {
  // stories: [
  //   '../src/components/**/*.stories.mdx',
  //   '../src/components/**/*.stories.@(js|jsx|ts|tsx)',
  // ],
  // TODO: Temporally Import one by one story and fix build issue.
  // After all stories are cleaned, revert to wildcard import.
  stories: [
    '../src/components/Accordion/Accordion.stories.tsx',
    '../src/components/Alert/Alert.stories.tsx',
    '../src/components/Avatar/Avatar.stories.tsx',
    '../src/components/Button/Button.stories.tsx',
    '../src/components/Checkbox/Checkbox.stories.tsx',
    '../src/components/Collapsible/Collapsible.stories.tsx',
    '../src/components/ContextMenu/ContextMenu.stories.tsx',
    '../src/components/Dropdown/Dropdown.stories.tsx',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-dark-mode',
    {
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: require('postcss'),
        },
      },
    },
  ],
  framework: '@storybook/react',
  webpackFinal: async (config, { configType }) => {
    const cssRuleIdx = config.module.rules.findIndex(({ test }) => test.toString() === '/\\.css$/')
    const cssRule = {
      test: /\.css$/,
      include: path.resolve(__dirname, '../'),
      exclude: /\.module\.css$/,
      use: [
        { loader: 'style-loader' },
        { loader: 'css-loader', options: { importLoaders: 1, sourceMap: true } },
        { loader: 'postcss-loader', options: {} },
      ],
    }
    const cssModulesRule = {
      test: /\.module.css$/,
      include: path.resolve(__dirname, '../'),
      use: [
        { loader: 'style-loader' },
        { loader: 'css-loader', options: { importLoaders: 1, modules: true, sourceMap: true } },
        { loader: 'postcss-loader', options: {} },
      ],
    }
    config.module.rules.splice(cssRuleIdx, 1, cssModulesRule, cssRule)

    return config
  },
}
