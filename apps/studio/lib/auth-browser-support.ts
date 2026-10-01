/**
 * Detects whether the current browser can persist the dashboard auth session.
 *
 * The dashboard stores the GoTrue session in `localStorage` (see
 * `packages/common/gotrue.ts`). Embedded in-app browsers and hardened privacy
 * modes can throw on access or silently discard writes, which drops the PKCE
 * code verifier and produces a `sign-in -> sign-in-mfa -> sign-in` loop.
 */

const STORAGE_PROBE_KEY = 'supabase.dashboard.auth.storage-probe'

export const isAuthStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined') return true
    const storage = globalThis?.localStorage
    if (!storage) return false
    storage.setItem(STORAGE_PROBE_KEY, '1')
    storage.removeItem(STORAGE_PROBE_KEY)
    return true
  } catch {
    return false
  }
}
