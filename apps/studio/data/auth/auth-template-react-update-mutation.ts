import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { authKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type AuthTemplateReactUpdateVariables = {
  projectRef: string
  template: string
  source: string
}

export type AuthTemplateReactUpdateResponse = {
  template_type: string
  rendered_html: string
}

export async function updateAuthTemplateReact({
  projectRef,
  template,
  source,
}: AuthTemplateReactUpdateVariables): Promise<AuthTemplateReactUpdateResponse> {
  const response = await fetch(
    `${API_URL}/platform/auth/${projectRef}/templates/${template}/react`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
    }
  )
  const body = await response.json()

  if (!response.ok) {
    handleError(body)
  }

  return body
}

export type AuthTemplateReactUpdateData = Awaited<ReturnType<typeof updateAuthTemplateReact>>

export const useAuthTemplateReactUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    AuthTemplateReactUpdateData,
    ResponseError,
    AuthTemplateReactUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthTemplateReactUpdateData, ResponseError, AuthTemplateReactUpdateVariables>({
    mutationFn: (vars) => updateAuthTemplateReact(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, template } = variables
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: authKeys.reactTemplate(projectRef, template) }),
        queryClient.invalidateQueries({ queryKey: authKeys.authConfig(projectRef) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to save react email template: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
