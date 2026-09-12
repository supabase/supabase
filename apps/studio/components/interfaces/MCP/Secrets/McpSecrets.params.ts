import z from 'zod'

import {
  IS_SECRETS_MOCK_MODE_ENABLED,
  MAX_SECRET_NAME_LENGTH,
  MCP_SECRETS_ROUTE,
  RESERVED_SECRET_NAME_PREFIX,
} from './McpSecrets.constants'

export const DEV_SECRETS_STATES = [
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

export type DevSecretsState = (typeof DEV_SECRETS_STATES)[number]

export type SecretsParams = {
  ref: string | undefined
  name: string | undefined
  dev: { state: DevSecretsState | undefined }
}

const EMPTY_DEV_PARAMS: SecretsParams['dev'] = { state: undefined }

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

const secretsParamsSchema = z
  .object({
    ref: projectRefSchema,
    name: secretNameSchema,
    i: z.string().trim().min(1).optional().catch(undefined),
  })
  .passthrough()

const devSecretsParamsSchema = z
  .object({
    state: z.enum(DEV_SECRETS_STATES).optional().catch(undefined),
  })
  .passthrough()

export type SecretsSearchParams = Record<string, string | undefined>

export function parseSecretsParams(searchParams: SecretsSearchParams): SecretsParams {
  const parsed = secretsParamsSchema.safeParse(searchParams)
  const ref = parsed.success ? parsed.data.ref : undefined
  const name = parsed.success ? parsed.data.name : undefined

  if (!IS_SECRETS_MOCK_MODE_ENABLED) {
    return { ref, name, dev: EMPTY_DEV_PARAMS }
  }

  const parsedDev = devSecretsParamsSchema.safeParse(searchParams)

  return {
    ref,
    name,
    dev: parsedDev.success ? { state: parsedDev.data.state } : EMPTY_DEV_PARAMS,
  }
}

export function buildSecretsSignInPath(params: Pick<SecretsParams, 'ref' | 'name'>) {
  const search = new URLSearchParams({ returnTo: MCP_SECRETS_ROUTE })
  if (params.ref !== undefined) search.set('ref', params.ref)
  if (params.name !== undefined) search.set('name', params.name)

  return `/sign-in?${search.toString()}`
}
