/**
 * Placeholder for a signed-in user's session JWT (e.g. from `supabase.auth.getSession()`).
 * Shown in invoke snippets on the `Authorization` header when a function enforces JWT
 * verification, so the user knows to substitute a real user token.
 */
export const USER_JWT_PLACEHOLDER = 'YOUR_USER_JWT'

export type InvokeHeader = { name: 'apikey' | 'Authorization'; value: string }

/**
 * Builds the auth headers for an Edge Function invoke snippet.
 *
 * - Legacy `anon` keys are JWTs, so a single `Authorization: Bearer` header satisfies both the
 *   API gateway and the `verify_jwt` platform check.
 * - Publishable/secret keys aren't JWTs, so they must go on the `apikey` header; passing them
 *   on `Authorization: Bearer` makes the platform reject the request with `Invalid JWT`. When
 *   the function enforces JWT verification (`verify_jwt`), the platform additionally requires a
 *   valid JWT on `Authorization` — so we add a user JWT (or the legacy anon key) there too.
 *   Without it the platform returns `UNAUTHORIZED_NO_AUTH_HEADER` ("Missing authorization header").
 */
export function getInvokeHeaders({
  isPublishableKey,
  keyValue,
  verifyJwt,
  authJwt,
}: {
  isPublishableKey: boolean
  keyValue: string
  verifyJwt: boolean
  authJwt: string
}): InvokeHeader[] {
  if (!isPublishableKey) {
    return [{ name: 'Authorization', value: `Bearer ${keyValue}` }]
  }

  const headers: InvokeHeader[] = [{ name: 'apikey', value: keyValue }]
  if (verifyJwt) {
    headers.push({ name: 'Authorization', value: `Bearer ${authJwt}` })
  }
  return headers
}

/** Formats headers as single-line cURL `-H '...'` args, e.g. `-H 'apikey: x' -H 'Authorization: Bearer y'`. */
export function formatInvokeHeaderArgs(headers: InvokeHeader[]): string {
  return headers.map((header) => `-H '${header.name}: ${header.value}'`).join(' ')
}
