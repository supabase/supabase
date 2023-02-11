import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { put } from 'lib/common/fetch'
import { API_ADMIN_URL } from 'lib/constants'
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

  const response = (await put(`${API_ADMIN_URL}/projects/${projectRef}/ssl-enforcement`, {
    requestedConfig,
  })) as SSLEnforcementUpdateResponse
  if (response.error) throw response.error

  return response
}

type SSLEnforcementUpdateData = Awaited<ReturnType<typeof updateSSLEnforcement>>

export const useSSLEnforcementUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<SSLEnforcementUpdateData, unknown, SSLEnforcementUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SSLEnforcementUpdateData, unknown, SSLEnforcementUpdateVariables>(
    (vars) => updateSSLEnforcement(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(sslEnforcementKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
