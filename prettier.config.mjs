let options = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  printWidth: 100,
  endOfLine: 'lf',
  sqlKeywordCase: 'lower',
  sqlLiteralCase: 'lower',
  sqlTypeCase: 'lower',
  plugins: ['prettier-plugin-sql-cst'],
  overrides: [
    {
      files: '**/*.json',
      options: { parser: 'json' },
    },
  ],
}

const sortImportsOptions = {
  plugins: ['prettier-plugin-sql-cst', '@ianvs/prettier-plugin-sort-imports'],
  importOrder: ['<THIRD_PARTY_MODULES>', '', '^(@|\\.{1,2})/(.*)$'],
}

// Disable sorting imports when running a prettier command in CI. This is to make the sorting work in editors
// for easier migration. Studio components are always sorted regardless of this flag.
if (process.env.SORT_IMPORTS !== 'false') {
  options = { ...options, ...sortImportsOptions }
} else {
  options.overrides.push({
    files: 'apps/studio/**/*.{js,jsx,ts,tsx}',
    options: sortImportsOptions,
  })
}

export default options
