import { StorageApiError, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'common'

import type {
  FeedbackDraft,
  FeedbackSendErrorKind,
  FeedbackSubmitProgress,
} from './feedback-dock.reducer'
import type { FeedbackImage } from './feedback-images.utils'
import {
  FEEDBACK_IMAGES_BUCKET,
  feedbackCommentPayloadSchema,
  feedbackVotePayloadSchema,
  type FeedbackPin,
  type FeedbackVote,
} from './feedback-schema'

export const ATTACHMENT_BYTE_LIMITS = { pins: 15_000 } as const

export const isAttachmentsTooLarge = ({ pins }: { pins: FeedbackPin[] }): boolean =>
  getByteLength(JSON.stringify(pins)) > ATTACHMENT_BYTE_LIMITS.pins

export class FeedbackSendError extends Error {
  readonly kind: FeedbackSendErrorKind
  readonly progress: FeedbackSubmitProgress

  constructor({
    kind,
    progress,
    cause,
  }: {
    kind: FeedbackSendErrorKind
    progress: FeedbackSubmitProgress
    cause?: unknown
  }) {
    super(`Docs feedback send failed: ${kind}`, { cause })
    this.name = 'FeedbackSendError'
    this.kind = kind
    this.progress = progress
  }
}

export const sendDocsFeedback = async ({
  client,
  vote,
  page,
  draft,
  query,
  userId,
  progress,
}: {
  client: SupabaseClient<Database>
  vote: FeedbackVote
  page: string
  draft: FeedbackDraft
  query: Record<string, string>
  userId: string | null
  progress: FeedbackSubmitProgress
}): Promise<void> => {
  const votePayload = feedbackVotePayloadSchema.safeParse({
    vote,
    page,
    metadata: { query, source: 'dock' },
  })
  if (!votePayload.success) {
    throw new FeedbackSendError({ kind: 'invalid_payload', progress, cause: votePayload.error })
  }

  if (progress === 'idle') {
    if (isAttachmentsTooLarge(draft)) {
      throw new FeedbackSendError({ kind: 'attachments_too_large', progress })
    }

    const commentPayload = feedbackCommentPayloadSchema.safeParse({
      vote,
      page,
      comment: draft.comment,
      pins: draft.pins,
      images: draft.images.map((image) => image.path),
      metadata: { query },
    })
    if (!commentPayload.success) {
      throw new FeedbackSendError({
        kind: 'invalid_payload',
        progress,
        cause: commentPayload.error,
      })
    }

    await uploadImages({ client, images: draft.images, progress })

    const { error } = await client
      .from('feedback_comments')
      .insert({ ...commentPayload.data, user_id: userId })
    if (error) throw new FeedbackSendError({ kind: 'insert_failed', progress, cause: error })
  }

  const { error } = await client.from('feedback').insert(votePayload.data)
  if (error) {
    throw new FeedbackSendError({ kind: 'insert_failed', progress: 'comment_saved', cause: error })
  }
}

const uploadImages = async ({
  client,
  images,
  progress,
}: {
  client: SupabaseClient<Database>
  images: FeedbackImage[]
  progress: FeedbackSubmitProgress
}): Promise<void> => {
  const bucket = client.storage.from(FEEDBACK_IMAGES_BUCKET)
  const results = await Promise.all(
    images.map((image) =>
      bucket.upload(image.path, image.file, { contentType: image.file.type, upsert: false })
    )
  )
  const failure = results.find(({ error }) => error && !isAlreadyUploaded(error))
  if (failure) {
    throw new FeedbackSendError({ kind: 'upload_failed', progress, cause: failure.error })
  }
}

// a retry re-sends paths the failed attempt already stored; older storage
// servers report the duplicate as http 400 with statusCode '409' in the body
const isAlreadyUploaded = (error: Error): boolean =>
  error instanceof StorageApiError && (error.status === 409 || error.statusCode === '409')

const getByteLength = (value: string) => new TextEncoder().encode(value).length
