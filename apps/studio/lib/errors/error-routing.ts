import type { StudioErrorTag } from '@/lib/errors/studio-errors'

/** Never send to Sentry. */
export const SAMPLE_NEVER = 0
/** Faults owned by other teams or services: keep a small sample for visibility. */
export const SAMPLE_OTHER = 0.1
/** Faults Studio owns and fixes. */
export const SAMPLE_OWNED = 0.25
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
  UnclassifiedApiError: { sentrySampleRate: SAMPLE_OTHER },
  DbConnectionTimeout: { sentrySampleRate: SAMPLE_OTHER },
  UnexpectedError: { sentrySampleRate: SAMPLE_OWNED },
} as const satisfies Record<StudioErrorTag, Routing>
