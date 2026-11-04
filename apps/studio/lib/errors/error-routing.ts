import type { StudioErrorTag } from '@/lib/errors/studio-errors'

/** Never send to Sentry. */
export const SAMPLE_NEVER = 0
/** Reads a 0-1 rate from an env var, falling back when it is unset or out of range. */
export function sampleRateFromEnv(value: string | undefined, fallback: number) {
  if (value === undefined || value.trim() === '') return fallback
  const rate = Number(value)
  return Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : fallback
}

// Env vars are read with literal `process.env.NEXT_PUBLIC_*` access so the Next and Vite builds can
// inline them.

/** Faults owned by other teams or services: keep a small sample for visibility. */
export const SAMPLE_OTHER = sampleRateFromEnv(process.env.NEXT_PUBLIC_SENTRY_SAMPLE_RATE_OTHER, 0.1)
/** Faults Studio owns and fixes. */
export const SAMPLE_OWNED = sampleRateFromEnv(
  process.env.NEXT_PUBLIC_SENTRY_SAMPLE_RATE_OWNED,
  0.25
)
/** Always send (also used when a caller forces capture). */
export const SAMPLE_ALWAYS = 1

type Routing = {
  sentrySampleRate: number
  // TODO: add PostHog routing when errors are sent to PostHog
}

// `satisfies Record<StudioErrorTag, ...>` makes a new tag fail typecheck until it is routed here.
export const ERROR_ROUTING = {
  RequestAborted: { sentrySampleRate: SAMPLE_NEVER },
  NetworkUnreachable: { sentrySampleRate: SAMPLE_OTHER },
  MalformedResponse: { sentrySampleRate: SAMPLE_OTHER },
  PlatformError: { sentrySampleRate: SAMPLE_OTHER },
  UnclassifiedApiError: { sentrySampleRate: SAMPLE_OWNED },
  DbConnectionTimeout: { sentrySampleRate: SAMPLE_OTHER },
  UnexpectedError: { sentrySampleRate: SAMPLE_OWNED },
} as const satisfies Record<StudioErrorTag, Routing>
