import { genDefaultQuery, LogsTableName } from 'components/interfaces/Settings/Logs'

describe.each(Object.values(LogsTableName))('%s', (table) => {
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
  ])('generates sql for filter $filter', ({ filter, contains = [] }) => {
    test('generates query correctly', async () => {
      const generated = genDefaultQuery(table, filter)
      //   should not contain functions
      expect(generated).not.toMatch(/function[ A-Za-z_-]+\(.+\).+\{.+return.+\}/)
      expect(generated).not.toMatch(/\=\>|\$\{.+\}/)
      expect(generated).not.toContain('return')

      contains.forEach((str) => expect(generated).toContain(str))
    })
  })
})
