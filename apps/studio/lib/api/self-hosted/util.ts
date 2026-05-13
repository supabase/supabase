import crypto from 'crypto-js'

import {
  ENCRYPTION_KEY,
  POSTGRES_DATABASE,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_USER_READ_ONLY,
  POSTGRES_USER_READ_WRITE,
} from './constants'
import { getProject } from './projects'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * Asserts that the current environment is self-hosted.
 */
export function assertSelfHosted() {
  if (IS_PLATFORM) {
    throw new Error('This function can only be called in self-hosted environments')
  }
}

export function encryptString(stringToEncrypt: string): string {
  return crypto.AES.encrypt(stringToEncrypt, ENCRYPTION_KEY).toString()
}

/**
 * Returns a PostgreSQL connection string for the given project ref.
 * When no ref is provided it defaults to `'default'`, which maps to the
 * legacy single-project env vars — maintaining full backward compatibility.
 */
export function getConnectionString({
  readOnly,
  ref = 'default',
}: {
  readOnly: boolean
  ref?: string
}) {
  // Try to look up per-project connection details from the registry.
  // Fall back to the global env-var constants when in platform mode or if
  // the registry throws (e.g. during tests where IS_PLATFORM may be true).
  try {
    const project = getProject(ref)
    const user = readOnly ? project.postgresUserReadOnly : project.postgresUserReadWrite
    return `postgresql://${user}:${project.postgresPassword}@${project.postgresHost}:${project.postgresPort}/${project.postgresDb}`
  } catch {
    // Fallback to the legacy global constants (used in tests / platform mode).
    const user = readOnly ? POSTGRES_USER_READ_ONLY : POSTGRES_USER_READ_WRITE
    return `postgresql://${user}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`
  }
}
