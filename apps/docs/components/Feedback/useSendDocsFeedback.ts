'use client'

import type { SupabaseClient } from '@supabase/supabase-js'
import { useMutation } from '@tanstack/react-query'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { gotrueClient, type Database } from 'common'
import type { Dispatch } from 'react'

import type {
  FeedbackDockAction,
  FeedbackDraft,
  FeedbackSubmitProgress,
  FeedbackTargetPage,
} from './feedback-dock.reducer'
import type { FeedbackVote } from './feedback-schema'
import { FeedbackSendError, sendDocsFeedback } from './send-docs-feedback'

export interface SendDocsFeedbackVariables {
  client: SupabaseClient<Database>
  vote: FeedbackVote
  page: FeedbackTargetPage
  draft: FeedbackDraft
  query: Record<string, string>
  progress: FeedbackSubmitProgress
  submissionId: number
}

export const useSendDocsFeedback = ({ dispatch }: { dispatch: Dispatch<FeedbackDockAction> }) => {
  const sendTelemetryEvent = useSendTelemetryEvent()

  return useMutation({
    mutationFn: async ({
      client,
      vote,
      page,
      draft,
      query,
      progress,
    }: SendDocsFeedbackVariables) => {
      const { data } = await gotrueClient.getSession()
      const userId = data.session?.user.id ?? null

      await sendDocsFeedback({
        client,
        vote,
        page: page.pathname,
        draft,
        query,
        userId,
        progress,
      })

      return { isSignedIn: userId !== null }
    },
    onSuccess: ({ isSignedIn }, { vote, draft, submissionId }) => {
      dispatch({ type: 'submitSucceeded', submissionId })
      sendTelemetryEvent({
        action: 'docs_feedback_submitted',
        properties: {
          response: vote,
          pinCount: draft.pins.length,
          imageCount: draft.images.length,
          commentLength: draft.comment.length,
          isSignedIn,
        },
      })
    },
    onError: (error, { vote, progress, submissionId }) => {
      const isOffline = !navigator.onLine
      const sendError =
        error instanceof FeedbackSendError
          ? error
          : new FeedbackSendError({ kind: 'insert_failed', progress, cause: error })

      if (sendError.progress === 'comment_saved') dispatch({ type: 'commentSaved', submissionId })
      dispatch({ type: 'submitFailed', submissionId, error: { kind: sendError.kind, isOffline } })
      sendTelemetryEvent({
        action: 'docs_feedback_submission_failed',
        properties: { response: vote, isOffline },
      })
    },
  })
}
