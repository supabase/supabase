import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { stripeAtlasKeys } from './keys'
import { handleError, post } from '@/data/fetchers'

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
