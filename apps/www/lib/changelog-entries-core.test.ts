import { describe, expect, it } from 'vitest'

import {
  PUBLIC_FRONTMATTER_KEYS,
  parseChangelogEntryFile,
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
})

describe('parseChangelogEntryFile', () => {
  it('never exposes the internal block on the parsed entry frontmatter', () => {
    const entry = parseChangelogEntryFile('20260101-pipelines.md', ENTRY_WITH_INTERNAL)

    expect(entry.frontmatter.internal).toBeUndefined()
    expect(entry.frontmatter.reviewers).toBeUndefined()
    expect(JSON.stringify(entry.frontmatter)).not.toContain('team-etl')
    expect(JSON.stringify(entry.frontmatter)).not.toContain('escalation_teams')

    // Public fields still flow through untouched.
    expect(entry.frontmatter.title).toBe('Supabase Pipelines')
    expect(entry.frontmatter.change_type).toBe('new-feature')
    expect(entry.frontmatter.public).toBe(true)
    expect(entry.frontmatter.affected_products).toEqual(['pipelines'])
  })
})
