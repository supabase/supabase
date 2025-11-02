module.exports = {
  extends: ['prettier', 'next/core-web-vitals', 'eslint-config-turbo'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    'react/jsx-key': 'off',
    'no-restricted-exports': ['warn', { restrictDefaultExports: { direct: true } }],
  },
  overrides: [
    {
      files: ['pages/**', 'app/**'],
      rules: {
        'no-restricted-exports': 'off',
      },
    },
  ],
}
