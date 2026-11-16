import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import z from 'zod/v4'

import type { AlertIssuesData, AlertIssuesError } from './alert-issues-query'
import { alertIssuesKeys } from './keys'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import { isStudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type AlertIssuesReadVariables = {
  projectRef: string
  alertIssueIds: string[]
  read: boolean
}

const readResultSchema = z.object({ count: z.number() })

async function markAlertIssuesRead({ projectRef, alertIssueIds, read }: AlertIssuesReadVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await fetchPost<unknown>(
    `${API_URL}/platform/projects/${projectRef}/alerts/issues/reads`,
    { alert_issue_ids: alertIssueIds, read }
  )
  if (isStudioError(response)) throw response

  return readResultSchema.parse(response)
}

type AlertIssuesReadData = Awaited<ReturnType<typeof markAlertIssuesRead>>

export const useAlertIssuesReadMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AlertIssuesReadData, AlertIssuesError, AlertIssuesReadVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAlertIssuesRead,
    async onSuccess(data, variables, context) {
      // Reads are written asynchronously, so update the cached list directly.
      const ids = new Set(variables.alertIssueIds)
      queryClient.setQueryData<AlertIssuesData>(
        alertIssuesKeys.list(variables.projectRef),
        (issues) =>
          issues?.map((issue) =>
            ids.has(issue.alert_issue_id) ? { ...issue, unread: !variables.read } : issue
          )
      )
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to update read state: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
