import crypto from 'crypto-js'

import {
  ENCRYPTION_KEY,
  POSTGRES_DATABASE,
  POSTGRES_DOCKER_HOST,
  POSTGRES_DOCKER_PORT,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_USER_READ_ONLY,
  POSTGRES_USER_READ_WRITE,
} from './constants'
import { IS_PLATFORM } from '@/lib/constants'
import { getDatabaseByRef, getEnvValue } from './registry'

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

export function decryptString(ciphertext: string): string {
  return crypto.AES.decrypt(ciphertext, ENCRYPTION_KEY).toString(crypto.enc.Utf8)
}

/**
 * Build a postgres connection string.
 *
 * When `ref` is provided and is not 'default', looks up the named database
 * from the registry and uses its credentials. Falls back to the env-based
 * single-DB configuration for backward compatibility.
 */
export function getConnectionString({
  readOnly,
  ref,
}: {
  readOnly: boolean
  ref?: string
}): string {
  const postgresUser = readOnly ? POSTGRES_USER_READ_ONLY : POSTGRES_USER_READ_WRITE

  if (ref && ref !== 'default') {
    const db = getDatabaseByRef(ref)
    if (db) {
      const password = getEnvValue(db.password_env)
      return `postgresql://${postgresUser}:${password}@${db.host}:${db.port}/${db.database}`
    }
  }

  // Fallback to env-based single DB (backward compat)
  return `postgresql://${postgresUser}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`
}

/**
 * Build a read-write connection string for a specific project ref.
 * Uses POSTGRES_DOCKER_HOST/PORT so the string is valid inside Docker
 * where pg-meta decrypts and uses it.
 */
export function getConnectionStringForRef(ref: string): string {
  const db = getDatabaseByRef(ref)
  if (!db) {
    return `postgresql://${POSTGRES_USER_READ_WRITE}:${POSTGRES_PASSWORD}@${POSTGRES_DOCKER_HOST}:${POSTGRES_DOCKER_PORT}/${POSTGRES_DATABASE}`
  }
  const password = getEnvValue(db.password_env)
  return `postgresql://${POSTGRES_USER_READ_WRITE}:${password}@${db.host}:${db.port}/${db.database}`
}
