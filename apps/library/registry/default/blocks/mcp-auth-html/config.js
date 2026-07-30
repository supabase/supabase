export const SUPABASE_URL = ''
export const SUPABASE_PUBLISHABLE_KEY = ''

// The two values above are the only required edits. For a local project, run
// `supabase status` and copy the API URL and publishable key it reports; do not
// assume the default port is available. For a hosted project, copy them from
// Project Settings → API. Both are safe to expose in a browser: the publishable
// key grants only what your RLS policies allow.

// The MCP server block and its access-token hook use this canonical endpoint.
export const MCP_SERVER_URL = `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/mcp-server`

// Social providers shown on the sign-in page, in order. Each one must be
// enabled in Authentication → Providers first. Leave the array empty for email
// and password only.
export const SOCIAL_PROVIDERS = []
