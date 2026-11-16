import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import z from 'zod/v4'

import type { AlertIssueTypesData } from './alert-issue-types-query'
import type { AlertIssuesError } from './alert-issues-query'
import { alertIssuesKeys } from './keys'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { isStudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type AlertIssueTypeSilenceVariables = {
  projectRef: string
  ruleKey: string
  /** `false` silences the alert issue type for the project, `true` deletes its silence. */
  enabled: boolean
  silenceId?: string | null
}

type AlertIssueTypeSilenceResult = { silenceId: string | null }

const silenceSchema = z.object({ id: z.coerce.string() })

async function setAlertIssueTypeSilence({
  projectRef,
  ruleKey,
  enabled,
  silenceId,
}: AlertIssueTypeSilenceVariables): Promise<AlertIssueTypeSilenceResult> {
  if (!projectRef) throw new Error('projectRef is required')
  const base = `${API_URL}/platform/projects/${projectRef}/alerts/silences`

  if (enabled) {
    if (!silenceId) throw new Error('silenceId is required to re-enable an alert issue type')
    const response = await fetchPost<unknown>(
      `${base}/${encodeURIComponent(silenceId)}`,
      {},
      { method: 'DELETE' }
    )
    if (isStudioError(response)) throw response
    return { silenceId: null }
  }

  const response = await fetchPost<unknown>(base, { rule_key: ruleKey })
  if (isStudioError(response)) throw response
  return { silenceId: silenceSchema.parse(response).id }
}

export const useAlertIssueTypeSilenceMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    AlertIssueTypeSilenceResult,
    AlertIssuesError,
    AlertIssueTypeSilenceVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setAlertIssueTypeSilence,
    async onSuccess(data, variables, context) {
      queryClient.setQueryData<AlertIssueTypesData>(
        alertIssuesKeys.types(variables.projectRef),
        (types) =>
          types?.map((type) =>
            type.rule_key === variables.ruleKey
              ? { ...type, silenced: !variables.enabled, silence_id: data.silenceId }
              : type
          )
      )
      await queryClient.invalidateQueries({ queryKey: alertIssuesKeys.list(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to update alert issue type: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
