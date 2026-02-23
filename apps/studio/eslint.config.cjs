const { defineConfig } = require('eslint/config')
const barrelFiles = require('eslint-plugin-barrel-files')
const jsxA11y = require('eslint-plugin-jsx-a11y')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([
  { files: ['**/*.ts', '**/*.tsx'] },
  supabaseConfig,
  {
    plugins: {
      'barrel-files': barrelFiles,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'warn',
      'react/no-unstable-nested-components': 'warn',
      'react/jsx-key': 'error',
      'barrel-files/avoid-re-export-all': 'error',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'error',
    },
  },
])
