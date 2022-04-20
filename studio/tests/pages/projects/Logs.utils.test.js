import {
  genDefaultQuery,
  LogsTableName,
  SQL_FILTER_TEMPLATES,
} from 'components/interfaces/Settings/Logs'

describe.each(Object.values(LogsTableName))('%s', (table) => {
  const templates = SQL_FILTER_TEMPLATES[table]
  const stringTemplateKey = Object.keys(templates).find((key) => {
    if (typeof templates[key] === 'string' && key.split('.').length === 2) {
      return true
    } else {
      false
    }
  })
  const [root, child] = (stringTemplateKey || '').split('.')
  describe.each([
    { filter: { search_query: '' } },
    { filter: { search_query: undefined } },
    { filter: {} },
    { filter: { search_query: '123test' }, contains: ['123test'] },
    //   test behaviour with overrides
    {
      filter: { search_query: '123test', override: 'something' },
      contains: ['123test', 'override', 'something'],
    },
    {
      filter: { search_query: '', override: 'something' },
      contains: ['override', 'something'],
    },
    {
      filter: { search_query: undefined, override: 'something' },
      contains: ['override', 'something'],
    },
    {
      filter: { override: 'something' },
      contains: ['override', 'something'],
    },
    {
      filter: { 'override.nested': 'something' },
      contains: ['override.nested', 'something'],
    },
    // check for when string templates are set to false.
    ...(stringTemplateKey
      ? [
          {
            filter: { search_query: 'some-search-query', [root]: { [child]: false } },
            excludes: [templates[stringTemplateKey], '()'],
            contains: ['some-search-query'],
          },
        ]
      : []),
  ])('generates sql for filter $filter', ({ filter, contains = [], excludes = [] }) => {
    test('generates query correctly', async () => {
      const generated = genDefaultQuery(table, filter)
      //   should not contain functions
      expect(generated).not.toMatch(/function[ A-Za-z_-]+\(.+\).+\{.+return.+\}/)
      expect(generated).not.toMatch(/\=\>|\$\{.+\}/)
      expect(generated).not.toContain('return')
      contains.forEach((str) => expect(generated).toContain(str))
      excludes.forEach((str) => expect(generated).not.toContain(str))
    })
  })
})
