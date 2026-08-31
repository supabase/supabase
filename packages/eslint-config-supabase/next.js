const { defineConfig } = require('eslint/config')
const prettierConfig = require('eslint-config-prettier/flat')
const { default: turboConfig } = require('eslint-config-turbo/flat')
const tanstackQuery = require('@tanstack/eslint-plugin-query')
const tsparser = require('@typescript-eslint/parser')
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals')

const NEXT_PLUGIN_FILES = ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}']

// Custom Supabase rules
const noAwaitBeforeCopyToClipboard = require('./rules/no-await-before-copy-to-clipboard')
const requireExplicitTabIndex = require('./rules/require-explicit-tabindex')

// Transitional config that turns off all the React Compiler hook rules that come bundled
// with core-web-vitals@16. We want to upgrade to get exhaustive-deps updates without
// blowing up our error count.
const compilerRulesOff = {}
for (const cfg of nextCoreWebVitals) {
  for (const key of Object.keys(cfg.rules ?? {})) {
    if (
      key.startsWith('react-hooks/') &&
      key !== 'react-hooks/exhaustive-deps' &&
      key !== 'react-hooks/rules-of-hooks'
    ) {
      compilerRulesOff[key] = 'off'
    }
  }
}

// Custom Supabase ESLint plugin
const supabasePlugin = {
  rules: {
    'no-await-before-copy-to-clipboard': noAwaitBeforeCopyToClipboard,
    'require-explicit-tabindex': requireExplicitTabIndex,
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
    supabase: supabasePlugin,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    'supabase/no-await-before-copy-to-clipboard': 'error',
    'supabase/require-explicit-tabindex': 'error',
  },
}

module.exports = defineConfig([
  // Global ignore for build output and static assets
  { ignores: ['.next', 'dist', 'public', '.contentlayer'] },
  // eslint-config-next v16 registers its plugins for `.mts`/`.cts` (v15 didn't lint
  // them at all), which newly surfaces errors in build/tooling scripts. Keep the prior
  // lint surface and leave `.mts`/`.cts` unlinted; revisit as a separate change.
  { ignores: ['**/*.mts', '**/*.cts'] },
  turboConfig,
  prettierConfig,
  tanstackQuery.configs['flat/recommended'],
  {
    rules: {
      '@tanstack/query/exhaustive-deps': 'warn',
    },
  },
  typescriptConfig,
  ...nextCoreWebVitals,
  {
    files: NEXT_PLUGIN_FILES,
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
    rules: {
      ...compilerRulesOff,
      '@next/next/no-html-link-for-pages': 'off',
      'react/jsx-key': 'off',
      'no-restricted-imports': [
        'warn',
        {
          name: 'react-data-grid',
          message: 'Please use @tanstack/react-table instead.',
        },
        {
          name: 'react-contexify',
          message: 'Please use ContextMenu from the ui package instead.',
        },
      ],
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
      'vitest.config.ts',
      'postcss.config.js',
      'postcss.config.cjs',
      'velite.config.js',
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
