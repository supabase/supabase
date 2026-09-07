const typescript = require('eslint-config-next/typescript')
const prettier = require('eslint-config-prettier/flat')

// This subpath contains only TypeScript ESLint configuration, with no Next or React plugins.
module.exports = [
  ...typescript,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  {
    files: ['**/*.ts'],
    ignores: ['**/*.config.ts', '**/workers/*/index.ts'],
    rules: { 'no-restricted-exports': ['warn', { restrictDefaultExports: { direct: true } }] },
  },
]
