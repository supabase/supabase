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
import { IS_PLATFORM } from '@/lib/constants'

/**
 * Asserts that the current environment is self-hosted.
 */
export function assertSelfHosted() {
  if (IS_PLATFORM) {
    throw new Error('This function can only be called in self-hosted environments')
  }
}

/**
 * Whether the self-hosted project's database is Spark instead of Postgres.
 *
 * Read per call: the same built image runs with or without `POSTGRES_ENGINE`.
 */
export function isSparkProject() {
  return process.env.POSTGRES_ENGINE === 'spark'
}

export function encryptString(stringToEncrypt: string): string {
  return crypto.AES.encrypt(stringToEncrypt, ENCRYPTION_KEY).toString()
}

export function getConnectionString({ readOnly }: { readOnly: boolean }) {
  const postgresUser = readOnly ? POSTGRES_USER_READ_ONLY : POSTGRES_USER_READ_WRITE

  return `postgresql://${postgresUser}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`
}
