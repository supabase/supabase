import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { lintKeys } from './keys'

type ExceptionPayload = components['schemas']['CreateNotificationExceptionsBody']['exceptions'][0]

export type LintRuleCreateVariables = {
  projectRef: string
  exception: ExceptionPayload
}

export async function createLintRule({ projectRef, exception }: LintRuleCreateVariables) {
  const { data, error } = await post('/platform/projects/{ref}/notifications/advisor/exceptions', {
    params: { path: { ref: projectRef } },
    body: {
      exceptions: [exception],
    },
  })

  if (error) handleError(error)
  return data
}

type LintRuleCreateData = Awaited<ReturnType<typeof createLintRule>>

export const useLintRuleCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<LintRuleCreateData, ResponseError, LintRuleCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<LintRuleCreateData, ResponseError, LintRuleCreateVariables>({
    mutationFn: (vars) => createLintRule(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: lintKeys.lintRules(projectRef) }),
        queryClient.invalidateQueries({ queryKey: lintKeys.lint(projectRef) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create lint rule: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
