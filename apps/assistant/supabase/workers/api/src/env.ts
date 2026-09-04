function envValue(value: string | undefined): string | undefined {
  return value === undefined || value === '' ? undefined : value
}

/**
 * Workers secrets cannot be named `SUPABASE_*` (reserved). Dashboard names are
 * often lowercase (`oauth_redirect_uri`); local `.env` stays UPPER_SNAKE.
 */
function readEnv(name: string): string | undefined {
  const exact = envValue(process.env[name])
  if (exact !== undefined) return exact
  if (name !== name.toLowerCase()) return envValue(process.env[name.toLowerCase()])
  return undefined
}

function first(...names: string[]): string | undefined {
  for (const name of names) {
    const value = readEnv(name)
    if (value !== undefined) return value
  }
  return undefined
}

function required(...names: string[]): string {
  const value = first(...names)
  if (!value) {
    throw new Error(`Missing required environment variable ${names.join(' or ')}`)
  }
  return value
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

type JsonWebKeySet = { keys: JsonWebKey[] }

/**
 * The assistant project's own connection details, in three shapes:
 *
 * 1. Platform default secrets (`SUPABASE_URL`, `SUPABASE_DB_URL`, and the JSON
 *    dictionaries `SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS`).
 * 2. Local `.env`: singular `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`.
 * 3. `ASSISTANT_*` for a hosted worker — user secrets cannot start with
 *    `SUPABASE_` ("Env name cannot start with SUPABASE_, skipping"). They mirror
 *    Studio's `NEXT_PUBLIC_ASSISTANT_SUPABASE_URL` / `NEXT_PUBLIC_ASSISTANT_PUBLISHABLE_KEY`.
 *
 * `ASSISTANT_*` is listed first: an operator set it deliberately, and it must
 * beat a platform default (e.g. a direct `db.<ref>` host that is IPv6-only and
 * unreachable from the worker VM, where the session pooler is required).
 */
const SUPABASE_URL_NAMES = ['ASSISTANT_SUPABASE_URL', 'SUPABASE_URL']
const PUBLISHABLE_KEY_NAMES = [
  'ASSISTANT_PUBLISHABLE_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_ANON_KEY',
]
const PUBLISHABLE_KEYS_JSON_NAME = 'SUPABASE_PUBLISHABLE_KEYS'
const SECRET_KEY_NAMES = [
  'ASSISTANT_SECRET_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]
const SECRET_KEYS_JSON_NAME = 'SUPABASE_SECRET_KEYS'
const DB_URL_NAMES = ['ASSISTANT_DB_URL', 'SUPABASE_DB_URL', 'DATABASE_URL']
const JWKS_NAMES = ['ASSISTANT_JWKS', 'SUPABASE_JWKS']
const JWKS_URL_NAMES = ['ASSISTANT_JWKS_URL', 'SUPABASE_JWKS_URL']

/** Host and port of a connection string for logs; never the credentials. */
export function describeDbHost(connectionString: string): string {
  try {
    const url = new URL(connectionString)
    return url.port ? `${url.hostname}:${url.port}` : url.hostname
  } catch {
    return '<unparseable connection string>'
  }
}

/** Parse the plural key dictionary format supplied by Supabase runtimes. */
export function parseApiKeysDictionary(
  raw: string | undefined,
  name: string
): Record<string, string> | undefined {
  if (!raw) return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`${name} must be a JSON object of key name to API key`)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${name} must be a JSON object of key name to API key`)
  }
  const entries = Object.entries(parsed).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== ''
  )
  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

/** Normalize singular local/hosted keys to the dictionaries `@supabase/server` expects. */
function resolveApiKeys(
  singularNames: string[],
  dictionaryName: string
): Record<string, string> | undefined {
  const singular = first(...singularNames)
  if (singular) return { default: singular }
  return parseApiKeysDictionary(readEnv(dictionaryName), dictionaryName)
}

/**
 * `@supabase/server` `auth: 'user'` needs a JWKS. Prefer explicit env,
 * otherwise the assistant project's well-known endpoint.
 */
export function resolveAssistantJwks({
  inlineJwks,
  jwksUrl,
  supabaseUrl,
}: {
  inlineJwks?: string
  jwksUrl?: string
  supabaseUrl?: string
}): JsonWebKeySet | URL | undefined {
  const inline = inlineJwks?.trim()
  if (inline) {
    let parsed: unknown
    try {
      parsed = JSON.parse(inline)
    } catch {
      throw new Error('SUPABASE_JWKS must be valid JSON')
    }
    if (Array.isArray(parsed)) return { keys: parsed }
    if (
      parsed &&
      typeof parsed === 'object' &&
      'keys' in parsed &&
      Array.isArray((parsed as JsonWebKeySet).keys)
    ) {
      return parsed as JsonWebKeySet
    }
    throw new Error('SUPABASE_JWKS must be a JWKS object or key array')
  }

  const explicitUrl = jwksUrl?.trim()
  if (explicitUrl) return new URL(explicitUrl)

  const projectUrl = supabaseUrl?.trim()
  if (!projectUrl) return undefined

  return new URL(`${stripTrailingSlash(projectUrl)}/auth/v1/.well-known/jwks.json`)
}

const DEFAULT_MANAGEMENT_API_URL = 'https://api.supabase.com'

/**
 * The OAuth issuer, Management API, and MCP server must all belong to the same
 * platform as the Studio that opened the conversation: `project_ref` and
 * `org_slug` are only meaningful there, and an OAuth token is only valid there.
 * Deriving the MCP URL from the Management API URL keeps them from diverging
 * (hosted platforms serve MCP on a sibling `mcp.` host; the local platform
 * serves it at `/mcp` on the same origin as the API). `MCP_URL` still wins
 * when set explicitly.
 */
export function resolveMcpUrl({
  mcpUrl,
  managementApiUrl,
}: {
  mcpUrl?: string
  managementApiUrl: string
}): string {
  const explicit = mcpUrl?.trim()
  if (explicit) return explicit

  const api = new URL(stripTrailingSlash(managementApiUrl))
  const hostedMatch = /^api\.(supabase\.(?:com|green|red))$/.exec(api.hostname)
  if (hostedMatch) {
    return `https://mcp.${hostedMatch[1]}/mcp`
  }
  return `${api.origin}/mcp`
}

