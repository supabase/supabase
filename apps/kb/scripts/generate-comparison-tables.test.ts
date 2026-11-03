import { describe, expect, it } from 'vitest'

import { renderComparisonTable, replaceGeneratedBlock } from './generate-comparison-tables'

const table = {
  profileNames: ['Supabase', 'Neon'],
  rows: [
    {
      label: 'Wire protocol',
      cells: [{ text: 'Postgres', footnote: 1 }, { text: 'Postgres' }],
    },
    {
      label: 'Upstream projects',
      cells: [{ text: 'A | B' }, { text: 'None' }],
    },
  ],
  footnotes: [
    {
      number: 1,
      notes: 'Sample note.',
      sourcing_urls: ['https://example.com/a', 'https://example.com/b'],
    },
  ],
}

describe('renderComparisonTable', () => {
  it('renders a GFM table with footnote references', () => {
    const markdown = renderComparisonTable(table)
    expect(markdown.split('\n')[0]).toBe('|  | Supabase | Neon |')
    expect(markdown).toContain('| Wire protocol | Postgres[^1] | Postgres |')
  })

  it('escapes pipes inside cell text', () => {
    expect(renderComparisonTable(table)).toContain('| Upstream projects | A \\| B | None |')
  })

  it('appends footnote definitions with their sources', () => {
    expect(renderComparisonTable(table)).toContain(
      '[^1]: Sample note. Sources: https://example.com/a, https://example.com/b'
    )
  })

  it('omits footnote definitions when there are none', () => {
    const plain = renderComparisonTable({ ...table, footnotes: [] })
    expect(plain).not.toMatch(/^\[\^\d+\]:/m)
  })
})

describe('replaceGeneratedBlock', () => {
  const source = [
    'Intro',
    '{/* comparison-table:start demo */}',
    'old table',
    '{/* comparison-table:end demo */}',
    'Outro',
  ].join('\n')

  it('replaces only the content between the markers', () => {
    const next = replaceGeneratedBlock(source, 'demo', 'new table')
    expect(next).toContain(
      'Intro\n{/* comparison-table:start demo */}\n\nnew table\n\n{/* comparison-table:end demo */}\nOutro'
    )
    expect(next).not.toContain('old table')
  })

  it('is idempotent', () => {
    const once = replaceGeneratedBlock(source, 'demo', 'new table')
    expect(replaceGeneratedBlock(once, 'demo', 'new table')).toBe(once)
  })

  it('throws when the markers are missing', () => {
    expect(() => replaceGeneratedBlock('no markers here', 'demo', 'x')).toThrow(
      'Missing comparison-table markers for "demo"'
    )
  })
})
