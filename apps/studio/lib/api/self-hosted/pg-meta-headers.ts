import { IS_PLATFORM } from '@/lib/constants'
import { encryptString, getConnectionStringForRef } from './util'

/**
 * Get pg-meta connection headers for a specific project ref.
 *
 * On Supabase Cloud (IS_PLATFORM=true): the platform handles connection
 * routing via its own auth; we return baseHeaders unchanged.
 *
 * On self-hosted deployments: we derive the connection string for the ref
 * from the local database registry, encrypt it, and inject it as the
 * `x-connection-encrypted` header so pg-meta connects to the correct DB.
 */
export function getPgMetaConnectionHeaders(
  ref: string,
  baseHeaders: Record<string, any>
): Record<string, any> {
  if (IS_PLATFORM) {
    return baseHeaders
  }

  const connectionString = getConnectionStringForRef(ref)
  const encryptedConnectionString = encryptString(connectionString)

  return {
    ...baseHeaders,
    'x-connection-encrypted': encryptedConnectionString,
  }
}