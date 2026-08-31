import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

import { API_BASE_URL, fetchHandler, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export const STRIPE_ATLAS_COMPLETE_PATH = '/partners/stripe/atlas/complete'

const ErrorBodySchema = z.object({ message: z.string() })

export type CompleteStripeAtlasApplicationVariables = {
  firstname: string
  lastname: string
  companyName: string
  email: string
  /** Single-use credential minted by the Stripe Atlas webhook. Never log or forward this. */
  stripeAtlasToken: string
}

/**
 * The rate limiter reports its window via `X-RateLimit-Reset`, which may carry either seconds
 * remaining or a unix timestamp. It's also only readable when the API sends
 * `Access-Control-Expose-Headers`, so callers must tolerate `undefined`.
 */
function parseRateLimitResetSeconds(headers: Headers) {
  const raw = headers.get('X-RateLimit-Reset')
  if (raw === null) return undefined

  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value) || value <= 0) return undefined

  const nowInSeconds = Math.floor(Date.now() / 1000)
  const seconds = value > nowInSeconds ? value - nowInSeconds : value

  return Math.min(seconds, 300)
}

async function completeStripeAtlasApplication(
  variables: CompleteStripeAtlasApplicationVariables,
  signal?: AbortSignal
) {
  const response = await fetchHandler(`${API_BASE_URL}${STRIPE_ATLAS_COMPLETE_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(variables),
    signal,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => undefined)
    const parsedBody = ErrorBodySchema.safeParse(body)

    handleError({
      message: parsedBody.success ? parsedBody.data.message : undefined,
      code: response.status,
      retryAfter: parseRateLimitResetSeconds(response.headers),
    })
  }
}

type CompleteStripeAtlasApplicationData = Awaited<
  ReturnType<typeof completeStripeAtlasApplication>
>

export const useCompleteStripeAtlasApplicationMutation = ({
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
    mutationFn: (variables) => completeStripeAtlasApplication(variables),
    // No toast on error — the page renders the failure inline with a retry affordance.
    ...options,
  })
