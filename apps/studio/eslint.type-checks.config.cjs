/**
 * Separate ESLint config for rules that need TypeScript type information.
 *
 * Run via: pnpm lint:type-checks (also part of `pnpm lint`). The script passes
 * `--no-inline-config` because source files carry disable comments for rules that only exist in
 * eslint.config.cjs, which would otherwise be reported as unknown rules.
 *
 * Kept apart from eslint.config.cjs on purpose. Enabling `projectService` there would give every
 * other plugin type information too, which silently changes what they report (e.g.
 * react-google-translate and @tanstack/query rules find more issues), and loading the TypeScript
 * program slows the whole run. Only add rules here that cannot work without types.
 */

const { defineConfig } = require('eslint/config')
const tsparser = require('@typescript-eslint/parser')
const fga = require('./scripts/eslint-rules/fga.cjs')

module.exports = defineConfig([
  { ignores: ['.next', 'dist', 'public', '.contentlayer', '**/*.mts', '**/*.cts', '**/*.d.ts'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    // Tests and scripts don't build query options for components, and the test fixtures live in
    // their own tsconfig.
    ignores: ['**/*.test.ts', '**/*.test.tsx', 'scripts/**', 'tests/**'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { projectService: true, tsconfigRootDir: __dirname },
    },
    plugins: { fga },
    rules: { 'fga/no-spread-granted-query-options': 'error' },
  },
])
