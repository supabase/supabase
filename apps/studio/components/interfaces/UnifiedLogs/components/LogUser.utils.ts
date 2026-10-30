import { UUID_REGEX } from '@/lib/constants'

const REQUEST_ROLE_KEY = 'request.sb.jwt.authorization.payload.role'

type UserAttributableLog = {
  auth_user?: string | null
  metadata?: Record<string, unknown> | null
}

export type RequestUser =
  | { kind: 'user'; userId: string }
  | { kind: 'external'; userId: string }
  | { kind: 'none'; role?: string }

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
