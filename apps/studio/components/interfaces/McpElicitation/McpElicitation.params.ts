import z from 'zod'

import { IS_ELICITATION_MOCK_MODE_ENABLED, MCP_ELICITATION_ROUTE } from './McpElicitation.constants'
import { MOCK_ELICITATION_REQUEST_KEYS } from './McpElicitation.mocks'
import type { MockElicitationRequestKey } from './McpElicitation.mocks'

/**
 * The only module that reads the elicitation query string.
 *
 * The server may start minting params we don't know about yet, and a deploy can
 * land mid-flow, so every schema here is additive-safe: unknown keys pass
 * through untouched and a malformed known key degrades to `undefined` instead of
 * failing the whole parse.
 *
 * Nothing in here may be logged, sent to analytics, or rendered. Today `i` is an
 * opaque handle; treat everything alongside it as equally sensitive.
 */

export const DEV_ELICITATION_STATES = [
  'loading',
  'form',
  'stored',
  'stored-timeout',
  'already-stored',
  'expired',
  'cancelled',
  'paused',
  'wrong-account',
] as const

export type DevElicitationState = (typeof DEV_ELICITATION_STATES)[number]

export type ElicitationParams = {
  /** Opaque handoff handle. `undefined` when missing or blank. */
  handle: string | undefined
  /**
   * Mock overrides. Always empty outside local/staging — production reads never
   * populate this, so deleting it when the real API lands is a local change.
   */
  dev: {
    state: DevElicitationState | undefined
    request: MockElicitationRequestKey | undefined
  }
}

const EMPTY_DEV_PARAMS: ElicitationParams['dev'] = { state: undefined, request: undefined }

const elicitationParamsSchema = z
  .object({
    i: z.string().trim().min(1).optional().catch(undefined),
  })
  .passthrough()

const devElicitationParamsSchema = z
  .object({
    state: z.enum(DEV_ELICITATION_STATES).optional().catch(undefined),
    request: z.enum(MOCK_ELICITATION_REQUEST_KEYS).optional().catch(undefined),
  })
  .passthrough()

export type ElicitationSearchParams = Record<string, string | undefined>

export function parseElicitationParams(searchParams: ElicitationSearchParams): ElicitationParams {
  const parsed = elicitationParamsSchema.safeParse(searchParams)
  const handle = parsed.success ? parsed.data.i : undefined

  if (!IS_ELICITATION_MOCK_MODE_ENABLED) {
    return { handle, dev: EMPTY_DEV_PARAMS }
  }

  const parsedDev = devElicitationParamsSchema.safeParse(searchParams)

  return {
    handle,
    dev: parsedDev.success
      ? { state: parsedDev.data.state, request: parsedDev.data.request }
      : EMPTY_DEV_PARAMS,
  }
}

/**
 * Rebuilds this page's URL from validated params rather than echoing the raw
 * query string, so a sign-in round trip carries the handle back and nothing
 * else. Consumed as `returnTo`, which Studio validates as a same-origin path.
 */
export function buildElicitationReturnTo(handle: string | undefined) {
  if (handle === undefined) return MCP_ELICITATION_ROUTE
  return `${MCP_ELICITATION_ROUTE}?${new URLSearchParams({ i: handle }).toString()}`
}
