import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

import { logSettingsKeys } from './keys'
import type { LogSettingsData, LogSettingsError } from './log-settings-query'
import { handleError, patch } from '@/data/fetchers'
import type { UseCustomMutationOptions } from '@/types'

export type LogSettingsUpdateVariables = {
  projectRef: string
  payload: components['schemas']['UpdateProjectLogSettingsBody']
}

async function updateLogSettings({ projectRef, payload }: LogSettingsUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await patch('/platform/projects/{ref}/analytics/log-settings', {
    params: { path: { ref: projectRef } },
    body: payload,
  })

  if (error) handleError(error)
  return data
}

export const useLogSettingsUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<LogSettingsData, LogSettingsError, LogSettingsUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<LogSettingsData, LogSettingsError, LogSettingsUpdateVariables>({
    mutationFn: updateLogSettings,
    async onSuccess(data, variables, context) {
      queryClient.setQueryData(logSettingsKeys.detail(variables.projectRef), data)
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to update log settings: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