/**
 * Lazy `process.env` accessors. Getters throw only when a required key is
 * actually read, so importing this module in tests does not require a full env.
 */
export const env = {
  get supabaseDbUrl() {
    return required(...DB_URL_NAMES)
  },
  get platformJwksUrl() {
    return required('PLATFORM_JWKS_URL')
  },
  get platformJwtIssuer() {
    return readEnv('PLATFORM_JWT_ISSUER')
  },
  get supabaseOauthClientId() {
    return required('OAUTH_CLIENT_ID')
  },
  get supabaseOauthClientSecret() {
    return required('OAUTH_CLIENT_SECRET')
  },
  get supabaseOauthRedirectUri() {
    return required('OAUTH_REDIRECT_URI')
  },
  get oauthOrganizationSlug() {
    return readEnv('OAUTH_ORGANIZATION_SLUG')
  },
  get oauthPreselectOrganization() {
    return readEnv('OAUTH_PRESELECT_ORGANIZATION') !== 'false'
  },
  get openaiApiKey() {
    return readEnv('OPENAI_API_KEY')
  },
  get managementApiUrl() {
    return stripTrailingSlash(readEnv('MANAGEMENT_API_URL') ?? DEFAULT_MANAGEMENT_API_URL)
  },
  get mcpUrl() {
    return resolveMcpUrl({
      mcpUrl: readEnv('MCP_URL'),
      managementApiUrl: this.managementApiUrl,
    })
  },
  get assistantPublicUrl() {
    return readEnv('ASSISTANT_PUBLIC_URL')
  },
  get port() {
    return Number.parseInt(readEnv('PORT') ?? '8787', 10)
  },
  /**
   * Literal `process.env.ASSISTANT_BUILD_ID` is replaced at bundle time by
   * esbuild `define` (not via `readEnv`, which indexes dynamically). `dev`
   * (tsx) has no build step.
   */
  get buildId() {
    return envValue(process.env.ASSISTANT_BUILD_ID) ?? 'dev'
  },
}

/**
 * `@supabase/server` only reads `SUPABASE_URL` / `SUPABASE_*_KEY` from
 * `process.env`, which a hosted worker never has (see `SUPABASE_URL_NAMES`).
 * Pass whatever we resolve so `withSupabase` sees the `ASSISTANT_*` values too;
 * it still reports a clear `MISSING_*` error for anything left unset.
 */
export function supabaseServerEnv() {
  const url = first(...SUPABASE_URL_NAMES)
  const publishableKeys = resolveApiKeys(PUBLISHABLE_KEY_NAMES, PUBLISHABLE_KEYS_JSON_NAME)
  const secretKeys = resolveApiKeys(SECRET_KEY_NAMES, SECRET_KEYS_JSON_NAME)
  const jwks = resolveAssistantJwks({
    inlineJwks: first(...JWKS_NAMES),
    jwksUrl: first(...JWKS_URL_NAMES),
    supabaseUrl: first(...SUPABASE_URL_NAMES),
  })
  return {
    ...(url ? { url } : {}),
    ...(publishableKeys ? { publishableKeys } : {}),
    ...(secretKeys ? { secretKeys } : {}),
    ...(jwks ? { jwks } : {}),
  }
}

/** Names present in the environment (never values); logged once at boot. */
export function describeEnvNames(): string {
  return Object.keys(process.env)
    .filter((name) => envValue(process.env[name]) !== undefined)
    .sort()
    .join(', ')
}
