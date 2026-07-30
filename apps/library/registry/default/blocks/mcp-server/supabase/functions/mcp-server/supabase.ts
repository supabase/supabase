import { resolveEnv } from 'npm:@supabase/server@1.4.1/core'

// One resolved Supabase environment for the worker. Authentication, MCP
// discovery, and toolsets all use it so the project URL and publishable key
// cannot drift between layers.

type SupabaseEnvironment = NonNullable<ReturnType<typeof resolveEnv>['data']>

let cachedEnvironment: SupabaseEnvironment | null = null

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function legacyPublishableKeyOverrides(): Parameters<typeof resolveEnv>[0] {
  const legacyKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim()
  const hasPublishableKey =
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')

  return legacyKey && !hasPublishableKey ? { publishableKeys: { default: legacyKey } } : undefined
}

export function getSupabaseEnvironment(): SupabaseEnvironment {
  if (cachedEnvironment) return cachedEnvironment

  const { data, error } = resolveEnv(legacyPublishableKeyOverrides())
  if (error) {
    throw new Error(`Unable to resolve the Supabase environment: ${error.message}`, {
      cause: error,
    })
  }

  cachedEnvironment = data
  return data
}

function isInternalGatewayUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase()

  return (
    hostname.endsWith('.internal') ||
    /(^|[._-])(kong|envoy)([._-]|$)/.test(hostname)
  )
}

/**
 * The project URL external MCP clients can reach.
 *
 * Hosted Edge Functions receive the public project URL from Supabase. A locally
 * served function can instead receive the Docker-only gateway URL (for example
 * `http://kong:8000`), so local development must supply the API URL printed by
 * `supabase status`.
 */
export function getPublicSupabaseUrl(): string {
  const configuredUrl = Deno.env.get('MCP_PUBLIC_SUPABASE_URL')?.trim()
  const resolvedUrl = configuredUrl || getSupabaseEnvironment().url

  let url: URL
  try {
    url = new URL(resolvedUrl)
  } catch {
    throw new Error('MCP_PUBLIC_SUPABASE_URL must be an absolute HTTP or HTTPS URL.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('MCP_PUBLIC_SUPABASE_URL must use HTTP or HTTPS.')
  }

  if (!configuredUrl && isInternalGatewayUrl(url)) {
    throw new Error(
      `The resolved Supabase URL (${url.origin}) is only reachable inside the local Docker ` +
        'network. Set MCP_PUBLIC_SUPABASE_URL to the API URL printed by "supabase status".'
    )
  }

  return trimTrailingSlash(url.toString())
}

export function getDefaultPublishableKey(): string {
  const { publishableKeys } = getSupabaseEnvironment()
  const key = publishableKeys.default ?? Object.values(publishableKeys)[0]
  if (!key) throw new Error('No Supabase publishable key is available.')
  return key
}
