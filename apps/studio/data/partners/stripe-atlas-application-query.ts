import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { partnersKeys } from './keys'
import { STRIPE_ATLAS_APPLICATION_PATH, stripeAtlasFetch } from './stripe-atlas-api'
import type { ResponseError } from '@/types'

export type StripeAtlasApplicationVariables = {
  /** Single-use credential minted by Stripe Atlas. Never log or forward this. */
  stripeAtlasToken?: string
}

export type StripeAtlasApplicationError = ResponseError

/**
 * Prefill for every form field except the token. All optional: Stripe doesn't always know the
 * initiating person or the company name, and the merchant can fill in whatever is missing, so a
 * partial response is still usable rather than a hard failure.
 */
const ApplicationSchema = z.object({
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().optional(),
})

async function getStripeAtlasApplication(
  { stripeAtlasToken }: StripeAtlasApplicationVariables,
  signal?: AbortSignal
) {
  if (!stripeAtlasToken) throw new Error('Stripe Atlas token is required')

  return await stripeAtlasFetch(
    `${STRIPE_ATLAS_APPLICATION_PATH}?token=${encodeURIComponent(stripeAtlasToken)}`,
    { schema: ApplicationSchema, signal }
  )
}

export type StripeAtlasApplicationData = Awaited<ReturnType<typeof getStripeAtlasApplication>>

export const stripeAtlasApplicationQueryOptions = ({
  stripeAtlasToken,
}: StripeAtlasApplicationVariables) =>
  queryOptions({
    queryKey: partnersKeys.getStripeAtlasApplication(stripeAtlasToken),
    queryFn: ({ signal }) => getStripeAtlasApplication({ stripeAtlasToken }, signal),
    enabled: typeof stripeAtlasToken !== 'undefined',
    // The token is single-use and the details never change while the page is open.
    staleTime: Infinity,
    retry: false,
  })
