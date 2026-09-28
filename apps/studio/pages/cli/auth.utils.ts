import { OAuthScope } from '@supabase/shared-types/out/constants'

const VALID_SCOPES = new Set<string>(Object.values(OAuthScope))

export type ScopeAction = 'read' | 'write'

export interface ParsedScope {
  scope: string
  resource: string
  action: ScopeAction
}

export interface ParsedScopesResult {
  scopes: ParsedScope[]
  unknown: string[]
}

export function parseRequestedScopes(raw: string | string[] | undefined): ParsedScopesResult {
  const values = (Array.isArray(raw) ? raw : raw ? [raw] : [])
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const deduped = Array.from(new Set(values))
  const unknown = deduped.filter((value) => !VALID_SCOPES.has(value))

  const actionByResource = new Map<string, ScopeAction>()
  const resourceOrder: string[] = []
  for (const value of deduped) {
    if (!VALID_SCOPES.has(value)) continue

    const [resource, action] = value.split(':') as [string, ScopeAction]
    if (!actionByResource.has(resource)) resourceOrder.push(resource)
    if (actionByResource.get(resource) !== 'write') {
      actionByResource.set(resource, action)
    }
  }

  const scopes = resourceOrder.map((resource) => {
    const action = actionByResource.get(resource)!
    return { scope: `${resource}:${action}`, resource, action }
  })

  return { scopes, unknown }
}

const RESOURCE_LABEL_OVERRIDES: Record<string, string> = {
  rest: 'PostgREST',
}

export function toResourceLabel(resource: string): string {
  if (RESOURCE_LABEL_OVERRIDES[resource]) return RESOURCE_LABEL_OVERRIDES[resource]

  return resource
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const KNOWN_CLI_COMMANDS = [
  'db push',
  'db pull',
  'db diff',
  'db dump',
  'db reset',
  'db lint',
  'migration up',
  'migration new',
  'migration list',
  'functions deploy',
  'functions new',
  'link',
  'init',
  'start',
  'stop',
  'status',
  'login',
  'branches create',
  'branches list',
  'projects list',
  'projects create',
] as const

const MAX_COMMAND_LENGTH = 64

export function parseRequestedCommand(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return undefined

  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > MAX_COMMAND_LENGTH) return undefined

  return (KNOWN_CLI_COMMANDS as readonly string[]).includes(trimmed) ? trimmed : undefined
}
