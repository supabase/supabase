export interface DefaultEdgeFunctionSecret {
  name: string
  description: string
}

export const DEFAULT_EDGE_FUNCTION_SECRETS: DefaultEdgeFunctionSecret[] = [
  {
    name: 'SUPABASE_URL',
    description: 'The API gateway for your Supabase project.',
  },
  {
    name: 'SUPABASE_DB_URL',
    description:
      'The direct PostgreSQL connection URL. Should not be shared with anyone, only use it on the server.',
  },
  {
    name: 'SUPABASE_PUBLISHABLE_KEYS',
    description:
      'JSON dictionary of publishable API keys. Safe to use in a browser if RLS is enabled.',
  },
  {
    name: 'SUPABASE_SECRET_KEYS',
    description: 'JSON dictionary of secret API keys. Should never be exposed to a browser.',
  },
  {
    name: 'SUPABASE_ANON_KEY',
    description: 'Legacy anonymous key. Safe to use in a browser if RLS is enabled.',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Legacy service role key. Should never be exposed to a browser.',
  },
  {
    name: 'SB_REGION',
    description: 'The region the function was invoked in. Set per request.',
  },
  {
    name: 'SB_EXECUTION_ID',
    description: 'A unique identifier for each function instance. Set per request.',
  },
  {
    name: 'DENO_DEPLOYMENT_ID',
    description: 'The version of the function code. Set when the function is deployed.',
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
