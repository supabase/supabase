import { useMutation } from '@tanstack/react-query'

import { getAlertLogEventWindow } from './alert-issue-events-query'
import { alertLogEventsSchema, type AlertLogEvents } from './alert-issue.schema'
import type { AlertIssuesError } from './alert-issues-query'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { isStudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type AlertRulePreviewVariables = { projectRef: string; lql: string }

/** Runs an LQL filter over the last hour. */
async function previewAlertRule({
  projectRef,
  lql,
}: AlertRulePreviewVariables): Promise<AlertLogEvents> {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await fetchPost<unknown>(
    `${API_URL}/platform/projects/${projectRef}/alerts/preview`,
    { lql, ...getAlertLogEventWindow('1h') }
  )
  if (isStudioError(response)) throw response

  return alertLogEventsSchema.parse(response)
}

export const useAlertRulePreviewMutation = (
  options: Omit<
    UseCustomMutationOptions<AlertLogEvents, AlertIssuesError, AlertRulePreviewVariables>,
    'mutationFn'
  > = {}
) => useMutation({ mutationFn: previewAlertRule, ...options })
