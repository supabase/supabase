import { z } from 'zod'

import type { ResponseError } from '@/types'

export const STRIPE_ATLAS_DATA_PARAM = 'data'
export const STRIPE_ATLAS_ERROR_PARAM = 'application_error'

const PerkApplicationDataSchema = z.object({
  stripeAtlasToken: z.string().min(1),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  email: z.string().optional(),
  companyName: z.string().optional(),
})

export type PerkApplicationData = z.infer<typeof PerkApplicationDataSchema>

export type StripeAtlasLinkState =
  /** The backend told us why it failed, in copy that's already customer-facing. */
  | { status: 'application-error'; message: string }
  /** We have a usable token, so the form can be shown. */
  | { status: 'ready'; data: PerkApplicationData }
  /** No token, so there is nothing the visitor can submit. */
  | { status: 'invalid-link' }

/**
 * The `data` param is standard base64 (from Node's `Buffer.toString('base64')`) of a JSON
 * payload. `URLSearchParams` handles the percent-decoding; `atob` gives us bytes, which have to
 * go through `TextDecoder` so non-ASCII names and company names survive the round-trip.
 */
function decodeApplicationData(encoded: string) {
  try {
    const binary = atob(encoded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return undefined
  }
}

export function parseStripeAtlasLink(search: string): StripeAtlasLinkState {
  const params = new URLSearchParams(search)

  const applicationError = params.get(STRIPE_ATLAS_ERROR_PARAM)
  if (applicationError) return { status: 'application-error', message: applicationError }

  const encoded = params.get(STRIPE_ATLAS_DATA_PARAM)
  if (!encoded) return { status: 'invalid-link' }

  const parsed = PerkApplicationDataSchema.safeParse(decodeApplicationData(encoded))
  if (!parsed.success) return { status: 'invalid-link' }

  return { status: 'ready', data: parsed.data }
}

export type SubmissionErrorState = {
  message: string
  /** Terminal failures hide the retry button — retrying can never change the outcome. */
  isRetryable: boolean
  /** Seconds to keep retry disabled for, when the failure is a rate limit. */
  retryAfterSeconds?: number
}

const RATE_LIMIT_FALLBACK_SECONDS = 60

export function getSubmissionErrorState(error: ResponseError): SubmissionErrorState {
  const serverMessage = error.message.trim()

  if (error.code === 400 && /already been redeemed/i.test(serverMessage)) {
    return {
      message:
        'This company has already claimed the Supabase perk. If the email with the credit code never arrived, contact support.',
      isRetryable: false,
    }
  }

  if (error.code === 400) {
    return { message: serverMessage, isRetryable: true }
  }

  if (error.code === 404) {
    return {
      message:
        'We could not find this application yet. Try again in a minute. If it keeps failing, restart from your Stripe Atlas dashboard.',
      isRetryable: true,
    }
  }

  if (error.code === 429) {
    return {
      message: 'Too many attempts. Wait a moment before trying again.',
      isRetryable: true,
      retryAfterSeconds: error.retryAfter ?? RATE_LIMIT_FALLBACK_SECONDS,
    }
  }

  return {
    message: 'Unable to submit your application. Try again in a moment.',
    isRetryable: true,
  }
}
