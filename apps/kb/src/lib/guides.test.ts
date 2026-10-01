import { describe, expect, it } from 'vitest'

import {
  emptyStateFor,
  filterGuides,
  padFeatured,
  parseTopicParam,
  withTopicParam,
  type GuideSummary,
} from './guides'
import { TOPICS, topicToSlug, type Topic } from './topics'

const guide = (id: string, title: string, topics: Topic[]): GuideSummary => ({
  id,
  title,
  description: `${title} description, mentions Postgres replication`,
  topics,
  href: `/kb/guides/${id}`,
})

const GUIDES = [
  guide('rds', 'Migrate from Amazon RDS to Supabase', ['Migration', 'Database']),
  guide('auth0', 'Migrate from Auth0 to Supabase Auth', ['Migration', 'Auth']),
  guide('firebase-auth', 'Migrate from Firebase Auth to Supabase', ['Migration', 'Auth']),
  guide('firebase-storage', 'Migrate from Firebase Storage to Supabase', ['Migration', 'Storage']),
  guide('firestore', 'Migrate from Firebase Firestore to Supabase', ['Migration', 'Database']),
  guide('heroku', 'Migrate from Heroku to Supabase', ['Migration', 'Database']),
  guide('mysql', 'Migrate from MySQL to Supabase', ['Migration', 'Database']),
  guide('sample', 'Markdown elements sample', ['Tutorial', 'Database']),
]

const ids = (guides: GuideSummary[]) => guides.map((g) => g.id)

describe('filterGuides', () => {
  it('ranks fuzzy title matches and drops the rest', () => {
    const result = ids(filterGuides({ guides: GUIDES, topic: null, query: 'fire' }))
    expect(result.slice(0, 3).sort()).toEqual(['firebase-auth', 'firebase-storage', 'firestore'])
    expect(result).not.toContain('heroku')
  })

  it('filters by topic only', () => {
    expect(ids(filterGuides({ guides: GUIDES, topic: 'Auth', query: '' }))).toEqual([
      'auth0',
      'firebase-auth',
    ])
  })

  it('combines topic and query', () => {
    expect(ids(filterGuides({ guides: GUIDES, topic: 'Migration', query: 'heroku' }))).toEqual([
      'heroku',
    ])
  })

  it('keeps original order for an empty or whitespace query', () => {
    expect(ids(filterGuides({ guides: GUIDES, topic: 'Database', query: '   ' }))).toEqual([
      'rds',
      'firestore',
      'heroku',
      'mysql',
      'sample',
    ])
  })

  it('returns nothing when no title matches', () => {
    expect(filterGuides({ guides: GUIDES, topic: null, query: 'zzzqqq' })).toEqual([])
  })

  it('matches case-insensitively', () => {
    expect(ids(filterGuides({ guides: GUIDES, topic: null, query: 'MYSQL' }))[0]).toBe('mysql')
  })

  it('does not search descriptions', () => {
    expect(filterGuides({ guides: GUIDES, topic: null, query: 'replication' })).toEqual([])
  })
})

describe('padFeatured', () => {
  it('repeats a single featured guide into 3 unique slots', () => {
    const result = padFeatured({ featured: [GUIDES[7]], fallback: GUIDES })
    expect(ids(result)).toEqual(['sample', 'sample', 'sample'])
    expect(new Set(result.map((g) => g.slot)).size).toBe(3)
  })

  it('cycles two featured guides to fill 3 slots', () => {
    const result = padFeatured({ featured: GUIDES.slice(0, 2), fallback: GUIDES })
    expect(ids(result)).toEqual(['rds', 'auth0', 'rds'])
    expect(new Set(result.map((g) => g.slot)).size).toBe(3)
  })

  it('keeps the first 3 when more are featured', () => {
    const result = padFeatured({ featured: GUIDES.slice(0, 4), fallback: GUIDES })
    expect(ids(result)).toEqual(['rds', 'auth0', 'firebase-auth'])
  })

  it('falls back to the first guides when nothing is featured', () => {
    expect(ids(padFeatured({ featured: [], fallback: GUIDES }))).toEqual([
      'rds',
      'auth0',
      'firebase-auth',
    ])
  })

  it('returns nothing without any guides', () => {
    expect(padFeatured({ featured: [], fallback: [] })).toEqual([])
  })
})

describe('topic url param', () => {
  it('parses known slugs', () => {
    expect(parseTopicParam('edge-functions')).toBe('Edge Functions')
    expect(parseTopicParam('auth')).toBe('Auth')
  })

  it('round-trips every topic slug', () => {
    for (const { name } of TOPICS) expect(parseTopicParam(topicToSlug(name))).toBe(name)
  })

  it('ignores unknown or missing slugs', () => {
    expect(parseTopicParam('nope')).toBeNull()
    expect(parseTopicParam(null)).toBeNull()
  })

  it('sets and clears the topic while keeping other params', () => {
    expect(withTopicParam({ search: '?ref=x', topic: 'Supabase Platform' })).toBe(
      '?ref=x&topic=supabase-platform'
    )
    expect(withTopicParam({ search: '?topic=auth&ref=x', topic: null })).toBe('?ref=x')
    expect(withTopicParam({ search: '?topic=auth', topic: null })).toBe('')
  })
})

describe('emptyStateFor', () => {
  it('explains a search miss and offers to clear it', () => {
    expect(emptyStateFor({ topic: null, query: ' neon ' })).toEqual({
      message: 'No guide titles match “neon”.',
      action: 'Clear search',
      isSearch: true,
    })
  })

  it('names the topic when searching inside one', () => {
    expect(emptyStateFor({ topic: 'Auth', query: 'neon' }).message).toBe(
      'No guide titles match “neon” in Auth.'
    )
  })

  it('explains an empty topic and offers all guides', () => {
    expect(emptyStateFor({ topic: 'Queues', query: '' })).toEqual({
      message: 'There are no Queues guides yet.',
      action: 'Show all guides',
      isSearch: false,
    })
  })

  it('handles no guides at all', () => {
    expect(emptyStateFor({ topic: null, query: '   ' }).message).toBe('There are no guides yet.')
  })
})
