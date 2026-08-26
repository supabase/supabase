import { resolveEnv } from 'npm:@supabase/server@1.5.0-rc.114/core'

// One resolved Supabase environment for the worker. Authentication and
// toolsets use it so the project URL and publishable key cannot drift.

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

export function getDefaultPublishableKey(): string {
  const { publishableKeys } = getSupabaseEnvironment()
  const key = publishableKeys.default ?? Object.values(publishableKeys)[0]
  if (!key) throw new Error('No Supabase publishable key is available.')
  return key
}

export type SupabaseFetch = (path: string, init?: RequestInit) => Promise<Response>

/**
 * A project-scoped fetch helper for toolsets that need a Supabase API the
 * client library does not expose. The bearer token stays inside the framework,
 * and redirects are rejected so it cannot be forwarded to another origin.
 */
export function createSupabaseFetch(accessToken: string): SupabaseFetch {
  const environment = getSupabaseEnvironment()
  const baseUrl = new URL(`${trimTrailingSlash(environment.url)}/`)
  const publishableKey = getDefaultPublishableKey()

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
