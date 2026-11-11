import { describe, expect, it } from 'vitest'

import {
  computeChecksum,
  describeConflict,
  findTitleConflicts,
  isBlocking,
  type CategoryDiscussion,
  type EntryRow,
} from './troubleshooting-sync-shared.ts'

const discussion = (id: string, title: string): CategoryDiscussion => ({
  id,
  title,
  url: `https://github.com/orgs/supabase/discussions/${id}`,
})

const entry = (id: string, slug: string | null, github_id: string): EntryRow => ({
  id,
  slug,
  github_id,
  github_url: `https://github.com/orgs/supabase/discussions/${github_id}`,
  checksum: null,
})

describe('computeChecksum', () => {
  it('is the sha256 of JSON.stringify({ title, body }), hex encoded', () => {
    // Pinned: sync-troubleshooting-updates.ts compares this against stored
    // values, so changing the formula would mark every guide as changed.
    expect(computeChecksum('Title', 'Body')).toBe(
      '01e5f0f389e0155e1ecc739dbc285466e73240ec3a9a6bc062caec4dd18d536f'
    )
  })

  it('changes when either the title or the body changes', () => {
    const base = computeChecksum('Title', 'Body')
    expect(computeChecksum('Title!', 'Body')).not.toBe(base)
    expect(computeChecksum('Title', 'Body!')).not.toBe(base)
  })

  it('does not confuse a title/body boundary shift', () => {
    expect(computeChecksum('ab', 'c')).not.toBe(computeChecksum('a', 'bc'))
  })
})

describe('findTitleConflicts', () => {
  it('finds nothing when no discussion has the title', () => {
    expect(
      findTitleConflicts('New guide', [discussion('1', 'Other guide')], [entry('r1', 'other', '1')])
    ).toEqual([])
  })

  it('flags a discussion no row references as an orphan, and blocks on it', () => {
    const [conflict] = findTitleConflicts('New guide', [discussion('1', 'New guide')], [])

    expect(conflict.kind).toBe('orphan')
    expect(isBlocking(conflict)).toBe(true)
  })

  it('flags a discussion owned by a slug-less row, and blocks on it', () => {
    const [conflict] = findTitleConflicts(
      'New guide',
      [discussion('1', 'New guide')],
      [entry('r1', null, '1')]
    )

    expect(conflict.kind).toBe('slugless-row')
    expect(isBlocking(conflict)).toBe(true)
    expect(describeConflict(conflict)).toContain('backfill')
  })

  it('only warns when the discussion belongs to a row with a different slug', () => {
    const [conflict] = findTitleConflicts(
      'New guide',
      [discussion('1', 'New guide')],
      [entry('r1', 'some-other-slug', '1')]
    )

    expect(conflict.kind).toBe('other-slug')
    expect(isBlocking(conflict)).toBe(false)
  })

  it('compares titles ignoring case and surrounding whitespace', () => {
    const conflicts = findTitleConflicts('  New Guide ', [discussion('1', 'new guide')], [])

    expect(conflicts).toHaveLength(1)
  })

  it('reports every discussion that carries the title', () => {
    const conflicts = findTitleConflicts(
      'Dup',
      [discussion('1', 'Dup'), discussion('2', 'Dup'), discussion('3', 'Else')],
      [entry('r1', 'dup', '1')]
    )

    expect(conflicts.map((c) => c.kind)).toEqual(['other-slug', 'orphan'])
  })
})
