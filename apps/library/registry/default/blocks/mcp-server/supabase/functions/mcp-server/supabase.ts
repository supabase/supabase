import { resolveEnv } from 'npm:@supabase/server@1.4.1/core'

// One resolved Supabase environment for the worker. Authentication, MCP
// discovery, and toolsets all use it so the project URL and publishable key
// cannot drift between layers.

type SupabaseEnvironment = NonNullable<ReturnType<typeof resolveEnv>['data']>

let cachedEnvironment: SupabaseEnvironment | null = null

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
