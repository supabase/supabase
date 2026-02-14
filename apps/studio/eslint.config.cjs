const { defineConfig } = require('eslint/config')
const barrelFiles = require('eslint-plugin-barrel-files')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([
  { files: ['**/*.ts', '**/*.tsx'] },
  supabaseConfig,
  {
    plugins: {
      'barrel-files': barrelFiles,
    },
    rules: {
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'warn',
      'barrel-files/avoid-re-export-all': 'error',
    },
  },
])
