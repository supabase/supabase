import { type Json } from 'common'
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  FEEDBACK_LIMITS,
  feedbackCommentPayloadSchema,
  feedbackImagePathSchema,
  feedbackPinSchema,
  feedbackVotePayloadSchema,
  type FeedbackCommentPayload,
  type FeedbackPin,
} from './feedback-schema'

const PIN: FeedbackPin = {
  pathname: '/guides/getting-started',
  tag: 'pre',
  role: 'code',
  name: null,
  text: 'npm install @supabase/supabase-js',
  headingId: 'install',
  headingText: 'Install',
}

const IMAGE_PATH = '0f8e1c2a-3b4d-4e5f-8a9b-0c1d2e3f4a5b.png'

const createPayload = (overrides: Partial<FeedbackCommentPayload> = {}) => ({
  vote: 'no',
  page: '/guides/getting-started',
  comment: 'The install command fails on Windows.',
  pins: [PIN],
  images: [IMAGE_PATH],
  metadata: { query: { language: 'js' } },
  ...overrides,
})

describe('feedbackCommentPayloadSchema', () => {
  it('accepts a valid draft', () => {
    expect(feedbackCommentPayloadSchema.safeParse(createPayload()).success).toBe(true)
  })

  it('accepts text-only feedback', () => {
    expect(
      feedbackCommentPayloadSchema.safeParse(createPayload({ pins: [], images: [] })).success
    ).toBe(true)
  })

  it('trims the comment', () => {
    expect(
      feedbackCommentPayloadSchema.parse(createPayload({ comment: '  Broken  ' })).comment
    ).toBe('Broken')
  })

  it.each([[''], ['   '], ['\n\t ']])(
    'rejects an empty or whitespace-only comment %j',
    (comment) => {
      expect(feedbackCommentPayloadSchema.safeParse(createPayload({ comment })).success).toBe(false)
    }
  )

  it('rejects a comment over 2000 characters', () => {
    expect(
      feedbackCommentPayloadSchema.safeParse(createPayload({ comment: 'a'.repeat(2001) })).success
    ).toBe(false)
    expect(
      feedbackCommentPayloadSchema.safeParse(createPayload({ comment: 'a'.repeat(2000) })).success
    ).toBe(true)
  })

  it('rejects 11 pins and 6 images', () => {
    expect(
      feedbackCommentPayloadSchema.safeParse(createPayload({ pins: Array(11).fill(PIN) })).success
    ).toBe(false)
    expect(
      feedbackCommentPayloadSchema.safeParse(createPayload({ images: Array(6).fill(IMAGE_PATH) }))
        .success
    ).toBe(false)
  })

  it('rejects unknown keys', () => {
    expect(feedbackCommentPayloadSchema.safeParse({ ...createPayload(), title: 'x' }).success).toBe(
      false
    )
    expect(
      feedbackCommentPayloadSchema.safeParse({
        ...createPayload(),
        metadata: { query: {}, source: 'dock' },
      }).success
    ).toBe(false)
  })

  it('rejects an invalid vote or page', () => {
    expect(
      feedbackCommentPayloadSchema.safeParse({ ...createPayload(), vote: 'maybe' }).success
    ).toBe(false)
    expect(feedbackCommentPayloadSchema.safeParse(createPayload({ page: 'guides' })).success).toBe(
      false
    )
    expect(
      feedbackCommentPayloadSchema.safeParse(createPayload({ page: `/${'a'.repeat(512)}` })).success
    ).toBe(false)
  })

  it('rejects query params that fail the slug patterns or exceed 10 keys', () => {
    const parse = (query: Record<string, string>) =>
      feedbackCommentPayloadSchema.safeParse(createPayload({ metadata: { query } })).success

    expect(parse({ token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.sig' })).toBe(false)
    expect(parse({ database: 'MS SQL' })).toBe(true)
    expect(parse({ 'a.b': 'js' })).toBe(false)
    expect(
      parse(Object.fromEntries(Array.from({ length: 11 }, (_, index) => [`k${index}`, 'v'])))
    ).toBe(false)
  })

  it('produces types that assign to the generated Json column type', () => {
    expectTypeOf<FeedbackPin[]>().toMatchTypeOf<Json>()
    expectTypeOf<FeedbackCommentPayload['metadata']>().toMatchTypeOf<Json>()
  })
})

describe('feedbackPinSchema', () => {
  it('rejects a pathname that does not start with /', () => {
    expect(feedbackPinSchema.safeParse({ ...PIN, pathname: 'guides/auth' }).success).toBe(false)
    expect(feedbackPinSchema.safeParse({ ...PIN, pathname: 'https://evil.test/' }).success).toBe(
      false
    )
  })

  it('rejects a pathname carrying a query string or hash', () => {
    expect(feedbackPinSchema.safeParse({ ...PIN, pathname: '/a?token=x' }).success).toBe(false)
    expect(feedbackPinSchema.safeParse({ ...PIN, pathname: '/a#token=x' }).success).toBe(false)
  })

  it('rejects unknown keys and over-long fields', () => {
    expect(feedbackPinSchema.safeParse({ ...PIN, value: 'secret' }).success).toBe(false)
    expect(feedbackPinSchema.safeParse({ ...PIN, text: 'a'.repeat(81) }).success).toBe(false)
    expect(feedbackPinSchema.safeParse({ ...PIN, name: 'a'.repeat(121) }).success).toBe(false)
    expect(feedbackPinSchema.safeParse({ ...PIN, tag: 'a'.repeat(21) }).success).toBe(false)
  })
})

describe('feedbackImagePathSchema', () => {
  it('accepts a uuid name with an allowed extension', () => {
    const uuid = IMAGE_PATH.replace('.png', '')
    for (const extension of ['png', 'jpg', 'webp']) {
      expect(feedbackImagePathSchema.safeParse(`${uuid}.${extension}`).success).toBe(true)
    }
  })

  it('rejects other extensions, folders and non-uuid names', () => {
    const uuid = IMAGE_PATH.replace('.png', '')
    expect(feedbackImagePathSchema.safeParse(`${uuid}.gif`).success).toBe(false)
    expect(feedbackImagePathSchema.safeParse(`folder/${IMAGE_PATH}`).success).toBe(false)
    expect(feedbackImagePathSchema.safeParse('screenshot.png').success).toBe(false)
    expect(feedbackImagePathSchema.safeParse(IMAGE_PATH.toUpperCase()).success).toBe(false)
  })
})

describe('feedbackVotePayloadSchema', () => {
  it('requires source dock', () => {
    const payload = { vote: 'yes', page: '/a', metadata: { query: {}, source: 'dock' } }

    expect(feedbackVotePayloadSchema.safeParse(payload).success).toBe(true)
    expect(
      feedbackVotePayloadSchema.safeParse({ ...payload, metadata: { query: {} } }).success
    ).toBe(false)
  })
})

describe('maximal payload size', () => {
  // db byte caps from the migration (pg_column_size)
  const DB_BYTE_CAPS = { pins: 16384, images: 1024, metadata: 2048 }
  const HEADROOM = 0.75

  const maxString = (length: number) => 'a'.repeat(length)
  const maxPathname = `/${maxString(FEEDBACK_LIMITS.pathname - 1)}`
  const maxPin: FeedbackPin = {
    pathname: maxPathname,
    tag: maxString(FEEDBACK_LIMITS.tag),
    role: maxString(FEEDBACK_LIMITS.role),
    name: maxString(FEEDBACK_LIMITS.name),
    text: maxString(FEEDBACK_LIMITS.text),
    headingId: maxString(FEEDBACK_LIMITS.headingId),
    headingText: maxString(FEEDBACK_LIMITS.headingText),
  }
  const maxQuery = Object.fromEntries(
    Array.from({ length: FEEDBACK_LIMITS.queryKeys }, (_, index) => [
      `${index}${maxString(FEEDBACK_LIMITS.queryKey - 1)}`,
      maxString(FEEDBACK_LIMITS.queryValue),
    ])
  )
  const maxPayload = {
    vote: 'yes',
    page: `/${maxString(FEEDBACK_LIMITS.page - 1)}`,
    comment: maxString(FEEDBACK_LIMITS.comment),
    pins: Array(FEEDBACK_LIMITS.pins).fill(maxPin),
    images: Array(FEEDBACK_LIMITS.images).fill(IMAGE_PATH),
    metadata: { query: maxQuery },
  }

  it('is a valid payload', () => {
    expect(feedbackCommentPayloadSchema.safeParse(maxPayload).success).toBe(true)
    expect(
      feedbackVotePayloadSchema.safeParse({
        vote: 'yes',
        page: maxPayload.page,
        metadata: { query: maxQuery, source: 'dock' },
      }).success
    ).toBe(true)
  })

  it.each([['pins' as const], ['images' as const]])(
    'keeps %s under 75% of the DB cap',
    (column) => {
      expect(JSON.stringify(maxPayload[column]).length).toBeLessThanOrEqual(
        DB_BYTE_CAPS[column] * HEADROOM
      )
    }
  )

  it('keeps vote-row metadata under 75% of the DB cap', () => {
    expect(JSON.stringify({ query: maxQuery, source: 'dock' }).length).toBeLessThanOrEqual(
      DB_BYTE_CAPS.metadata * HEADROOM
    )
  })
})
