import { join, dirname } from 'path'

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')))
}

/** @type { import('@storybook/nextjs').StorybookConfig } */
const config = {
  stories: [
    // package based stories
    '../../../packages/ui-patterns/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    // primitives
    '../../../packages/ui/src/components/shadcn/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../../../packages/ui/src/components/Input/Input.stories.@(js|jsx|mjs|ts|tsx)',
    '../../../packages/ui/src/components/Button/Button.stories.@(js|jsx|mjs|ts|tsx)',
    //
    // local stories
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    // app based stories
    // -- add app based stories here
  ],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('@storybook/addon-mdx-gfm'),
    getAbsolutePath('@storybook/addon-styling-webpack'),
    getAbsolutePath('@storybook/addon-themes'),
    getAbsolutePath('@storybook/addon-mdx-gfm'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/nextjs'),
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
}
export default config
