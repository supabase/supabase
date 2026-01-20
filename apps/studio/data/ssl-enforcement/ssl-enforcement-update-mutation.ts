import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, put } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { sslEnforcementKeys } from './keys'

export type SSLEnforcementUpdateVariables = {
  projectRef: string
  requestedConfig: { database: boolean }
}

export type SSLEnforcementUpdateResponse = {
  appliedSuccessfully: boolean
  currentConfig: { database: boolean }
  error?: any
}

export async function updateSSLEnforcement({
  projectRef,
  requestedConfig,
}: SSLEnforcementUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await put(`/v1/projects/{ref}/ssl-enforcement`, {
    params: { path: { ref: projectRef } },
    body: { requestedConfig },
  })

  if (error) handleError(error)
  return data
}

type SSLEnforcementUpdateData = Awaited<ReturnType<typeof updateSSLEnforcement>>

export const useSSLEnforcementUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SSLEnforcementUpdateData, ResponseError, SSLEnforcementUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SSLEnforcementUpdateData, ResponseError, SSLEnforcementUpdateVariables>({
    mutationFn: (vars) => updateSSLEnforcement(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: sslEnforcementKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update SSL enforcement: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
