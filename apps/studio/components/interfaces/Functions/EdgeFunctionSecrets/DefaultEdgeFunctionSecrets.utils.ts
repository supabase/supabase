export interface DefaultEdgeFunctionSecret {
  name: string
  description: string
  // Runtime secrets are set by the Edge Functions runtime per invocation and
  // are never returned by the secrets API. They should always be shown.
  isRuntime: boolean
  isDeprecated?: boolean
}

export const DEFAULT_EDGE_FUNCTION_SECRETS: DefaultEdgeFunctionSecret[] = [
  {
    name: 'SUPABASE_URL',
    description: 'The API gateway for your Supabase project.',
    isRuntime: false,
  },
  {
    name: 'SUPABASE_DB_URL',
    description:
      'The direct PostgreSQL connection URL. Should not be shared with anyone, only use it on the server.',
    isRuntime: false,
  },
  {
    name: 'SUPABASE_PUBLISHABLE_KEYS',
    description:
      'JSON dictionary of publishable API keys. Safe to use in a browser if RLS is enabled.',
    isRuntime: false,
  },
  {
    name: 'SUPABASE_SECRET_KEYS',
    description: 'JSON dictionary of secret API keys. Should never be exposed to a browser.',
    isRuntime: false,
  },
  {
    name: 'SUPABASE_ANON_KEY',
    description:
      'Legacy anonymous key. Use SUPABASE_PUBLISHABLE_KEYS issued through JWT Signing Keys instead.',
    isRuntime: false,
    isDeprecated: true,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description:
      'Legacy service role key. Use SUPABASE_SECRET_KEYS issued through JWT Signing Keys instead.',
    isRuntime: false,
    isDeprecated: true,
  },
  {
    name: 'SUPABASE_JWKS',
    description: "JSON Web Key Set used to verify JWTs issued by your project's auth server.",
    isRuntime: false,
  },
  {
    name: 'SB_REGION',
    description: 'The region the function was invoked in. Set per request.',
    isRuntime: true,
  },
  {
    name: 'SB_EXECUTION_ID',
    description: 'A unique identifier for each function instance. Set per request.',
    isRuntime: true,
  },
  {
    name: 'DENO_DEPLOYMENT_ID',
    description: 'The version of the function code. Set when the function is deployed.',
    isRuntime: true,
  },
]

const DEFAULT_EDGE_FUNCTION_SECRET_NAMES = new Set(
  DEFAULT_EDGE_FUNCTION_SECRETS.map((secret) => secret.name)
)

// Internal secrets are anything reserved by Supabase that the user can't manage:
// either prefixed with SUPABASE_ (enforced by the API) or in the hardcoded
// list of default secrets above.
export const isInternalEdgeFunctionSecret = (name: string) =>
  /^SUPABASE_/.test(name) || DEFAULT_EDGE_FUNCTION_SECRET_NAMES.has(name)

// Picks the default secrets to display: runtime ones are always shown, static
// SUPABASE_* ones are filtered to those actually present in the API response.
// If the API returned none of the static defaults (brand-new project state),
// fall back to showing the full hardcoded list so the page stays educational.
export const getVisibleDefaultEdgeFunctionSecrets = (apiSecretNames: Set<string>) => {
  const staticDefaults = DEFAULT_EDGE_FUNCTION_SECRETS.filter((secret) => !secret.isRuntime)
  const runtimeDefaults = DEFAULT_EDGE_FUNCTION_SECRETS.filter((secret) => secret.isRuntime)

  const presentStaticDefaults = staticDefaults.filter((secret) => apiSecretNames.has(secret.name))
  const visibleStaticDefaults =
    presentStaticDefaults.length > 0 ? presentStaticDefaults : staticDefaults

  return [...visibleStaticDefaults, ...runtimeDefaults]
}
