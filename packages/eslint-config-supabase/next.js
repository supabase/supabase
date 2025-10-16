const { defineConfig } = require('eslint/config')
const js = require('@eslint/js')
const { FlatCompat } = require('@eslint/eslintrc')
const prettierConfig = require('eslint-config-prettier/flat')
const { default: turboConfig } = require('eslint-config-turbo/flat')
const { off } = require('process')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

module.exports = defineConfig([
  // Global ignore for the .next folder
  { ignores: ['.next', 'public'] },
  turboConfig,
  prettierConfig,
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
