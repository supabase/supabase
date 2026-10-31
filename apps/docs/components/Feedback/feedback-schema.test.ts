import { type Json } from 'common'
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  feedbackCommentPayloadSchema,
  feedbackVotePayloadSchema,
  type FeedbackCommentPayload,
} from './feedback-schema'

const createPayload = (overrides: Partial<FeedbackCommentPayload> = {}) => ({
  vote: 'no',
  page: '/guides/getting-started',
  comment: 'The install command fails on Windows.',
  metadata: { query: { language: 'js' } },
  ...overrides,
})

describe('feedbackCommentPayloadSchema', () => {
  it('trims the comment', () => {
    expect(
      feedbackCommentPayloadSchema.parse(createPayload({ comment: '  Broken  ' })).comment
    ).toBe('Broken')
  })

  it.each([[''], ['   '], ['\n\t ']])(
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

  it('produces types that assign to the generated Json column type', () => {
    expectTypeOf<FeedbackCommentPayload['metadata']>().toMatchTypeOf<Json>()
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
