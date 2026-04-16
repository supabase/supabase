'use server'

import { createContributeServerClient } from '~/lib/supabaseContribute.server'
import type {
  SimilarThreadFeedbackSubmission,
  SimilarThreadFeedbackResult,
} from '~/types/contribute'

const CONTRIBUTE_FEEDBACK_FN = 'contribute-feedback'

export async function submitSimilarThreadFeedback(
  submission: SimilarThreadFeedbackSubmission
): Promise<SimilarThreadFeedbackResult> {
  const supabase = await createContributeServerClient()

  const { data, error } = await supabase.functions.invoke<{ id: string }>(CONTRIBUTE_FEEDBACK_FN, {
    body: {
      action: 'create',
      parent_thread_id: submission.parentThreadId,
      similar_thread_key: submission.similarThreadKey ?? null,
      reaction: submission.reaction,
    },
  })

  if (error) {
    console.error('[SimilarThreadFeedback] create error:', error)
    return { success: false }
  }

  const id = data?.id
  if (!id) {
    console.error('[SimilarThreadFeedback] create: no id in response')
    return { success: false }
  }

  return { success: true, id }
}

export async function updateSimilarThreadFeedback(
  id: string,
  reaction: 'positive' | 'negative',
  feedback: string | null
): Promise<SimilarThreadFeedbackResult> {
  const supabase = await createContributeServerClient()

  const { data, error } = await supabase.functions.invoke<{ success: boolean }>(
    CONTRIBUTE_FEEDBACK_FN,
    {
      body: {
        action: 'update',
        id,
        reaction,
        feedback: feedback ?? null,
      },
    }
  )

  if (error) {
    console.error('[SimilarThreadFeedback] update error:', error)
    return { success: false }
  }

  if (!data?.success) {
    console.error('[SimilarThreadFeedback] update: unexpected response')
    return { success: false }
  }

  return { success: true }
}
