import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'

export type SetupIntentVariables = {
  hcaptchaToken: string
}

export async function setupIntent({ hcaptchaToken }: SetupIntentVariables) {
  const { data, error } = await post('/platform/stripe/setup-intent', {
    // @ts-ignore [Joshen] API seems to be having the wrong spec
    body: { hcaptchaToken },
  })
  if (error) throw error
  return data
}

type SetupIntentData = Awaited<ReturnType<typeof setupIntent>>

export const useSetupIntent = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SetupIntentData, ResponseError, SetupIntentVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SetupIntentData, ResponseError, SetupIntentVariables>(
    (vars) => setupIntent(vars),
    {
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
    }
  )
}
