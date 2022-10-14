import {
  ensureNoTimestampConflict,
  genChartQuery,
  genDefaultQuery,
  LogsTableName,
  SQL_FILTER_TEMPLATES,
} from 'components/interfaces/Settings/Logs'
import dayjs from 'dayjs'

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
    test('generated chart query should include filters', () => {
      const generated = genChartQuery(table, {}, { 'override.nested': 'something' })
      expect(generated).toContain('override.nested')
      expect(generated).toContain('something')
      expect(generated).toContain('timestamp_trunc')
    })
  })
})

const base = dayjs().subtract(2, 'day')
const baseIso = base.toISOString()
test.each([
  {
    case: 'next start is after initial start',
    initial: [base.subtract(1, 'day').toISOString(), baseIso],
    next: [base.subtract(2, 'day').toISOString(), null],
    expected: [base.subtract(2, 'day').toISOString(), baseIso],
  },
  {
    case: 'next end is before initial start',
    initial: [base.subtract(1, 'day').toISOString(), baseIso],
    next: [null, base.subtract(2, 'day').toISOString()],
    expected: [base.subtract(3, 'day').toISOString(), base.subtract(2, 'day').toISOString()],
  },
  {
    case: 'next end is not before initial start',
    initial: [base.subtract(2, 'day').toISOString(), baseIso],
    next: [null, base.subtract(1, 'day').toISOString()],
    expected: [base.subtract(2, 'day').toISOString(), base.subtract(1, 'day').toISOString()],
  },
])('ensure no timestamp conflict: $case', ({ initial, next, expected }) => {
  const result = ensureNoTimestampConflict(initial, next)
  expect(result[0]).toEqual(expected[0])
  expect(result[1]).toEqual(expected[1])
})
