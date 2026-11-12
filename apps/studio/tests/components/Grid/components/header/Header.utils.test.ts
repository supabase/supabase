import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'

import { formatRowsForCSV } from '@/components/grid/components/header/Header.utils'

describe('formatRowsForCSV', () => {
  it('serializes JSON and array cells without changing the source rows', () => {
    const metadata = { active: true, nested: { label: 'hello, "world"' } }
    const tags = ['first', 'second']
    const rows = [{ id: 1, metadata, tags }]
    const original = JSON.stringify(rows)

    const csv = formatRowsForCSV({ rows, columns: ['id', 'metadata', 'tags'] })

    expect(Papa.parse(csv, { header: true }).data).toEqual([
      { id: '1', metadata: JSON.stringify(metadata), tags: JSON.stringify(tags) },
    ])
    expect(JSON.stringify(rows)).toBe(original)
    expect(rows[0].metadata).toBe(metadata)
    expect(rows[0].tags).toBe(tags)
    expect(formatRowsForCSV({ rows, columns: ['id', 'metadata', 'tags'] })).toBe(csv)
  })

  it('accepts frozen rows and preserves scalar values and column order', () => {
    const rows = Object.freeze([
      Object.freeze({ metadata: { count: 0 }, empty: null, active: false, count: 0, label: '' }),
    ])

    const csv = formatRowsForCSV({
      rows,
      columns: ['count', 'active', 'empty', 'label', 'metadata'],
    })

    expect(Papa.parse(csv).data).toEqual([
      ['count', 'active', 'empty', 'label', 'metadata'],
      ['0', 'false', '', '', '{"count":0}'],
    ])
  })
})
