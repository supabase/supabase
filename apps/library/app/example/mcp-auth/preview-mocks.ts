// Stand-ins served in place of two of the block's files when the docs render it
// in a preview iframe. Everything else the preview serves is the real shipped
// file, so what a reader sees is the markup and CSS they install.
//
// Substituting modules (rather than adding a preview flag to the block) keeps
// the installed files free of code that only exists to support these docs.

const PREVIEW_MESSAGE = 'Preview only. Install the block to complete this flow.'

/** Replaces config.js: hosted-looking values instead of localhost defaults. */
export const PREVIEW_CONFIG = `export const SUPABASE_URL = 'https://your-project.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_preview'
export const MCP_SERVER_URL = \`\${SUPABASE_URL.replace(/\\/+$/, '')}/functions/v1/mcp-server\`
export const SOCIAL_PROVIDERS = ['github']
`

/**
 * Replaces assets/supabase.js: fixture data, and a clear error for anything that
 * would sign in, redirect, or complete an authorization.
 */
export const PREVIEW_SUPABASE = `// Preview stand-in for assets/supabase.js. Not part of the installed block.
const PREVIEW_MESSAGE = '${PREVIEW_MESSAGE}'

export const configError = null

// The sign-in page should show its form, so report no user there and a signed-in
// user everywhere else.
const onSignInPage = location.pathname.includes('/auth')

const previewUser = { id: 'preview-user', email: 'ada@example.com' }

let grants = [
  { client: { id: 'client-1', name: 'Claude Code' }, scopes: ['openid', 'email'] },
  { client: { id: 'client-2', name: 'Codex' }, scopes: ['openid', 'email'] },
]

export async function getSession() {
  return onSignInPage ? null : { access_token: 'preview', expires_at: 2 ** 31 }
}

export async function getUser() {
  return onSignInPage ? null : previewUser
}

export async function completeSignInRedirect() {
  return null
}

export async function getAuthorization() {
  return {
    authorization_id: 'preview-authorization',
    client: { id: 'client-1', name: 'Claude Code' },
    redirect_uri: 'http://127.0.0.1:8976/callback',
    scope: 'openid email',
    user: previewUser,
  }
}

export async function listGrants() {
  return grants
}

export async function revokeGrant(clientId) {
  grants = grants.filter((grant) => grant.client.id !== clientId)
}

const unavailable = async () => {
  throw new Error(PREVIEW_MESSAGE)
}

export const signInWithPassword = unavailable
export const signUp = unavailable
export const signInWithProvider = unavailable
export const signOut = unavailable
export const decideAuthorization = unavailable
`
