import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Self-hosted MCP is an HTTP endpoint that can run SQL as the database role
 * Studio is configured with. Callers must present a bearer token before any
 * tool runs. Hosted Studio does not serve this endpoint.
 */
export const MCP_ACCESS_TOKEN_MIN_LENGTH = 32

export type McpAuthorization =
  | { isAuthorized: true }
  | { isAuthorized: false; status: 401 | 404 | 503; message: string }

export function authorizeMcpRequest({
  isPlatform,
  authorizationHeader,
  configuredToken,
}: {
  isPlatform: boolean
  authorizationHeader: string | string[] | null | undefined
  configuredToken: string | undefined
}): McpAuthorization {
  if (isPlatform) {
    return { isAuthorized: false, status: 404, message: 'Not found' }
  }

  const token = configuredToken?.trim() ?? ''

  if (token.length === 0) {
    return {
      isAuthorized: false,
      status: 503,
      message:
        'MCP access token is not configured. Set MCP_ACCESS_TOKEN to a random value of at least 32 characters.',
    }
  }

  if (token.length < MCP_ACCESS_TOKEN_MIN_LENGTH) {
    return {
      isAuthorized: false,
      status: 503,
      message:
        'MCP access token must be at least 32 characters. Set MCP_ACCESS_TOKEN to a longer random value.',
    }
  }

  const presented = readBearerToken(authorizationHeader)
  if (!presented || !bearerTokensMatch(presented, token)) {
    return {
      isAuthorized: false,
      status: 401,
      message:
        'Missing or invalid MCP access token. Send Authorization: Bearer with the value of MCP_ACCESS_TOKEN.',
    }
  }

  return { isAuthorized: true }
}

function readBearerToken(header: string | string[] | null | undefined): string | null {
  if (typeof header !== 'string') {
    return null
  }

  const match = /^Bearer\s+(\S+)$/i.exec(header.trim())
  const token = match?.[1]
  if (!token) {
    return null
  }

  return token
}

function bearerTokensMatch(presented: string, expected: string): boolean {
  const presentedDigest = createHash('sha256').update(presented).digest()
  const expectedDigest = createHash('sha256').update(expected).digest()
  return timingSafeEqual(presentedDigest, expectedDigest)
}
