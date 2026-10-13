import { describe, expect, it } from 'vitest'

import {
  filterGuides,
  padFeatured,
  parseTopicParam,
  relatedGuides,
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
  it('filters by topic', () => {
    expect(ids(filterGuides({ guides: GUIDES, topic: 'Auth' }))).toEqual(['auth0', 'firebase-auth'])
  })

  it('returns every guide without a topic', () => {
    expect(filterGuides({ guides: GUIDES, topic: null })).toBe(GUIDES)
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

describe('relatedGuides', () => {
  const firebaseAuth = guide('firebase-auth', 'Migrate from Firebase Auth to Supabase', [
    'Migration',
    'Auth',
  ])

  it('prefers the subject topic over the format topic', () => {
    const related = relatedGuides({ guide: firebaseAuth, guides: GUIDES })
    expect(related?.topic).toBe('Auth')
    expect(related?.guides.map((guide) => guide.id)).toEqual(['auth0'])
  })

  it('ranks guides sharing more topics first', () => {
    const rds = guide('rds', 'Migrate from Amazon RDS to Supabase', ['Migration', 'Database'])
    expect(relatedGuides({ guide: rds, guides: GUIDES })?.guides.map((guide) => guide.id)).toEqual([
      'firestore',
      'heroku',
      'mysql',
    ])
  })

  it('falls back to the format topic when no other guide shares the subject', () => {
    const storage = guide('firebase-storage', 'Migrate from Firebase Storage to Supabase', [
      'Migration',
      'Storage',
    ])
    expect(relatedGuides({ guide: storage, guides: GUIDES })?.topic).toBe('Migration')
  })

  it('returns null when no other guide shares a topic', () => {
    expect(relatedGuides({ guide: firebaseAuth, guides: [firebaseAuth] })).toBeNull()
  })
})
