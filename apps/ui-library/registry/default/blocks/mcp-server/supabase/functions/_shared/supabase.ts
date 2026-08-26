import { resolveEnv } from 'npm:@supabase/server@1.5.0-rc.114/core'

// Project URL and publishable key for Edge Functions that call Supabase HTTP
// APIs the client library does not expose.

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

function getSupabaseEnvironment(): SupabaseEnvironment {
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

export type SupabaseFetch = (path: string, init?: RequestInit) => Promise<Response>

/**
 * A project-scoped fetch helper. The bearer token stays inside the framework,
 * and redirects are rejected so it cannot be forwarded to another origin.
 */
export function createSupabaseFetch(request: Request): SupabaseFetch {
  const environment = getSupabaseEnvironment()
  const baseUrl = new URL(`${trimTrailingSlash(environment.url)}/`)
  const publishableKey =
    environment.publishableKeys.default ?? Object.values(environment.publishableKeys)[0]
  if (!publishableKey) throw new Error('No Supabase publishable key is available.')

  const accessToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''

  return (path, init = {}) => {
    const url = new URL(path, baseUrl)
    if (url.origin !== baseUrl.origin) {
      throw new Error('Supabase API requests must target this project.')
    }

    const headers = new Headers(init.headers)
    headers.set('apikey', publishableKey)
    headers.set('Authorization', `Bearer ${accessToken}`)

    return fetch(url, { ...init, headers, redirect: 'error' })
  }
}
