/** Vercel OIDC is unused off Vercel; the AI SDK still imports it at load time. */
export function getContext() {
  return {}
}

export async function getVercelOidcToken() {
  return ''
}

export function getVercelOidcTokenSync() {
  return ''
}
