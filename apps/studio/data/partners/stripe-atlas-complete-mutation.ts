import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { STRIPE_ATLAS_COMPLETE_PATH, stripeAtlasFetch } from './stripe-atlas-api'
import type { ResponseError } from '@/types'

/** Mirrors `VerifyStripeAtlasApplicationRequestSchema` in the platform repo — every field required. */
export type CompleteStripeAtlasApplicationVariables = {
  firstname: string
  lastname: string
  companyName: string
  email: string
  /** Single-use credential minted by Stripe Atlas. Never log or forward this. */
  stripeAtlasToken: string
}

/**
 * The endpoint answers 200 with an empty body — the credit code is emailed to the merchant rather
 * than returned here. Parsed loosely so adding a response body later can't fail a submission.
 */
const CompleteSchema = z.unknown()

async function completeStripeAtlasApplication(
  variables: CompleteStripeAtlasApplicationVariables,
  signal?: AbortSignal
) {
  await stripeAtlasFetch(STRIPE_ATLAS_COMPLETE_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(variables),
    schema: CompleteSchema,
    signal,
  })
}

export type CompleteStripeAtlasApplicationData = Awaited<
  ReturnType<typeof completeStripeAtlasApplication>
>

export const useCompleteStripeAtlasApplicationMutation = (
  options: Omit<
    UseMutationOptions<
      CompleteStripeAtlasApplicationData,
      ResponseError,
      CompleteStripeAtlasApplicationVariables
    >,
    'mutationFn'
  > = {}
) =>
  useMutation<
    CompleteStripeAtlasApplicationData,
    ResponseError,
    CompleteStripeAtlasApplicationVariables
  >({
    mutationFn: (variables) => completeStripeAtlasApplication(variables),
    ...options,
  })
