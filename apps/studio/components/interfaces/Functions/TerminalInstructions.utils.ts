/**
 * Builds the auth header for an Edge Function invoke cURL snippet.
 *
 * Publishable keys aren't JWTs, so they must be sent on the `apikey` header; passing them on
 * `Authorization: Bearer` makes the platform reject the request with `Invalid JWT`. Legacy
 * `anon` keys are JWTs and use `Authorization: Bearer`.
 */
export function getInvokeAuthHeader({
  isPublishableKey,
  keyValue,
}: {
  isPublishableKey: boolean
  keyValue: string
}) {
  return isPublishableKey ? `apikey: ${keyValue}` : `Authorization: Bearer ${keyValue}`
}
