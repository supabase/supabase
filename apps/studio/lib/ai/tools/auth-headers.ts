/**
 * Headers for forwarding the caller's credentials to the platform API.
 * Returns `undefined` when there's nothing to forward.
 */
export function getAuthHeaders(
  authorization: string | undefined,
  { contentType = false }: { contentType?: boolean } = {}
): Record<string, string> | undefined {
  if (!authorization) return undefined
  return {
    ...(contentType && { 'Content-Type': 'application/json' }),
    Authorization: authorization,
  }
}
