import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { configKeys } from './keys'

export type ComplianceConfigUpdateVariables = {
  projectRef: string
  isSensitive: boolean
}

export async function updateComplianceConfig({
  projectRef,
  isSensitive,
}: ComplianceConfigUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await patch('/platform/projects/{ref}/settings/sensitivity', {
    params: { path: { ref: projectRef } },
    body: { is_sensitive: isSensitive },
  })

  if (error) handleError(error)
  return data
}

type ComplianceConfigUpdateData = Awaited<ReturnType<typeof updateComplianceConfig>>

export const useComplianceConfigUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ComplianceConfigUpdateData, ResponseError, ComplianceConfigUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ComplianceConfigUpdateData, ResponseError, ComplianceConfigUpdateVariables>(
    (vars) => updateComplianceConfig(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(configKeys.settingsV2(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update project compliance configuration: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
