import { queryOptions, useMutation } from '@tanstack/react-query'
import type { platformComponents } from 'api-types'
import { toast } from 'sonner'

import { stripeAtlasKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type StripeAtlasApplicationVariables = {
  stripeAtlasToken?: string
}

async function getStripeAtlasApplication(
  { stripeAtlasToken }: StripeAtlasApplicationVariables,
  signal?: AbortSignal
) {
  if (!stripeAtlasToken) {
    throw new Error('stripeAtlasToken is required')
  }

  const { data, error } = await post('/platform/stripe/atlas/application', {
    body: { stripeAtlasToken },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type StripeAtlasApplicationData = Awaited<ReturnType<typeof getStripeAtlasApplication>>

export const stripeAtlasApplicationQueryOptions = ({
  stripeAtlasToken,
}: StripeAtlasApplicationVariables) =>
  queryOptions({
    queryKey: stripeAtlasKeys.application(stripeAtlasToken),
    queryFn: ({ signal }) => getStripeAtlasApplication({ stripeAtlasToken }, signal),
    enabled: IS_PLATFORM && typeof stripeAtlasToken !== 'undefined',
  })

export type CompleteStripeAtlasApplicationVariables =
  platformComponents['schemas']['StripeAtlasCompleteApplicationRequestBody']

async function completeStripeAtlasApplication(
  payload: CompleteStripeAtlasApplicationVariables,
  signal?: AbortSignal
) {
  const { data, error } = await post('/platform/stripe/atlas/application/complete', {
    body: payload,
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type CompleteStripeAtlasApplicationData = Awaited<
  ReturnType<typeof completeStripeAtlasApplication>
>

export const useStripeAtlasApplicationCompleteMutation = ({
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    CompleteStripeAtlasApplicationData,
    ResponseError,
    CompleteStripeAtlasApplicationVariables
  >,
  'mutationFn'
> = {}) =>
  useMutation<
    CompleteStripeAtlasApplicationData,
    ResponseError,
    CompleteStripeAtlasApplicationVariables
  >({
    mutationFn: (args) => completeStripeAtlasApplication(args),
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to confirm application: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
