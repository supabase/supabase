import { describe, expect, it } from 'vitest'

import { getCellValueSql } from './get-cell-value-mutation'

const base = {
  table: { schema: 'public', name: 'docs' },
  column: 'meta',
  pkMatch: { id: 1 },
}

describe('getCellValueSql', () => {
  it('selects the bare column by default', () => {
    const sql = getCellValueSql(base)
    expect(sql).toContain('select meta from public.docs')
    expect(sql).not.toContain('::text')
  })

  it('casts the column to text under its own name when asText is set', () => {
    expect(getCellValueSql({ ...base, asText: true })).toContain(
      'select meta::text as meta from public.docs'
    )
  })
})
