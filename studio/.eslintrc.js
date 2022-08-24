const fs = require('fs')
const tsConfig = JSON.parse(fs.readFileSync('tsconfig.strict.json', 'utf8'))
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/jsx-runtime',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    //   dont use proptypes to check for prop validity
    'react/prop-types': 'off',
    // some code uses fallthroughs
    'no-fallthrough': 'off',
  },
  ignorePatterns: tsConfig.exclude,
}
