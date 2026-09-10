import { z } from 'zod'

/** Base64-encoded JSON, handed to us by Stripe Atlas when it redirects the merchant here. */
export const STRIPE_ATLAS_PAYLOAD_PARAM = 'data'

const PayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('error'), message: z.string().min(1) }),
  z.object({ type: z.literal('success'), stripeAtlasToken: z.string().min(1) }),
])

export type StripeAtlasPayload = z.infer<typeof PayloadSchema>

/**
 * The payload can't describe its own absence, so parsing adds the one case where we never got a
 * usable one — whether the param was missing entirely ("Continue without sharing") or didn't
 * decode. Both leave the merchant with nothing to submit and the same way out, so they share a
 * state. Everything else is the decoded payload as-is.
 */
export type StripeAtlasLinkState = StripeAtlasPayload | { type: 'invalid-link' }

/**
 * The payload is standard base64 (from Node's `Buffer.toString('base64')`) of a JSON object.
 * `URLSearchParams` handles the percent-decoding; `atob` gives us bytes, which have to go through
 * `TextDecoder` so non-ASCII company names survive the round-trip.
 */
function decodePayload(encoded: string) {
  try {
    const binary = atob(encoded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return undefined
  }
}

export function parseStripeAtlasLink(search: string): StripeAtlasLinkState {
  const encoded = new URLSearchParams(search).get(STRIPE_ATLAS_PAYLOAD_PARAM)
  if (!encoded) return { type: 'invalid-link' }

  const decoded = decodePayload(encoded)

  console.log(decoded)

  const parsed = PayloadSchema.safeParse(decoded)
  if (!parsed.success) return { type: 'invalid-link' }

  return parsed.data
}
