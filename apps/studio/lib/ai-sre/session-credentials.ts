/**
 * Session-only credential storage for the AI SRE prototype.
 *
 * The GitHub Personal Access Token the developer pastes is kept in `sessionStorage`
 * only: it survives navigation between the AI SRE sub-tabs and page reloads within
 * the same browser tab, is cleared when the tab closes, and is NEVER written to the
 * project database or sent to any Supabase server for storage. It is forwarded to a
 * GitHub MCP client transient-per-run via the run request body.
 *
 * This is a deliberate prototype choice (session-only, no persistence). Production
 * would use a GitHub App installation token minted server-side or a secrets vault.
 */
const githubTokenKey = (ref: string) => `supabase-sre-gh:${ref}`

export function getGithubToken(ref: string | undefined): string | undefined {
  if (!ref || typeof window === 'undefined') return undefined
  return window.sessionStorage.getItem(githubTokenKey(ref)) ?? undefined
}

export function setGithubToken(ref: string, token: string): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(githubTokenKey(ref), token)
}

export function clearGithubToken(ref: string): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(githubTokenKey(ref))
}
