module.exports = {
  extends: ['prettier', 'next/core-web-vitals', 'eslint-config-turbo'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    'react/jsx-key': 'off',
  },
}
