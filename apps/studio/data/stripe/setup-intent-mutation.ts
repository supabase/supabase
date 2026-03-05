import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'

export type SetupIntentVariables = {
  hcaptchaToken: string
}

export type SetupIntentResponse = components['schemas']['SetupIntentResponse']

export async function setupIntent({ hcaptchaToken }: SetupIntentVariables) {
  const { data, error } = await post('/platform/stripe/setup-intent', {
    body: { hcaptchaToken },
  })
  if (error) handleError(error)
  return data
}

type SetupIntentData = Awaited<ReturnType<typeof setupIntent>>

export const useSetupIntent = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SetupIntentData, ResponseError, SetupIntentVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SetupIntentData, ResponseError, SetupIntentVariables>({
    mutationFn: (vars) => setupIntent(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to setup intent: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
