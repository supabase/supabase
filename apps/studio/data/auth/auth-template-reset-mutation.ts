import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ProjectAuthConfigData } from './auth-config-query'
import { authKeys } from './keys'
import { type AuthTemplateResetType } from '@/components/interfaces/Auth/EmailTemplates/EmailTemplates.types'
import { handleError, post } from '@/data/fetchers'
import { lintKeys } from '@/data/lint/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type AuthTemplateResetVariables = {
  projectRef: string
  template: AuthTemplateResetType
}

async function resetAuthTemplate({ projectRef, template }: AuthTemplateResetVariables) {
  const { data, error } = await post('/platform/auth/{ref}/templates/{template}/reset', {
    params: { path: { ref: projectRef, template } },
  })

  if (error) handleError(error)
  return data
}

type AuthTemplateResetData = Awaited<ReturnType<typeof resetAuthTemplate>>

export const useAuthTemplateResetMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AuthTemplateResetData, ResponseError, AuthTemplateResetVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthTemplateResetData, ResponseError, AuthTemplateResetVariables>({
    mutationFn: (vars) => resetAuthTemplate(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      queryClient.setQueryData<ProjectAuthConfigData>(authKeys.authConfig(projectRef), data)
      await queryClient.invalidateQueries({
        queryKey: authKeys.authConfig(projectRef),
        refetchType: 'none',
      })
      await onSuccess?.(data, variables, context)

      void queryClient
        .invalidateQueries({ queryKey: lintKeys.lint(projectRef) })
        .then(() =>
          queryClient.refetchQueries({
            queryKey: lintKeys.lint(projectRef),
            type: 'active',
          })
        )
        .catch(() => undefined)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to reset email template: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
