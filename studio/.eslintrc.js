module.exports = {
  extends: '../packages/config/eslint-preset.js',
  rules: {
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'warn',
    'react/display-name': 'warn',
    'react/no-children-prop': 'warn',
    'react/no-unescaped-entities': 'warn',
  },
}
