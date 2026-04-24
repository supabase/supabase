import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { AuthBrandingResponse } from './auth-branding-query'
import { authKeys } from './keys'
import { constructHeaders, fetchHandler, handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type AuthBrandingUpdateVariables = {
  projectRef: string
  branding: {
    brand_name?: string | null
    brand_logo_url?: string | null
    brand_color?: string | null
    brand_footer_text?: string | null
  }
}

export async function updateAuthBranding({
  projectRef,
  branding,
}: AuthBrandingUpdateVariables): Promise<AuthBrandingResponse> {
  const baseUrl = API_URL?.replace('/platform', '')
  const url = `${baseUrl}/v1/projects/${projectRef}/config/auth/branding`
  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const res = await fetchHandler(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(branding),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    handleError(body)
  }

  return res.json()
}

type AuthBrandingUpdateData = Awaited<ReturnType<typeof updateAuthBranding>>

export const useAuthBrandingUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AuthBrandingUpdateData, ResponseError, AuthBrandingUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthBrandingUpdateData, ResponseError, AuthBrandingUpdateVariables>({
    mutationFn: (vars) => updateAuthBranding(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: authKeys.authBranding(projectRef) })
      await queryClient.invalidateQueries({ queryKey: authKeys.authConfig(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update email branding: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
