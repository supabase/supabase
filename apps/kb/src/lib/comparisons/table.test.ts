import { profiles } from '.'
import { describe, expect, it } from 'vitest'

import { supabase } from './supabase'
import { buildComparisonTable } from './table'
import type { CompetitorProfile } from './types'

const cellText = (
  table: ReturnType<typeof buildComparisonTable>,
  rowLabel: string,
  profileName: string
) => {
  const row = table.rows.find((r) => r.label === rowLabel)!
  const index = table.profileNames.indexOf(profileName)
  return row.cells[index].text
}

describe('buildComparisonTable', () => {
  const table = buildComparisonTable(profiles)

  it('lists profiles in the order given', () => {
    expect(table.profileNames).toEqual(['Supabase', 'Neon', 'PlanetScale', 'Convex', 'Firebase'])
  })

  it('renders license with its SPDX identifier when there is one', () => {
    expect(cellText(table, 'License', 'Supabase')).toBe('Open source (OSI) (Apache-2.0)')
    expect(cellText(table, 'License', 'Convex')).toBe('Fair source')
  })

  it('renders self-host and protocol labels', () => {
    expect(cellText(table, 'Self-host', 'Neon')).toBe('Community only')
    expect(cellText(table, 'Wire protocol', 'PlanetScale')).toBe('MySQL, Postgres')
    expect(cellText(table, 'Wire protocol', 'Firebase')).toBe('Proprietary')
  })

  it('renders upstream projects with their license and CNCF status', () => {
    expect(cellText(table, 'Upstream projects', 'PlanetScale')).toBe(
      'Vitess (Apache-2.0), CNCF Graduated; PostgreSQL (PostgreSQL)'
    )
    expect(cellText(table, 'Upstream projects', 'Convex')).toBe('None')
  })

  it('numbers footnotes in order, one per cell with notes', () => {
    const numbers = table.footnotes.map((f) => f.number)
    expect(numbers).toEqual(numbers.map((_, i) => i + 1))

    const footnoteCells = table.rows.flatMap((r) => r.cells).filter((c) => c.footnote !== undefined)
    expect(footnoteCells.length).toBe(table.footnotes.length)
  })

  it('renders null as Unknown, never as a negative', () => {
    const withUnknown = {
      ...supabase,
      deployment: {
        ...supabase.deployment,
        self_host: { value: null, sourcing_urls: [] },
      },
    } as CompetitorProfile

    const unknownTable = buildComparisonTable([withUnknown])
    expect(unknownTable.rows.find((r) => r.label === 'Self-host')!.cells[0]).toEqual({
      text: 'Unknown',
    })
  })
})
