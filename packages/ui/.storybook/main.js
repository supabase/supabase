module.exports = {
  //   // stories: [
  //   //   '../src/components/**/*.stories.mdx',
  //   //   '../src/components/**/*.stories.@(js|jsx|ts|tsx)',
  //   // ],
  //   // TODO: Temporally Import one by one story and fix build issue.
  //   // After all stories are cleaned, revert to wildcard import.
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
    // '@storybook/addon-links',
    // '@storybook/addon-essentials',
    // '@storybook/addon-interactions',
    // '@storybook/addon-actions',
    'storybook-dark-mode',
    {
      name: '@storybook/addon-styling',
      options: {
        // Check out https://github.com/storybookjs/addon-styling/blob/main/docs/api.md
        // For more details on this addon's options.
        postCss: true,
      },
    },
    '@storybook/addon-mdx-gfm',
  ],

  docs: {
    autodocs: true,
  },
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
}
