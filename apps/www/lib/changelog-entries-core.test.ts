import { describe, expect, it } from 'vitest'

import {
  parseChangelogEntryFile,
  PUBLIC_FRONTMATTER_KEYS,
  toPublicFrontmatter,
} from './changelog-entries-core.mjs'

const ENTRY_WITH_INTERNAL = `---
title: Supabase Pipelines
change_type: new-feature
public: true
publish_date: 2026-01-01
affected_products:
  - pipelines
internal:
  escalation_teams:
    - team-etl
  notes: Do not ship this to the browser
reviewers:
  - alice
---

# Summary

Pipelines are here.

# Body

Long form body.
`

describe('toPublicFrontmatter', () => {
  it('keeps only allowlisted public keys', () => {
    const publicFrontmatter = toPublicFrontmatter({
      title: 'Hello',
      change_type: 'new-feature',
      internal: { escalation_teams: ['team-etl'] },
      reviewers: ['alice'],
      some_future_private_field: 'secret',
    })

    expect(publicFrontmatter).toEqual({ title: 'Hello', change_type: 'new-feature' })
    for (const key of Object.keys(publicFrontmatter)) {
      expect(PUBLIC_FRONTMATTER_KEYS).toContain(key)
    }
  })

  it('omits keys whose value is undefined', () => {
    expect(toPublicFrontmatter({ title: 'Hello', product_stage: undefined })).toEqual({
      title: 'Hello',
    })
  })

  it('normalizes Date-valued date fields to YYYY-MM-DD strings', () => {
    const publicFrontmatter = toPublicFrontmatter({
      title: 'Hello',
      publish_date: new Date('2026-05-18T00:00:00.000Z'),
      sunset_date: new Date('2026-08-05T00:00:00.000Z'),
    }) as Record<string, unknown>

    expect(publicFrontmatter.publish_date).toBe('2026-05-18')
    expect(publicFrontmatter.sunset_date).toBe('2026-08-05')
    expect(typeof publicFrontmatter.publish_date).toBe('string')
  })
})

describe('parseChangelogEntryFile', () => {
  it('never exposes the internal block on the parsed entry frontmatter', () => {
    const entry = parseChangelogEntryFile('20260101-pipelines.md', ENTRY_WITH_INTERNAL)
    // Untyped .mjs export, so `frontmatter` is inferred as {}.
    const frontmatter = entry.frontmatter as Record<string, unknown>

    expect(frontmatter.internal).toBeUndefined()
    expect(frontmatter.reviewers).toBeUndefined()
    expect(JSON.stringify(frontmatter)).not.toContain('team-etl')
    expect(JSON.stringify(frontmatter)).not.toContain('escalation_teams')

    expect(frontmatter.title).toBe('Supabase Pipelines')
    expect(frontmatter.change_type).toBe('new-feature')
    expect(frontmatter.public).toBe(true)
    expect(frontmatter.affected_products).toEqual(['pipelines'])
  })

  it('always yields a string sortDate, even for an unquoted (Date-parsed) publish_date', () => {
    const unquoted = parseChangelogEntryFile(
      '20260722-unquoted.md',
      `---\ntitle: Unquoted\nchange_type: improvement\npublic: true\npublish_date: 2026-05-18\n---\n\n# Body\n\nx\n`
    )
    expect(typeof unquoted.sortDate).toBe('string')
    expect(unquoted.sortDate).toBe('2026-05-18')

    const quoted = parseChangelogEntryFile(
      '20260722-quoted.md',
      `---\ntitle: Quoted\nchange_type: improvement\npublic: true\npublish_date: "2026-05-18"\n---\n\n# Body\n\nx\n`
    )
    expect(quoted.sortDate).toBe('2026-05-18')

    // publish_date: null falls back to the filename date, also as a string.
    const nullDate = parseChangelogEntryFile(
      '20260722-null-date.md',
      `---\ntitle: Null date\nchange_type: improvement\npublic: true\npublish_date: null\n---\n\n# Body\n\nx\n`
    )
    expect(nullDate.sortDate).toBe('2026-07-22')
  })

  it('normalizes date frontmatter reaching detail-page props, even when unquoted', () => {
    // `[slug].tsx` ships `entry.frontmatter` into props; a Date would break serialization.
    const entry = parseChangelogEntryFile(
      '20260722-unquoted-dates.md',
      `---\ntitle: Unquoted dates\nchange_type: deprecation\npublic: true\npublish_date: 2026-05-18\nsunset_date: 2026-08-05\n---\n\n# Body\n\nx\n`
    )
    const frontmatter = entry.frontmatter as Record<string, unknown>

    expect(frontmatter.publish_date).toBe('2026-05-18')
    expect(frontmatter.sunset_date).toBe('2026-08-05')
    expect(() => JSON.stringify(entry.frontmatter)).not.toThrow()
  })
})
