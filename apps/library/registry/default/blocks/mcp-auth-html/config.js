export const SUPABASE_URL = 'http://127.0.0.1:54321'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

// The two values above are the only required edit. They default to a local
// `supabase start` stack; for a hosted project, replace them with your project
// URL and publishable key from Project Settings → API. Both are safe to expose
// in a browser: the publishable key grants only what your RLS policies allow.

// The MCP server block and its access-token hook use this canonical endpoint.
export const MCP_SERVER_URL = `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/mcp-server`

// Social providers shown on the sign-in page, in order. Each one must be
// enabled in Authentication → Providers first. Leave the array empty for email
// and password only.
export const SOCIAL_PROVIDERS = []
