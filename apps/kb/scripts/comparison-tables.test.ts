import { describe, expect, it } from 'vitest'

import { expandComparisonTables, parseRowsProp, renderComparisonTable } from './comparison-tables'

describe('parseRowsProp', () => {
  it('returns undefined when the tag has no rows prop', () => {
    expect(parseRowsProp('<ComparisonTable />')).toBeUndefined()
  })

  it('returns the listed row keys in order', () => {
    expect(parseRowsProp("<ComparisonTable rows={['self_host', 'license']} />")).toEqual([
      'self_host',
      'license',
    ])
  })

  it('throws on an unknown row key', () => {
    expect(() => parseRowsProp("<ComparisonTable rows={['licence']} />")).toThrow(
      'Unknown comparison row "licence"'
    )
  })
})

describe('expandComparisonTables', () => {
  it('removes import lines and replaces the tag with a GFM table', () => {
    const body = [
      "import { ComparisonTable } from '../../components/ComparisonTable'",
      '',
      'Intro.',
      '',
      "<ComparisonTable rows={['self_host']} />",
      '',
      'Outro.',
    ].join('\n')

    const expanded = expandComparisonTables(body)

    expect(expanded).not.toContain('import ')
    expect(expanded).not.toContain('<ComparisonTable')
    expect(expanded).toContain('| Self-host |')
    expect(expanded.trim().startsWith('Intro.')).toBe(true)
    expect(expanded.trim().endsWith('Outro.')).toBe(true)
  })

  it('renders every row when the tag has no rows prop', () => {
    const expanded = expandComparisonTables('<ComparisonTable />')
    expect(expanded).toContain('| License |')
    expect(expanded).toContain('| Loads into a standard server |')
  })

  it('leaves text without tags unchanged', () => {
    expect(expandComparisonTables('Plain text.')).toBe('Plain text.')
  })
})

describe('renderComparisonTable', () => {
  const table = {
    profileNames: ['Supabase', 'Neon'],
    rows: [
      { label: 'Wire protocol', cells: [{ text: 'Postgres', footnote: 1 }, { text: 'A | B' }] },
    ],
    footnotes: [{ number: 1, notes: 'Sample note.', sourcing_urls: ['https://example.com/a'] }],
  }

  it('escapes pipes and adds footnote references and definitions', () => {
    const markdown = renderComparisonTable(table)
    expect(markdown).toContain('| Wire protocol | Postgres[^1] | A \\| B |')
    expect(markdown).toContain('[^1]: Sample note. Sources: https://example.com/a')
  })
})
