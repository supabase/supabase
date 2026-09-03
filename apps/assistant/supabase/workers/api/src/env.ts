function readEnv(name: string): string | undefined {
  const value = process.env[name]
  return value === undefined || value === '' ? undefined : value
}

function first(...names: string[]): string | undefined {
  for (const name of names) {
    const value = readEnv(name)
    if (value !== undefined) return value
  }
  return undefined
}

function required(name: string, ...aliases: string[]): string {
  const value = first(name, ...aliases)
  if (!value) {
    const listed = [name, ...aliases].join(' or ')
    throw new Error(`Missing required environment variable ${listed}`)
  }
  return value
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

type JsonWebKeySet = { keys: JsonWebKey[] }

/**
 * `@supabase/server` `auth: 'user'` needs a JWKS. Platform auto-injects
 * `SUPABASE_JWKS`; local `tsx` does not. Prefer explicit env, otherwise the
 * assistant project's well-known endpoint.
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
  get supabaseUrl() {
    return required('SUPABASE_URL')
  },
  get supabasePublishableKey() {
    return required('SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY')
  },
  get supabaseSecretKey() {
    return required('SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY')
  },
  get supabaseDbUrl() {
    return required('SUPABASE_DB_URL', 'DATABASE_URL')
  },
  get supabaseJwks() {
    return resolveAssistantJwks({
      inlineJwks: readEnv('SUPABASE_JWKS'),
      jwksUrl: readEnv('SUPABASE_JWKS_URL'),
      supabaseUrl: readEnv('SUPABASE_URL'),
    })
  },
  get platformJwksUrl() {
    return required('PLATFORM_JWKS_URL')
  },
  get platformJwtIssuer() {
    return readEnv('PLATFORM_JWT_ISSUER')
  },
  get supabaseOauthClientId() {
    return required('SUPABASE_OAUTH_CLIENT_ID')
  },
  get supabaseOauthClientSecret() {
    return required('SUPABASE_OAUTH_CLIENT_SECRET')
  },
  get supabaseOauthRedirectUri() {
    return required('SUPABASE_OAUTH_REDIRECT_URI')
  },
  get oauthOrganizationSlug() {
    return readEnv('SUPABASE_OAUTH_ORGANIZATION_SLUG')
  },
  get oauthPreselectOrganization() {
    return readEnv('SUPABASE_OAUTH_PRESELECT_ORGANIZATION') !== 'false'
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
}
