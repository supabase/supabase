import z from 'zod'

import {
  IS_ELICITATION_MOCK_MODE_ENABLED,
  MAX_SECRET_NAME_LENGTH,
  MCP_ELICITATION_ROUTE,
  RESERVED_SECRET_NAME_PREFIX,
} from './McpElicitation.constants'

/**
 * The only module that reads the elicitation query string.
 *
 * The server may start minting params we don't know about yet, and a deploy can
 * land mid-flow, so every schema here is additive-safe: unknown keys pass
 * through untouched and a malformed known key degrades to `undefined` instead of
 * failing the whole parse. A missing `ref` or `name` is what the page renders as
 * expired — there is nothing to resolve without both.
 *
 * Nothing in here may be logged, sent to analytics, or rendered verbatim.
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
  'error',
] as const

export type DevElicitationState = (typeof DEV_ELICITATION_STATES)[number]

export type ElicitationParams = {
  /** Project ref the secret is stored against. `undefined` when missing or malformed. */
  ref: string | undefined
  /** Secret name, kept exactly as minted. `undefined` when missing or malformed. */
  name: string | undefined
  /**
   * Screen overrides for local/staging. Always empty in production, so deleting
   * this is a local change.
   */
  dev: { state: DevElicitationState | undefined }
}

const EMPTY_DEV_PARAMS: ElicitationParams['dev'] = { state: undefined }

/**
 * Project refs are 20 lowercase letters on the platform and `default` locally.
 * Kept deliberately loose — anything that could not be a ref is what we reject,
 * rather than asserting today's exact shape.
 */
const projectRefSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{1,64}$/)
  .optional()
  .catch(undefined)

/**
 * The platform rule, mirrored client-side: at most 256 characters and never the
 * `SUPABASE_` prefix. Not trimmed — the name we render has to be the name we
 * write, and the platform is the one that decides what it will accept.
 */
const secretNameSchema = z
  .string()
  .min(1)
  .max(MAX_SECRET_NAME_LENGTH)
  .refine((value) => value.trim().length > 0)
  .refine((value) => !value.startsWith(RESERVED_SECRET_NAME_PREFIX))
  .optional()
  .catch(undefined)

const elicitationParamsSchema = z
  .object({
    ref: projectRefSchema,
    name: secretNameSchema,
    // Reserved for the stateful handoff (AI-1170). Parsed so an older bundle
    // doesn't choke on a link minted by a newer server; deliberately unused.
    i: z.string().trim().min(1).optional().catch(undefined),
  })
  .passthrough()

const devElicitationParamsSchema = z
  .object({
    state: z.enum(DEV_ELICITATION_STATES).optional().catch(undefined),
  })
  .passthrough()

export type ElicitationSearchParams = Record<string, string | undefined>

export function parseElicitationParams(searchParams: ElicitationSearchParams): ElicitationParams {
  const parsed = elicitationParamsSchema.safeParse(searchParams)
  const ref = parsed.success ? parsed.data.ref : undefined
  const name = parsed.success ? parsed.data.name : undefined

  if (!IS_ELICITATION_MOCK_MODE_ENABLED) {
    return { ref, name, dev: EMPTY_DEV_PARAMS }
  }

  const parsedDev = devElicitationParamsSchema.safeParse(searchParams)

  return {
    ref,
    name,
    dev: parsedDev.success ? { state: parsedDev.data.state } : EMPTY_DEV_PARAMS,
  }
}

/**
 * Sign-in URL for the wrong-account recovery path.
 *
 * `returnTo` carries the bare pathname and the elicitation params ride alongside
 * it as siblings, because `validateReturnTo` restricts the charset of `returnTo`
 * itself and would drop an embedded query string. `getReturnToPath` re-appends
 * the siblings on the way back. This mirrors what `withAuth` does for the
 * signed-out case, so both routes home land on the same URL.
 */
export function buildElicitationSignInPath(params: Pick<ElicitationParams, 'ref' | 'name'>) {
  const search = new URLSearchParams({ returnTo: MCP_ELICITATION_ROUTE })
  if (params.ref !== undefined) search.set('ref', params.ref)
  if (params.name !== undefined) search.set('name', params.name)

  return `/sign-in?${search.toString()}`
}
