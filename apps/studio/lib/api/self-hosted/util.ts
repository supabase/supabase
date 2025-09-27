import { IS_PLATFORM } from 'lib/constants'
import crypto from 'crypto-js'
import assert from 'node:assert'

const ENCRYPTION_KEY = 'SAMPLE_KEY' // See postgres-meta `CRYPTO_KEY` fallback
const POSTGRES_PORT = 5432
const POSTGRES_HOST = 'db'
const POSTGRES_DATABASE = 'postgres'
const POSTGRES_USER = 'postgres'
const POSTGRES_USER_READ_ONLY = 'supabase_read_only_user'

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

export function getPostgresPassword() {
  assertSelfHosted()
  assert(process.env.POSTGRES_PASSWORD, 'POSTGRES_PASSWORD is required')

  return process.env.POSTGRES_PASSWORD
}

export function getConnectionString({ readOnly }: { readOnly: boolean }) {
  const postgresPassword = getPostgresPassword()
  const postgresUser = readOnly ? POSTGRES_USER_READ_ONLY : POSTGRES_USER

  return `postgresql://${postgresUser}:${postgresPassword}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`
}
