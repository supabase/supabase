import { createHash, randomBytes } from 'node:crypto'

import { env } from '../env'

export type OAuthTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type?: string
  scope?: string
}

export type PkcePair = {
  codeVerifier: string
  codeChallenge: string
}

/** Random 32-byte verifier and S256 (base64url SHA-256) challenge. */
export function generatePkce(): PkcePair {
  const codeVerifier = randomBytes(32).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
  return { codeVerifier, codeChallenge }
}

export function generateOAuthState(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Platform OAuth `organization_slug` must be a cloud org the signed-in
 * supabase.com user belongs to. Local Studio slugs are not that — skip
 * preselect (`SUPABASE_OAUTH_PRESELECT_ORGANIZATION=false`) or override
 * (`SUPABASE_OAUTH_ORGANIZATION_SLUG`).
 */
export function resolveAuthorizeOrganizationSlug({
  studioOrgSlug,
  overrideSlug,
  preselect = true,
}: {
  studioOrgSlug?: string
  overrideSlug?: string
  preselect?: boolean
}): string | undefined {
  if (!preselect) return undefined
  const slug = overrideSlug?.trim() || studioOrgSlug?.trim()
  return slug || undefined
}

export function buildAuthorizeUrl({
  state,
  codeChallenge,
  orgSlug,
}: {
  state: string
  codeChallenge: string
  orgSlug?: string
}): string {
  const url = new URL(`${env.managementApiUrl}/v1/oauth/authorize`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', env.supabaseOauthClientId)
  url.searchParams.set('redirect_uri', env.supabaseOauthRedirectUri)
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  // `scope` is deprecated on the authorize endpoint: the token's scopes come
  // from the OAuth app registration (MCP `list_tables` / `execute_sql` need
  // Database Write there). Kept as `all` to match the Management API example.
  url.searchParams.set('scope', 'all')
  const authorizeOrg = resolveAuthorizeOrganizationSlug({
    studioOrgSlug: orgSlug,
    overrideSlug: env.oauthOrganizationSlug,
    preselect: env.oauthPreselectOrganization,
  })
  if (authorizeOrg) {
    url.searchParams.set('organization_slug', authorizeOrg)
  }
  return url.toString()
}

function basicAuthHeader(): string {
  const credentials = Buffer.from(
    `${env.supabaseOauthClientId}:${env.supabaseOauthClientSecret}`,
    'utf8'
  ).toString('base64')
  return `Basic ${credentials}`
}

async function tokenRequest(body: URLSearchParams): Promise<OAuthTokenResponse> {
  const response = await fetch(`${env.managementApiUrl}/v1/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`OAuth token request failed (${response.status}): ${text}`)
  }

  const json = JSON.parse(text) as Partial<OAuthTokenResponse>
  if (!json.access_token || !json.refresh_token || typeof json.expires_in !== 'number') {
    throw new Error('OAuth token response is missing access_token, refresh_token, or expires_in')
  }

  return json as OAuthTokenResponse
}

export async function exchangeCode({
  code,
  codeVerifier,
}: {
  code: string
  codeVerifier: string
}): Promise<OAuthTokenResponse> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.supabaseOauthRedirectUri,
      code_verifier: codeVerifier,
    })
  )
}

export async function refreshToken(refresh_token: string): Promise<OAuthTokenResponse> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
    })
  )
}

export function tokenExpiresAt(tokens: OAuthTokenResponse): string {
  return new Date(Date.now() + tokens.expires_in * 1000).toISOString()
}

export function tokenScopes(tokens: OAuthTokenResponse): string[] {
  if (!tokens.scope) return []
  return tokens.scope.split(/[,\s]+/).filter(Boolean)
}

export type OrganizationMismatch = {
  expectedSlug: string
  connectedSlugs: string[]
}

/**
 * Supabase OAuth tokens are scoped to the organization the user consented
 * for, so `GET /v1/organizations` with the new token names exactly that org.
 * The connection is keyed by the Studio org that opened the conversation; if
 * the two differ, every later tool call fails with a bare "no permission"
 * error. Catch it at consent time instead. Returns `null` when they match or
 * when the org list is not in a shape we recognize (fail open: the token can
 * still be validated on first use).
 */
export function findOrganizationMismatch({
  expectedSlug,
  organizations,
}: {
  expectedSlug: string
  organizations: unknown
}): OrganizationMismatch | null {
  if (!Array.isArray(organizations)) return null
  const connectedSlugs = organizations
    .map((org) =>
      org && typeof org === 'object' && typeof (org as { slug?: unknown }).slug === 'string'
        ? (org as { slug: string }).slug
        : null
    )
    .filter((slug): slug is string => slug !== null)
  if (connectedSlugs.length === 0) return null
  if (connectedSlugs.includes(expectedSlug)) return null
  return { expectedSlug, connectedSlugs }
}
