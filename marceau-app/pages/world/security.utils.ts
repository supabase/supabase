// ─── SECURITY UTILITIES ───────────────────────────────────
// Pure functions extracted from security.tsx for testability

const DEFAULT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const DEFAULT_PREFIX = 'mrcx_live_'
const DEFAULT_LENGTH = 48

/**
 * Generate a random API key with the given prefix and length
 */
export function generateApiKey(
  prefix: string = DEFAULT_PREFIX,
  length: number = DEFAULT_LENGTH
): string {
  let key = prefix
  for (let i = 0; i < length; i++) {
    key += DEFAULT_CHARS.charAt(Math.floor(Math.random() * DEFAULT_CHARS.length))
  }
  return key
}

/**
 * Validate that an API key has the correct format
 */
export function isValidApiKey(key: string, prefix: string = DEFAULT_PREFIX): boolean {
  if (!key.startsWith(prefix)) return false
  const body = key.slice(prefix.length)
  if (body.length !== DEFAULT_LENGTH) return false
  return /^[A-Za-z0-9]+$/.test(body)
}
