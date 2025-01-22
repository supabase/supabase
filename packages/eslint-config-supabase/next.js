module.exports = {
  // next rules should be last
  extends: ['prettier', 'eslint-config-turbo', 'next/core-web-vitals'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    'react/jsx-key': 'off',
  },
}
