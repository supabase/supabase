import type { Fault, StudioError, StudioErrorTag } from '@/lib/errors/studio-errors'

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
/**
 * Cap for errors whose fault is the user's. A trickle to catch misclassification and Studio bugs
 * hiding in user faults.
 */
export const SAMPLE_USER_FAULT = sampleRateFromEnv(
  process.env.NEXT_PUBLIC_SENTRY_SAMPLE_RATE_USER_FAULT,
  0.01
)
/** Always send (also used when a caller forces capture). */
export const SAMPLE_ALWAYS = 1

export type Routing = {
  sentrySampleRate: number
  // TODO: add PostHog routing when errors are sent to PostHog
}

// For every tag, requires exactly the faults that class can have, so a new tag or a new possible
// fault fails typecheck until it is routed.
type ErrorRoutingTable = {
  [Tag in StudioErrorTag]: Record<Extract<StudioError, { _tag: Tag }>['fault'], Routing>
}

// The class decides privacy (`isNeverReportedError`); this table gives the rate for each tag and
// fault. A user fault is rarely ours to fix, so it only gets a trickle (`SAMPLE_USER_FAULT`) to catch
// misclassification and Studio bugs hiding in it.
export const ERROR_ROUTING = {
  RequestAborted: { user: { sentrySampleRate: SAMPLE_NEVER } },
  NetworkUnreachable: {
    user: { sentrySampleRate: SAMPLE_USER_FAULT }, // reason `offline`
    platform: { sentrySampleRate: SAMPLE_OTHER },
  },
  MalformedResponse: { platform: { sentrySampleRate: SAMPLE_OTHER } },
  PlatformError: { platform: { sentrySampleRate: SAMPLE_OTHER } },
  UnclassifiedApiError: { studio: { sentrySampleRate: SAMPLE_OWNED } },
  DbConnectionTimeout: { platform: { sentrySampleRate: SAMPLE_OTHER } },
  UserSqlError: { user: { sentrySampleRate: SAMPLE_NEVER } },
  StudioSqlError: {
    user: { sentrySampleRate: SAMPLE_USER_FAULT }, // reason `user_input`
    studio: { sentrySampleRate: SAMPLE_OWNED },
  },
  UnexpectedError: { studio: { sentrySampleRate: SAMPLE_OWNED } },
} as const satisfies ErrorRoutingTable

/** The routing for one error, by its tag and fault. */
export function getErrorRouting(error: StudioError): Routing {
  // TypeScript can't correlate `_tag` with `fault` across the union, so view the table by plain
  // keys. `ErrorRoutingTable` guarantees every real tag and fault pair is present.
  const byFault: Partial<Record<Fault, Routing>> = ERROR_ROUTING[error._tag]
  return byFault[error.fault] ?? { sentrySampleRate: SAMPLE_NEVER }
}
