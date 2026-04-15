/**
 * Separate ESLint config for rules that require TypeScript type information.
 *
 * Run via: pnpm lint:type-checks
 *
 * Kept separate from eslint.config.cjs because loading a full TypeScript program
 * (project: true) is memory-intensive and would slow down or OOM the main lint run.
 */

const { defineConfig } = require('eslint/config')
const tsparser = require('@typescript-eslint/parser')
const requireSafeSqlFragment = require('./eslint-rules/require-safe-sql-fragment.cjs')

const studioPlugin = {
  rules: {
    'require-safe-sql-fragment': requireSafeSqlFragment,
  },
}

module.exports = defineConfig([
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      studio: studioPlugin,
    },
    rules: {
      'studio/require-safe-sql-fragment': 'warn',
    },
  },
])
