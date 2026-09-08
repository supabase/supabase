import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { authKeys } from './keys'
import type { components } from '@/data/api'
import { handleError, patch } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type AuthHooksUpdateVariables = {
  projectRef: string
  config: components['schemas']['UpdateGoTrueConfigHooksBody']
}

/**
 * Updates project Auth Hook configuration via the partial-update config endpoint.
 *
 * Routes through the general `/platform/auth/{ref}/config` endpoint instead of `/config/hooks`
 * to avoid overwriting unrelated custom SMTP settings and rate limits.
 *
 * @param variables - The project reference and hook configuration payload.
 * @returns The updated GoTrue configuration response.
 */
export async function updateAuthHooks({ projectRef, config }: AuthHooksUpdateVariables) {
  // Route through the general /config endpoint instead of /config/hooks.
  // The hooks-specific endpoint has a backend bug that overwrites the entire
  // GoTrue config, silently wiping custom SMTP settings and resetting
  // RATE_LIMIT_EMAIL_SENT. The general endpoint handles partial updates
  // correctly. See https://github.com/supabase/supabase/issues/49873
  const { data, error } = await patch('/platform/auth/{ref}/config', {
    params: { path: { ref: projectRef } },
    body: config as components['schemas']['UpdateGoTrueConfigBody'],
  })

  if (error) handleError(error)
  return data
}

type AuthHooksUpdateData = Awaited<ReturnType<typeof updateAuthHooks>>

export const useAuthHooksUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AuthHooksUpdateData, ResponseError, AuthHooksUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthHooksUpdateData, ResponseError, AuthHooksUpdateVariables>({
    mutationFn: (vars) => updateAuthHooks(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: authKeys.authConfig(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update auth hooks: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
