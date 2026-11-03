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

  it('ignores notes and creates no footnotes without a footnote field', () => {
    const withoutFootnotes = buildComparisonTable(profiles.filter((p) => p.name !== 'Supabase'))
    expect(withoutFootnotes.footnotes).toEqual([])
    expect(
      withoutFootnotes.rows.flatMap((r) => r.cells).every((c) => c.footnote === undefined)
    ).toBe(true)
  })

  it('pulls footnotes from the footnote field, not notes', () => {
    const withFootnote = {
      ...supabase,
      deployment: {
        ...supabase.deployment,
        self_host: { ...supabase.deployment.self_host, footnote: 'Test footnote' },
      },
    } as CompetitorProfile

    const footnoteTable = buildComparisonTable([withFootnote], ['self_host'])
    expect(footnoteTable.rows.find((r) => r.label === 'Self-host')!.cells[0]).toEqual({
      text: 'Official (Docker)',
      footnote: 1,
    })
    expect(footnoteTable.footnotes).toEqual([
      {
        number: 1,
        notes: 'Test footnote',
        sourcing_urls: supabase.deployment.self_host.sourcing_urls,
      },
    ])
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
