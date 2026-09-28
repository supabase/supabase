import { z } from 'zod'

import {
  MAX_PATHNAME_LENGTH,
  MAX_TAB_PARAMS,
  TAB_PARAM_KEY_PATTERN,
  TAB_PARAM_VALUE_PATTERN,
} from './Feedback.utils'

export type FeedbackVote = z.infer<typeof feedbackVoteSchema>

export type FeedbackPin = z.infer<typeof feedbackPinSchema>

export type FeedbackCommentPayload = z.infer<typeof feedbackCommentPayloadSchema>

export type FeedbackVotePayload = z.infer<typeof feedbackVotePayloadSchema>

export const FEEDBACK_LIMITS = {
  comment: 2000,
  page: 512,
  pathname: MAX_PATHNAME_LENGTH,
  pins: 10,
  images: 5,
  imageBytes: 5 * 1024 * 1024,
  tag: 20,
  role: 40,
  name: 120,
  text: 80,
  headingId: 120,
  headingText: 120,
  queryKeys: MAX_TAB_PARAMS,
  queryKey: 40,
  queryValue: 64,
} as const

// matches the docs-feedback-images bucket's allowed types
export const FEEDBACK_IMAGE_EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
} as const

export const FEEDBACK_IMAGES_BUCKET = 'docs-feedback-images'

export const feedbackVoteSchema = z.enum(['yes', 'no'])

const pathnameSchema = z
  .string()
  .max(FEEDBACK_LIMITS.pathname)
  .regex(/^\/[^?#]*$/, 'Must be a pathname without query string or hash')

const elementFields = {
  pathname: pathnameSchema,
  tag: z.string().min(1).max(FEEDBACK_LIMITS.tag),
  role: z.string().min(1).max(FEEDBACK_LIMITS.role),
  name: z.string().max(FEEDBACK_LIMITS.name).nullable(),
  text: z.string().max(FEEDBACK_LIMITS.text).nullable(),
  headingId: z.string().max(FEEDBACK_LIMITS.headingId).nullable(),
  headingText: z.string().max(FEEDBACK_LIMITS.headingText).nullable(),
}

export const feedbackPinSchema = z.object(elementFields).strict()

// same shape the storage policy allows
export const feedbackImagePathSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/)

const pageSchema = z.string().max(FEEDBACK_LIMITS.page).startsWith('/')

const querySchema = z
  .record(z.string().regex(TAB_PARAM_KEY_PATTERN), z.string().regex(TAB_PARAM_VALUE_PATTERN))
  .refine((query) => Object.keys(query).length <= FEEDBACK_LIMITS.queryKeys, {
    message: `At most ${FEEDBACK_LIMITS.queryKeys} query params`,
  })

// user_id is added by the send from the session
export const feedbackCommentPayloadSchema = z
  .object({
    vote: feedbackVoteSchema,
    page: pageSchema,
    comment: z.string().trim().min(1).max(FEEDBACK_LIMITS.comment),
    pins: z.array(feedbackPinSchema).max(FEEDBACK_LIMITS.pins),
    images: z.array(feedbackImagePathSchema).max(FEEDBACK_LIMITS.images),
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
