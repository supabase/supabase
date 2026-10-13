const { defineConfig } = require('eslint/config')
const tsparser = require('@typescript-eslint/parser')
const astroParser = require('astro-eslint-parser')
const shadcnConfig = require('eslint-config-supabase/shadcn')

module.exports = defineConfig([
  { ignores: ['dist', '.astro'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parser: tsparser },
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroParser,
      parserOptions: { parser: tsparser },
    },
  },
  { ...shadcnConfig, files: [...shadcnConfig.files, '**/*.astro'] },
])
