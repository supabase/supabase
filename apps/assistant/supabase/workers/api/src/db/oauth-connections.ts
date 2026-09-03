import type { SupabaseClient } from '@supabase/supabase-js'

import { adminQuery } from './postgres.ts'
import { HttpError } from '../http/errors'
import { refreshToken, tokenExpiresAt, tokenScopes } from '../platform/oauth'

/**
 * Vault-backed OAuth tokens live behind SECURITY DEFINER RPCs in `private`.
 * Call them over a direct Postgres connection, not PostgREST — `private` is
 * not a Data API schema.
 *
 *   private.read_oauth_tokens(p_user_id uuid, p_org_slug text)
 *   private.store_oauth_tokens(...)
 */
const REFRESH_SKEW_MS = 5 * 60 * 1000

export type StoredOAuthTokens = {
  access_token: string
  refresh_token: string
  expires_at: string
  scopes?: string[] | null
}

export type OAuthConnectionPublic = {
  org_slug: string
  scopes: string[] | null
  expires_at: string
}

function unwrapTokenRow(data: unknown): StoredOAuthTokens | null {
  if (!data) return null
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') return null
  const record = row as Record<string, unknown>
  if (typeof record.access_token !== 'string' || typeof record.refresh_token !== 'string') {
    return null
  }
  return {
    access_token: record.access_token,
    refresh_token: record.refresh_token,
    expires_at: String(record.expires_at ?? ''),
    scopes: Array.isArray(record.scopes) ? (record.scopes as string[]) : null,
  }
}

export async function readOAuthTokens(
  userId: string,
  orgSlug: string
): Promise<StoredOAuthTokens | null> {
  try {
    const rows = await adminQuery(
      `select access_token, refresh_token, expires_at::text as expires_at, scopes
       from private.read_oauth_tokens($1::uuid, $2)`,
      [userId, orgSlug]
    )
    return unwrapTokenRow(rows)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    throw new Error(`read_oauth_tokens failed: ${message}`)
  }
}

export async function storeOAuthTokens(input: {
  userId: string
  orgSlug: string
  accessToken: string
  refreshToken: string
  expiresAt: string
  scopes: string[]
}): Promise<void> {
  try {
    await adminQuery(
      `select private.store_oauth_tokens(
         $1::uuid, $2, $3, $4, $5::timestamptz, $6::text[]
       )`,
      [
        input.userId,
        input.orgSlug,
        input.accessToken,
        input.refreshToken,
        input.expiresAt,
        input.scopes,
      ]
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    throw new Error(`store_oauth_tokens failed: ${message}`)
  }
}

export async function getValidAccessToken(userId: string, orgSlug: string): Promise<string | null> {
  const stored = await readOAuthTokens(userId, orgSlug)
  if (!stored) return null

  const expiresAt = Date.parse(stored.expires_at)
  const needsRefresh = Number.isNaN(expiresAt) || expiresAt - Date.now() < REFRESH_SKEW_MS

  if (!needsRefresh) {
    return stored.access_token
  }

  if (!stored.refresh_token) {
    throw new HttpError(409, 'oauth_expired', 'Reconnect this organization to continue.', {
      org_slug: orgSlug,
    })
  }

  try {
    const refreshed = await refreshToken(stored.refresh_token)
    const expiresAtIso = tokenExpiresAt(refreshed)
    const scopes = tokenScopes(refreshed)
    await storeOAuthTokens({
      userId,
      orgSlug,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: expiresAtIso,
      scopes: scopes.length > 0 ? scopes : (stored.scopes ?? []),
    })
    return refreshed.access_token
  } catch (error) {
    console.error('Failed to refresh OAuth token', error)
    throw new HttpError(409, 'oauth_expired', 'Reconnect this organization to continue.', {
      org_slug: orgSlug,
    })
  }
}

export async function listOAuthConnections(
  supabase: SupabaseClient
): Promise<OAuthConnectionPublic[]> {
  const { data, error } = await supabase
    .from('oauth_connections')
    .select('org_slug, scopes, expires_at')
  if (error) {
    throw new Error(`Failed to list OAuth connections: ${error.message}`)
  }
  return (data ?? []) as OAuthConnectionPublic[]
}
