const { defineConfig } = require('eslint/config')
const js = require('@eslint/js')
const { FlatCompat } = require('@eslint/eslintrc')
const prettierConfig = require('eslint-config-prettier/flat')
const { default: turboConfig } = require('eslint-config-turbo/flat')
const tanstackQuery = require('@tanstack/eslint-plugin-query')
const tseslint = require('@typescript-eslint/eslint-plugin')
const tsparser = require('@typescript-eslint/parser')

// Custom Supabase rules
const noAwaitBeforeCopyToClipboard = require('./rules/no-await-before-copy-to-clipboard')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

// Custom Supabase ESLint plugin
const supabasePlugin = {
  rules: {
    'no-await-before-copy-to-clipboard': noAwaitBeforeCopyToClipboard,
  },
}

// TypeScript ESLint config for TypeScript files
const typescriptConfig = {
  name: 'typescript',
  files: ['**/*.ts', '**/*.tsx'],
  languageOptions: {
    parser: tsparser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  plugins: {
    '@typescript-eslint': tseslint,
    supabase: supabasePlugin,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    'supabase/no-await-before-copy-to-clipboard': 'error',
  },
}

module.exports = defineConfig([
  // Global ignore for the .next folder
  { ignores: ['.next', 'public', '.contentlayer'] },
  turboConfig,
  prettierConfig,
  tanstackQuery.configs['flat/recommended'],
  {
    rules: {
      '@tanstack/query/exhaustive-deps': 'warn',
    },
  },
  typescriptConfig,
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
    ignores: [
      'pages/**/*.ts',
      'app/**/*.ts',
      'pages/**/*.tsx',
      'app/**/*.tsx',
      'components/interfaces/**/content/**/content.tsx',
    ],
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
