import { DatabaseError } from 'pg'
import { StorageBackendError } from './storage-error'

const SLOWDOWN_MESSAGES = [
  'Authentication error', // supavisor specific
  'Max client connections reached',
  'remaining connection slots are reserved for non-replication superuser connections',
  'no more connections allowed',
  'sorry, too many clients already',
  'server login has been failing, try again later',
  'server login has been failing, cached error',
]

export function isDatabaseSlowDownError(error: Error): boolean {
  const databaseError = getDatabaseError(error)
  return Boolean(databaseError && hasDatabaseSlowDownMessage(databaseError.message))
}

export function hasDatabaseSlowDownMessage(message: string): boolean {
  for (const slowdownMessage of SLOWDOWN_MESSAGES) {
    if (message.includes(slowdownMessage)) {
      return true
    }
  }

  return false
}

function getDatabaseError(error: Error): DatabaseError | undefined {
  if (error instanceof DatabaseError) {
    return error
  }

  if (error instanceof StorageBackendError) {
    const originalError = error.getOriginalError()
    return originalError instanceof DatabaseError ? originalError : undefined
  }

  return undefined
}
