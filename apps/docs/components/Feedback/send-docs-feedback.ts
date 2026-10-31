import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'common'

import type {
  FeedbackDraft,
  FeedbackSendErrorKind,
  FeedbackSubmitProgress,
} from './feedback-dock.reducer'
import {
  feedbackCommentPayloadSchema,
  feedbackVotePayloadSchema,
  type FeedbackVote,
} from './feedback-schema'

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

  // a retry after the comment row saved sends only the vote row
  if (progress === 'idle') {
    const commentPayload = feedbackCommentPayloadSchema.safeParse({
      vote,
      page,
      comment: draft.comment,
      metadata: { query },
    })
    if (!commentPayload.success) {
      throw new FeedbackSendError({
        kind: 'invalid_payload',
        progress,
        cause: commentPayload.error,
      })
    }

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
