import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ValidateSpamVariables = {
  projectRef: string
  template: components['schemas']['ValidateSpamBodyDto']
}
export type ValidateSpamResponse = components['schemas']['ValidateSpamResponse']

export async function validateSpam({ projectRef, template }: ValidateSpamVariables) {
  const { data, error } = await post('/platform/auth/{ref}/validate/spam', {
    // @ts-expect-error API doesnt have the param check cause it's not being used in the controller
    params: { path: { ref: projectRef } },
    body: template,
  })

  if (error) handleError(error)
  return data
}

type ValidateSpamData = Awaited<ReturnType<typeof validateSpam>>

export const useValidateSpamMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ValidateSpamData, ResponseError, ValidateSpamVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ValidateSpamData, ResponseError, ValidateSpamVariables>(
    (vars) => validateSpam(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to validate template: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
