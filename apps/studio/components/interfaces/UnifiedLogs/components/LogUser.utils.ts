import { UUID_REGEX } from '@/lib/constants'

// Role claim of the token a gateway request was made with (e.g. `anon`, `service_role`)
const REQUEST_ROLE_KEY = 'request.sb.jwt.authorization.payload.role'

type UserAttributableLog = {
  auth_user?: string | null
  metadata?: Record<string, unknown> | null
}

export type RequestUser =
  | { kind: 'user'; userId: string }
  /** A subject that isn't a Supabase Auth user id, e.g. from third-party auth. */
  | { kind: 'external'; userId: string }
  | { kind: 'none'; role?: string }

/**
 * Who made a request: the log's own user, else the first user found on the
 * other logs from the same request (e.g. the API Gateway step of a Storage
 * upload). Without one, reports the token role when the gateway logged it.
 */
export function resolveRequestUser(
  log: UserAttributableLog,
  relatedLogs: UserAttributableLog[] = []
): RequestUser {
  const userId = log.auth_user || relatedLogs.find((related) => related.auth_user)?.auth_user
  if (userId) return { kind: UUID_REGEX.test(userId) ? 'user' : 'external', userId }

  const role = [log, ...relatedLogs]
    .map((related) => related.metadata?.[REQUEST_ROLE_KEY])
    .find((value): value is string => typeof value === 'string' && value !== '')
  return { kind: 'none', role }
}
