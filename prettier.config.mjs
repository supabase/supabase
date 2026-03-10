let options = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  printWidth: 100,
  endOfLine: 'lf',
  sqlKeywordCase: 'lower',
  plugins: ['prettier-plugin-sql-cst'],
  overrides: [
    {
      files: '**/*.json',
      options: { parser: 'json' },
    },
  ],
}

// Disable sorting imports when running a prettier command in CI. This is to make the sorting work in editors
// for easier migration.
if (process.env.SORT_IMPORTS !== 'false') {
  options = {
    ...options,
    plugins: [...options.plugins, '@ianvs/prettier-plugin-sort-imports'],
    importOrder: ['<THIRD_PARTY_MODULES>', '', '^(@|\\.{1,2})/(.*)$'],
  }
}

export default options
