import z from 'zod'

import {
  IS_ELICITATION_MOCK_MODE_ENABLED,
  MAX_SECRET_NAME_LENGTH,
  MCP_ELICITATION_ROUTE,
  RESERVED_SECRET_NAME_PREFIX,
} from './McpElicitation.constants'

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
  ref: string | undefined
  name: string | undefined
  dev: { state: DevElicitationState | undefined }
}

const EMPTY_DEV_PARAMS: ElicitationParams['dev'] = { state: undefined }

const projectRefSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]{1,64}$/)
  .optional()
  .catch(undefined)

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

export function buildElicitationSignInPath(params: Pick<ElicitationParams, 'ref' | 'name'>) {
  const search = new URLSearchParams({ returnTo: MCP_ELICITATION_ROUTE })
  if (params.ref !== undefined) search.set('ref', params.ref)
  if (params.name !== undefined) search.set('name', params.name)

  return `/sign-in?${search.toString()}`
}
