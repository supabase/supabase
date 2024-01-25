const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
// import type { StorybookConfig } from '@storybook/your-framework'
import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: [
    // colors
    '../src/lib/colors.stories.tsx',
    // shadcn
    '../src/components/shadcn/stories/**/*.stories.tsx',
    // older components
    '../src/components/Accordion/Accordion.stories.tsx',
    '../src/components/Alert/Alert.stories.tsx',
    '../src/components/Badge/Badge.stories.tsx',
    '../src/components/Button/Button.stories.tsx',
    '../src/components/Checkbox/Checkbox.stories.tsx',
    '../src/components/Collapsible/Collapsible.stories.tsx',
  ],
  addons: [
    'storybook-dark-mode',
    '@storybook/addon-controls',
    '@storybook/addon-docs',
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
  webpackFinal: async (config, { configType }) => {
    /**
     * resolve import paths from tsconfig
     * based on https://stackoverflow.com/a/71677949/4807782
     */
    if (config && config.resolve) {
      config.resolve.plugins = [new TsconfigPathsPlugin()];
    }

    return config
  },
}
export default config
