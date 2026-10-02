import { compileLifecycleEvaluationRules } from '../lifecycle/configuration'
import {
  buildEvaluateNoncurrentLifecyclePageStatement,
  decodeCandidate,
  decodeLifecycleCandidateIdentity,
  mapLifecycleEvaluationPage,
} from './lifecycle'

describe('noncurrent lifecycle evaluation query', () => {
  test.each([
    {
      label: 'BC timestamp near the PostgreSQL minimum',
      timestamp: '-004713-11-26T00:00:00.000123Z',
      expected: '4714-11-26T00:00:00.000123Z BC',
    },
    {
      label: 'astronomical year zero',
      timestamp: '0000-01-01T00:00:00.123456Z',
      expected: '0001-01-01T00:00:00.123456Z BC',
    },
    {
      label: 'expanded astronomical year zero',
      timestamp: '+000000-01-01T00:00:00.123456Z',
      expected: '0001-01-01T00:00:00.123456Z BC',
    },
    {
      label: 'BC offset crossing into year zero',
      timestamp: '-000001-12-31T23:59:59.123456-08:00',
      expected: '0001-01-01T07:59:59.123456Z BC',
    },
    {
      label: 'AD offset crossing into year zero',
      timestamp: '0001-01-01T00:00:00.000123+01:00',
      expected: '0001-12-31T23:00:00.000123Z BC',
    },
  ])('binds $label without losing fractional seconds', ({ timestamp, expected }) => {
    const statement = buildEvaluateNoncurrentLifecyclePageStatement({
      bucketId: 'bucket-a',
      snapshotAt: timestamp,
      cursor: { name: 'logs/a', archivedAt: timestamp },
      pageSize: 1,
      rules: [{ cutoffAt: timestamp }],
    })

    expect(statement.values).toEqual([
      'bucket-a',
      expected,
      expected,
      expected,
      'logs/a',
      1,
      [expected],
      [null],
      1,
    ])
  })

  test('binds an empty cutoff at the PostgreSQL timestamp minimum', () => {
    const snapshotAt = new Date('2026-08-06T00:00:00.000Z')
    const noncurrentDays =
      (snapshotAt.getTime() - Date.parse('-004713-11-24T00:00:00.000Z')) / 86_400_000
    const rules = compileLifecycleEvaluationRules(
      {
        rules: [
          {
            status: 'Enabled',
            filter: {},
            noncurrentVersionExpiration: { noncurrentDays },
          },
        ],
      },
      snapshotAt
    )
    const statement = buildEvaluateNoncurrentLifecyclePageStatement({
      bucketId: 'bucket-a',
      snapshotAt: snapshotAt.toISOString(),
      pageSize: 1,
      rules,
    })

    expect(statement.values?.[2]).toBe('-infinity')
    expect(statement.values?.[4]).toEqual(['-infinity'])
  })

  test('builds a page variant without a cursor', () => {
    const statement = buildEvaluateNoncurrentLifecyclePageStatement({
      bucketId: 'bucket-a',
      snapshotAt: '2026-08-15T00:00:00.000Z',
      pageSize: 500,
      rules: [
        { cutoffAt: '2026-07-16T00:00:00.000Z' },
        {
          cutoffAt: '2026-08-08T00:00:00.000Z',
          newerNoncurrentVersions: 3,
        },
      ],
    })

    expect(statement.text).toContain('AS MATERIALIZED')
    expect(statement.text).toContain('evaluated.newer_count >= rules.newer_noncurrent_versions')
    expect(statement.text).toContain('object_row.archived_at <')
    expect(statement.text).not.toContain('object_row.metadata')
    expect(statement.text).not.toContain('object_row.created_at')
    expect(statement.text).not.toContain('object_row.id')
    expect(statement.text).toMatch(
      /ORDER BY\s+object_row\.archived_at,\s+object_row\.name COLLATE "C"/
    )
    expect(statement.values).toEqual([
      'bucket-a',
      '2026-08-15T00:00:00.000Z',
      '2026-08-08T00:00:00.000Z',
      500,
      ['2026-07-16T00:00:00.000Z', '2026-08-08T00:00:00.000Z'],
      [null, 3],
      3,
    ])
  })

  test('builds a continuation variant with the exact keyset tuple', () => {
    const statement = buildEvaluateNoncurrentLifecyclePageStatement({
      bucketId: 'bucket-a',
      snapshotAt: '2026-08-15T00:00:00.000123Z',
      cursor: {
        name: 'logs/a',
        archivedAt: '2026-08-01T00:00:00.000123Z',
      },
      pageSize: 20,
      rules: [{ cutoffAt: '2026-08-08T00:00:00.000Z', newerNoncurrentVersions: 3 }],
    })

    expect(statement.text).toMatch(
      /\(\s*object_row\.archived_at,\s*object_row\.name COLLATE "C"\s*\) > \(/
    )
    expect(statement.values).toEqual([
      'bucket-a',
      '2026-08-15T00:00:00.000123Z',
      '2026-08-08T00:00:00.000Z',
      '2026-08-01T00:00:00.000123Z',
      'logs/a',
      20,
      ['2026-08-08T00:00:00.000Z'],
      [3],
      3,
    ])
  })

  test('maps page progress independently from candidate selectivity', () => {
    expect(
      mapLifecycleEvaluationPage(
        {
          raw_rows_examined: 2,
          candidates: [],
          page_end: {
            name: 'last',
            archivedAt: '2026-08-01T00:00:00.000Z',
          },
        },
        500
      )
    ).toEqual({
      rawRowsExamined: 2,
      candidates: [],
      pageEnd: {
        name: 'last',
        archivedAt: '2026-08-01T00:00:00.000Z',
      },
      exhausted: true,
    })
  })

  test.each([
    null,
    'version-a',
  ])('maps the physical candidate identity with version %s', (version) => {
    expect(
      mapLifecycleEvaluationPage(
        {
          raw_rows_examined: 1,
          candidates: [
            {
              name: 'history/object.txt',
              version,
              isDeleteMarker: false,
            },
          ],
          page_end: {
            name: 'history/object.txt',
            archivedAt: '2026-08-01T00:00:00.000Z',
          },
        },
        500
      )
    ).toMatchObject({
      candidates: [{ name: 'history/object.txt', version, isDeleteMarker: false }],
    })
  })

  test.each([0, 501])('rejects page size %s', (pageSize) => {
    expect(() =>
      buildEvaluateNoncurrentLifecyclePageStatement({
        bucketId: 'bucket-a',
        snapshotAt: '2026-08-15T00:00:00.000Z',
        pageSize,
        rules: [{ cutoffAt: '2026-08-01T00:00:00.000Z' }],
      })
    ).toThrow('between 1 and 500')
  })
})

describe('lifecycle candidate decoding', () => {
  const row = {
    id: 'row-id',
    bucketId: 'bucket-a',
    name: 'history/object.txt',
    version: null,
    isVersioned: false,
    isDeleteMarker: false,
    metadata: { size: 12 },
    createdAt: '2026-07-01T00:00:00.000Z',
    archivedAt: '2026-08-01T00:00:00.000123Z',
  }

  test('preserves a nullable physical version and microsecond archive ordering', () => {
    expect(decodeCandidate(row)).toEqual(row)
  })

  test('accepts a delete marker with null metadata and a physical UUID', () => {
    const marker = {
      ...row,
      version: '856d94e5-5241-42ae-9c0b-d06332a7ae15',
      isVersioned: true,
      isDeleteMarker: true,
      metadata: null,
    }
    expect(decodeCandidate(marker)).toEqual(marker)
  })

  test.each([
    undefined,
    '',
    1,
  ])('rejects an omitted or malformed physical version %s', (version) => {
    expect(() => decodeCandidate({ ...row, version })).toThrow('candidate.version')
    expect(() => decodeLifecycleCandidateIdentity({ ...row, version })).toThrow('candidate.version')
  })
})
