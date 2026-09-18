import { queryOptions, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import { stripeAtlasKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

/** Mirrors `PerkApplicationDataSchema` in the platform API. */
const stripeAtlasApplicationSchema = z.object({
  stripeAtlasToken: z.string(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().optional(),
  companyName: z.string().optional(),
})

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

  const { data, error } = await post(
    // @ts-expect-error waiting for API PR
    '/platform/stripe/atlas/application',
    { body: { stripeAtlasToken }, signal }
  )

  if (error) {
    handleError(error)
  }

  return stripeAtlasApplicationSchema.parse(data)
}

export type StripeAtlasApplicationData = Awaited<ReturnType<typeof getStripeAtlasApplication>>

export const stripeAtlasApplicationQueryOptions = ({
  stripeAtlasToken,
}: StripeAtlasApplicationVariables) =>
  queryOptions({
    queryKey: stripeAtlasKeys.application(stripeAtlasToken),
    queryFn: ({ signal }) => getStripeAtlasApplication({ stripeAtlasToken }, signal),
    enabled: typeof stripeAtlasToken !== 'undefined',
  })

export type CompleteStripeAtlasApplicationVariables = {
  stripeAtlasToken: string
  firstname: string
  lastname: string
  companyName: string
  email: string
}

async function completeStripeAtlasApplication(
  payload: CompleteStripeAtlasApplicationVariables,
  signal?: AbortSignal
) {
  const { data, error } = await post(
    // @ts-expect-error waiting for API PR
    '/platform/stripe/atlas/application/complete',
    { body: payload, signal }
  )

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
