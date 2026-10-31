import { z } from 'zod'

export type FeedbackVote = z.infer<typeof feedbackVoteSchema>

export type FeedbackCommentPayload = z.infer<typeof feedbackCommentPayloadSchema>

export const FEEDBACK_LIMITS = {
  comment: 2000,
  page: 512,
} as const

const feedbackVoteSchema = z.enum(['yes', 'no'])

const pageSchema = z.string().max(FEEDBACK_LIMITS.page).startsWith('/')

const querySchema = z.record(z.string(), z.string())

// the send adds user_id from the session
export const feedbackCommentPayloadSchema = z
  .object({
    vote: feedbackVoteSchema,
    page: pageSchema,
    comment: z.string().trim().min(1).max(FEEDBACK_LIMITS.comment),
    metadata: z.object({ query: querySchema }).strict(),
  })
  .strict()

export const feedbackVotePayloadSchema = z
  .object({
    vote: feedbackVoteSchema,
    page: pageSchema,
    metadata: z.object({ query: querySchema, source: z.literal('dock') }).strict(),
  })
  .strict()
