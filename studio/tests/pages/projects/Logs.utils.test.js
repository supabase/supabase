import {
  ensureNoTimestampConflict,
  fillTimeseries,
  genChartQuery,
  genDefaultQuery,
  LogsTableName,
  SQL_FILTER_TEMPLATES,
} from 'components/interfaces/Settings/Logs'
import dayjs from 'dayjs'
import { isEqual } from 'lodash'

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

// test for log trunc filling
test.each([
  {
    // truncate timestamp string from bigquery
    case: 'bq utc timestamp, truncated minutely',
    data: [
      { timestamp: '2023-04-26T17:18:00', count: 123 },
      { timestamp: '2023-04-26T17:20:00', count: 123 },
    ],
    // expected
    len: 3,
    includes: [{ timestamp: '2023-04-26T17:19:00.000Z', count: 0 }],
  },
  // hourly truncation
  {
    case: 'bq timestamp truncated hourly, different options',
    data: [
      { period: '2023-04-26T17:00:00.000Z', value: 123 },
      { period: '2023-04-26T20:00:00.000Z', value: 123 },
    ],
    // expected
    len: 4,
    defaultVal: 1,
    valKey: 'value',
    tsKey: 'period',
    includes: [
      { period: '2023-04-26T18:00:00.000Z', value: 1 },
      { period: '2023-04-26T19:00:00.000Z', value: 1 },
    ],
  },
  // fill beyong data min/max
  {
    case: 'fill beyond min/max',
    data: [],
    len: 3,
    min: '2023-04-26T18:00:00.000Z',
    max: '2023-04-26T20:00:00.000Z',
    includes: [
      { timestamp: '2023-04-26T18:00:00.000Z', count: 0 },
      { timestamp: '2023-04-26T19:00:00.000Z', count: 0 },
      { timestamp: '2023-04-26T20:00:00.000Z', count: 0 },
    ],
  },
  // fill multiple keys in one go
  {
    case: 'fill multiple keys when both not given',
    data: [],
    len: 2,
    min: '2023-04-26T18:00:00.000Z',
    max: '2023-04-26T19:00:00.000Z',
    valKey: ['count', 'other'],
    includes: [
      { timestamp: '2023-04-26T18:00:00.000Z', count: 0, other: 0 },
      { timestamp: '2023-04-26T19:00:00.000Z', count: 0, other: 0 },
    ],
  },

  {
    case: 'truncation detection should check underlying data',
    data: [
      {
        timestamp: '2023-05-18T00:00:00',
        total_auth_requests: 4,
        total_realtime_requests: 0,
        total_rest_requests: 0,
        total_storage_requests: 0,
      },
      {
        timestamp: '2023-05-18T03:00:00',
        total_auth_requests: 4,
        total_realtime_requests: 0,
        total_rest_requests: 0,
        total_storage_requests: 0,
      },
      {
        timestamp: '2023-05-18T07:00:00',
        total_auth_requests: 4,
        total_realtime_requests: 0,
        total_rest_requests: 0,
        total_storage_requests: 0,
      },
      {
        timestamp: '2023-05-18T08:00:00',
        total_auth_requests: 2,
        total_realtime_requests: 0,
        total_rest_requests: 0,
        total_storage_requests: 0,
      },
      {
        timestamp: '2023-05-18T09:00:00',
        total_auth_requests: 2,
        total_realtime_requests: 0,
        total_rest_requests: 0,
        total_storage_requests: 0,
      },
      {
        timestamp: '2023-05-18T13:00:00',
        total_auth_requests: 0,
        total_realtime_requests: 0,
        total_rest_requests: 0,
        total_storage_requests: 0,
      },
      {
        timestamp: '2023-05-18T16:00:00',
        total_auth_requests: 0,
        total_realtime_requests: 0,
        total_rest_requests: 1,
        total_storage_requests: 0,
      },
    ],
    len: 24,
    min: '2023-05-18T00:00:00',
    max: '2023-05-18T23:00:00',
    valKey: [
      'total_auth_requests',
      'total_realtime_requests',
      'total_rest_requests',
      'total_storage_requests',
    ],
    includes: [
      {
        // timestamp format is with higher precision and with tz
        timestamp: '2023-05-18T14:00:00.000Z',
        total_auth_requests: 0,
        total_realtime_requests: 0,
        total_rest_requests: 0,
        total_storage_requests: 0,
      },
    ],
  },
])(
  'fillTimeseries : $case',
  ({ data, len, includes, min, max, tsKey = 'timestamp', valKey = 'count', defaultVal = 0 }) => {
    const result = fillTimeseries(data, tsKey, valKey, defaultVal, min, max)
    expect(result.length).toEqual(len)
    for (const inc of includes) {
      expect(result.find((d) => isEqual(d, inc))).toBeTruthy()
    }
  }
)
