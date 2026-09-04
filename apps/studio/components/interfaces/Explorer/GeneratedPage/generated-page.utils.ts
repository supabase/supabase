import type { SafeSqlFragment } from '@supabase/pg-meta'

import type { GeneratedPageFrameMessage } from './generated-page-document'
import type { APIKey } from '@/data/api-keys/api-keys-query'
import type { TimeRange } from '@/data/content/notebooks/notebook-schema'
import type { SafeLogSqlFragment } from '@/data/logs/safe-analytics-sql'
import type { RenderPageInput } from '@/lib/ai/tools/generated-page-schema'

export type ApprovedDatabaseQuery = { title: string; sql: SafeSqlFragment; rowLimit: number }
export type ApprovedLogQuery = { title: string; sql: SafeLogSqlFragment; timeRange: TimeRange }

/**
 * The queries a running page may execute, keyed by the ids it addresses them with. Built
 * once, inside the approval click handler, and never widened afterwards.
 */
export type ApprovedGeneratedPageQueries = {
  database: Map<string, ApprovedDatabaseQuery>
  logs: Map<string, ApprovedLogQuery>
}

export type ApprovedQueryLookup =
  | { status: 'database'; query: ApprovedDatabaseQuery }
  | { status: 'logs'; query: ApprovedLogQuery }
  | { status: 'rejected'; message: string }

/**
 * The gate between a frame's request and an actual query run. The frame supplies only an
 * id; anything not in the approved map is refused here, before any execution path is
 * reached, so an id the user never saw can never run.
 */
export function lookupApprovedQuery(
  approved: ApprovedGeneratedPageQueries | null,
  message: Extract<GeneratedPageFrameMessage, { type: 'query' }>
): ApprovedQueryLookup {
  if (approved === null) {
    return { status: 'rejected', message: 'This page is not running.' }
  }

  if (message.kind === 'database') {
    const query = approved.database.get(message.queryId)
    if (query === undefined) {
      return {
        status: 'rejected',
        message: `Database query "${message.queryId}" was not approved for this page.`,
      }
    }
    return { status: 'database', query }
  }

  const query = approved.logs.get(message.queryId)
  if (query === undefined) {
    return {
      status: 'rejected',
      message: `Logs query "${message.queryId}" was not approved for this page.`,
    }
  }
  return { status: 'logs', query }
}

/**
 * A key the frame is allowed to hold: public by design, bound by Row Level Security, and
 * meant to be shipped in a browser.
 */
export type PublicClientKey = { apiKey: string; kind: 'publishable' | 'legacy_anon' }

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

/**
 * Picks the one key the frame may hold, re-checking each candidate's own fields rather than
 * trusting the field name it arrived under — a secret or service-role key reaching the frame
 * would hand a generated page unrestricted project access.
 *
 * A publishable key is preferred. Projects that have not migrated to the new key system have
 * no publishable key at all, only the legacy `anon` JWT, so that is accepted as a fallback:
 * it is the same trust class (public, RLS-bound, designed to be embedded in a client). The
 * legacy `service_role` key is in a different class and is never eligible, so the fallback
 * additionally requires the key to be named `anon` and to carry no non-`anon` JWT role.
 */
export function selectPublicClientKey(
  keys: { publishableKey?: APIKey; anonKey?: APIKey } | undefined
): PublicClientKey | undefined {
  const publishable = keys?.publishableKey
  if (publishable?.type === 'publishable' && isNonEmptyString(publishable.api_key)) {
    return { apiKey: publishable.api_key, kind: 'publishable' }
  }

  const anon = keys?.anonKey
  const anonRole = anon?.secret_jwt_template?.role
  if (
    anon?.type === 'legacy' &&
    anon.name === 'anon' &&
    (anonRole === undefined || anonRole === null || anonRole === 'anon') &&
    isNonEmptyString(anon.api_key)
  ) {
    return { apiKey: anon.api_key, kind: 'legacy_anon' }
  }

  return undefined
}

export type SupabaseClientStatus =
  | { status: 'ready'; kind: PublicClientKey['kind'] }
  | { status: 'not-requested' }
  /** The page calls `window.supabase` but the model left `enable_supabase_client` off. */
  | { status: 'not-requested-but-used' }
  | { status: 'loading' }
  | { status: 'no-permission' }
  | { status: 'no-key' }
  | { status: 'no-url' }

/**
 * Works out whether the frame will get a Supabase client, and if not, which specific thing
 * is missing. Kept exhaustive so the parent can say why instead of leaving the user with
 * only the generated page's own "client unavailable" branch to go on.
 */
export function getSupabaseClientStatus({
  isRequested,
  usesClientInHtml,
  isLoading,
  canReadApiKeys,
  projectUrl,
  clientKey,
}: {
  isRequested: boolean
  usesClientInHtml: boolean
  isLoading: boolean
  canReadApiKeys: boolean
  projectUrl: string | undefined
  clientKey: PublicClientKey | undefined
}): SupabaseClientStatus {
  if (!isRequested) {
    return usesClientInHtml ? { status: 'not-requested-but-used' } : { status: 'not-requested' }
  }
  if (isLoading) return { status: 'loading' }
  if (!canReadApiKeys) return { status: 'no-permission' }
  if (projectUrl === undefined) return { status: 'no-url' }
  if (clientKey === undefined) return { status: 'no-key' }
  return { status: 'ready', kind: clientKey.kind }
}

/** Says what is missing and what it means for the page. `null` when nothing is wrong. */
export function describeSupabaseClientWarning(
  status: SupabaseClientStatus
): { title: string; description: string } | null {
  switch (status.status) {
    case 'ready':
    case 'not-requested':
      return null
    case 'not-requested-but-used':
      return {
        title: 'This page uses a Supabase client it did not request',
        description:
          'The assistant wrote code that calls window.supabase without asking for it, so the client was not installed. Ask the assistant to rebuild the page with the Supabase client enabled.',
      }
    case 'loading':
      return {
        title: 'Still loading the project keys',
        description:
          'Start the page again once the project keys have loaded, or it will run without a Supabase client.',
      }
    case 'no-permission':
      return {
        title: 'Running without a Supabase client',
        description:
          'Reading API keys requires permission you do not have on this project. Parts of the page that use window.supabase will not work.',
      }
    case 'no-url':
      return {
        title: 'Running without a Supabase client',
        description:
          "This project's API URL is unavailable, so no client could be built. Parts of the page that use window.supabase will not work.",
      }
    case 'no-key':
      return {
        title: 'Running without a Supabase client',
        description:
          'This project has no publishable or anon key to build a client with. Parts of the page that use window.supabase will not work.',
      }
  }
}

/** One-line summary of what the page will be able to do, shown above the approval controls. */
export function summarizeGeneratedPageCapabilities(input: RenderPageInput): string {
  const parts: string[] = []
  const databaseCount = input.database_queries.length
  const logsCount = input.log_queries.length

  if (databaseCount > 0) {
    parts.push(`${databaseCount} database ${databaseCount === 1 ? 'query' : 'queries'}`)
  }
  if (logsCount > 0) {
    parts.push(`${logsCount} logs ${logsCount === 1 ? 'query' : 'queries'}`)
  }
  if (input.enable_supabase_client) {
    parts.push('Supabase client, subject to RLS')
  }

  if (parts.length === 0) return 'Runs in a sandbox with no access to your project'
  return parts.join(' · ')
}

export function getGeneratedPageErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return 'Query failed'
}
