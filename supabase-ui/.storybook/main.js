const babel = require('@babel/core');

module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  webpackFinal: async config => {

    // This is for fix webpack storybook get module @emotion/styled/base
    // It's wrong module, the right module is @emotion/styled-base
    config.resolve.alias = {
      '@emotion/styled/base': '@emotion/styled-base'
    }

    return config;
  }
}