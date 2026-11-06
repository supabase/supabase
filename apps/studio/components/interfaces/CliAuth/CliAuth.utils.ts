import { getCatalogEntry } from 'shared-data/scoped-access-token-permissions'

export type ScopeAction = 'read' | 'write'

export interface ParsedScope {
  scope: string
  key: string
  label: string
  action: ScopeAction
}

export interface ParsedScopesResult {
  scopes: ParsedScope[]
  unknown: string[]
}

function toParsedScope(value: string): ParsedScope | undefined {
  const parts = value.split(':')
  if (parts.length !== 3) return undefined

  const [level, resource, action] = parts
  if (action !== 'read' && action !== 'write') return undefined

  const key = `${level}:${resource}`
  const entry = getCatalogEntry(key)
  if (entry === undefined) return undefined
  if (action === 'write' && !entry.writable) return undefined

  return { scope: value, key, label: entry.name, action }
}

export function parseRequestedScopes(raw: string | string[] | undefined): ParsedScopesResult {
  const values = (Array.isArray(raw) ? raw : raw ? [raw] : [])
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const deduped = Array.from(new Set(values))
  const unknown: string[] = []
  const scopeByKey = new Map<string, ParsedScope>()
  const keyOrder: string[] = []

  for (const value of deduped) {
    const parsed = toParsedScope(value)
    if (parsed === undefined) {
      unknown.push(value)
      continue
    }

    if (!scopeByKey.has(parsed.key)) keyOrder.push(parsed.key)
    if (scopeByKey.get(parsed.key)?.action !== 'write') scopeByKey.set(parsed.key, parsed)
  }

  const scopes = keyOrder.flatMap((key) => scopeByKey.get(key) ?? [])
  return { scopes, unknown }
}

// TODO(cli): placeholder commands — the CLI team needs to confirm which subcommands each
// permission actually gates before this is shown to users outside the prototype.
const SCOPE_COMMANDS: Record<string, { read: string[]; write: string[] }> = {
  'project:admin': { read: ['projects list', 'status', 'link'], write: ['projects create'] },
  'project:analytics_logs': { read: ['inspect db calls'], write: [] },
  'project:api_gateway_keys': { read: ['projects api-keys'], write: [] },
  'project:auth_config': { read: ['sso list', 'sso show'], write: ['sso add', 'sso update'] },
  'project:backups': { read: ['db dump'], write: [] },
  'project:branching_development': {
    read: ['branches list', 'branches get'],
    write: ['branches create', 'branches update', 'branches delete'],
  },
  'project:branching_production': { read: ['branches list'], write: ['branches merge'] },
  'project:custom_domain': { read: ['domains get'], write: ['domains create', 'domains activate'] },
  'project:database': { read: ['db dump', 'gen types'], write: ['db push', 'db reset'] },
  'project:database_config': { read: ['postgres-config get'], write: ['postgres-config update'] },
  'project:database_migrations': {
    read: ['migration list'],
    write: ['migration up', 'migration repair'],
  },
  'project:database_network_bans': { read: ['network-bans get'], write: ['network-bans update'] },
  'project:database_network_restrictions': {
    read: ['network-restrictions get'],
    write: ['network-restrictions update'],
  },
  'project:database_ssl_config': {
    read: ['ssl-enforcement get'],
    write: ['ssl-enforcement update'],
  },
  'project:edge_functions': {
    read: ['functions list', 'functions download'],
    write: ['functions deploy', 'functions delete'],
  },
  'project:edge_functions_secrets': {
    read: ['secrets list'],
    write: ['secrets set', 'secrets unset'],
  },
  'project:snippets': { read: ['snippets list'], write: [] },
  'project:storage': {
    read: ['storage ls'],
    write: ['storage cp', 'storage mv', 'storage rm'],
  },
  'project:vanity_subdomain': {
    read: ['vanity-subdomains get'],
    write: ['vanity-subdomains activate'],
  },
  'user:organizations': { read: ['orgs list'], write: ['orgs create'] },
  'user:projects': { read: ['projects list'], write: [] },
}

export function getScopeCommands(scope: ParsedScope): string[] {
  const commands = SCOPE_COMMANDS[scope.key]
  if (commands === undefined) return []

  return scope.action === 'read' ? commands.read : [...commands.write, ...commands.read]
}
