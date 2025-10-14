const { defineConfig } = require('eslint/config')
const js = require('@eslint/js')
const { FlatCompat } = require('@eslint/eslintrc')
const prettierConfig = require('eslint-config-prettier/flat')
const { default: turboConfig } = require('eslint-config-turbo/flat')
const { fixupPluginRules } = require('@eslint/compat')
const tanstackQuery = require('@tanstack/eslint-plugin-query')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const eslintConfig = {
  name: '@tanstack/query',
  plugins: { '@tanstack/query': fixupPluginRules(tanstackQuery) },
  rules: {
    '@tanstack/query/exhaustive-deps': 'warn',
    '@tanstack/query/no-deprecated-options': 'warn',
    '@tanstack/query/prefer-query-object-syntax': 'warn',
    '@tanstack/query/stable-query-client': 'warn',
  },
}

module.exports = defineConfig([
  // Global ignore for the .next folder
  { ignores: ['.next', 'public'] },
  turboConfig,
  prettierConfig,
  eslintConfig,
  {
    extends: compat.extends('next/core-web-vitals'),
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      'react/jsx-key': 'off',
    },
  },
  {
    // check for default exports in all files except app and pages folders.
    ignores: ['pages/**.tsx', 'app/**.tsx'],
    rules: {
      'no-restricted-exports': [
        'warn',
        {
          restrictDefaultExports: {
            direct: true,
          },
        },
      ],
    },
  },
])
