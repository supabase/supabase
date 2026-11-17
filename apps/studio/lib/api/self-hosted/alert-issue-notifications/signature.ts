import { createHmac, timingSafeEqual } from 'node:crypto'

/** How far a notifier timestamp may be from now, either way. */
export const SIGNATURE_TOLERANCE_SECONDS = 300

export type SignatureCheck =
  | { ok: true }
  | { ok: false; reason: 'missing_signature' | 'stale_timestamp' | 'invalid_signature' }

/**
 * Checks Logflare's `X-Logflare-Signature: v1=<hex HMAC-SHA256(secret, "<timestamp>.<raw body>")>`.
 * The signature covers the raw request body, so callers must pass the body exactly as received.
 */
export function verifyLogflareSignature({
  secret,
  timestamp,
  signature,
  rawBody,
  now,
}: {
  secret: string
  timestamp: string | null
  signature: string | null
  rawBody: string
  now: number
}): SignatureCheck {
  if (!signature) return { ok: false, reason: 'missing_signature' }

  const sentAt = Number(timestamp)
  if (
    !timestamp ||
    !Number.isInteger(sentAt) ||
    Math.abs(now - sentAt) > SIGNATURE_TOLERANCE_SECONDS
  ) {
    return { ok: false, reason: 'stale_timestamp' }
  }

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest()
  const received = Buffer.from(signature.replace(/^v1=/, ''), 'hex')
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return { ok: false, reason: 'invalid_signature' }
  }

  return { ok: true }
}

const signingKey = (secret: string) =>
  secret.startsWith('whsec_')
    ? Buffer.from(secret.slice('whsec_'.length), 'base64')
    : Buffer.from(secret)

/**
 * The Standard Webhooks signature header value: `v1,<base64 HMAC-SHA256(key, "<id>.<timestamp>.<body>")>`.
 * A `whsec_` secret holds the base64 key, as in the spec; any other secret is used as the key bytes.
 */
export function signStandardWebhook({
  id,
  timestamp,
  body,
  secret,
}: {
  id: string
  timestamp: number
  body: string
  secret: string
}) {
  const digest = createHmac('sha256', signingKey(secret))
    .update(`${id}.${timestamp}.${body}`)
    .digest('base64')
  return `v1,${digest}`
}
