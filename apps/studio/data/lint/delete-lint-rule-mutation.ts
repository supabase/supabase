import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { lintKeys } from './keys'

export type LintRuleDeleteVariables = {
  projectRef: string
  ids: string[]
}

export async function deleteLintRule({ projectRef, ids }: LintRuleDeleteVariables) {
  const { data, error } = await del('/platform/projects/{ref}/notifications/advisor/exceptions', {
    params: { path: { ref: projectRef }, query: { ids } },
  })

  if (error) handleError(error)
  return data
}

type LintRuleDeleteData = Awaited<ReturnType<typeof deleteLintRule>>

export const useLintRuleDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<LintRuleDeleteData, ResponseError, LintRuleDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<LintRuleDeleteData, ResponseError, LintRuleDeleteVariables>(
    (vars) => deleteLintRule(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await Promise.all([
          queryClient.invalidateQueries(lintKeys.lintRules(projectRef)),
          queryClient.invalidateQueries(lintKeys.lint(projectRef)),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete lint rule: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
