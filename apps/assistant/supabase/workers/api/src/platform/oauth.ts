import { randomBytes } from 'node:crypto'

import { env } from '../env'

export type OAuthTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type?: string
  scope?: string
}

export function generateOAuthState(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Platform OAuth `organization_slug` must be a cloud org the signed-in
 * supabase.com user belongs to. Local Studio slugs are not that — skip
 * preselect (`OAUTH_PRESELECT_ORGANIZATION=false`) or override
 * (`OAUTH_ORGANIZATION_SLUG`).
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
    signal: AbortSignal.timeout(15_000),
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
