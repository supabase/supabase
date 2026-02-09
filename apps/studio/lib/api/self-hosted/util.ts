import crypto from 'crypto-js'
import { IS_PLATFORM } from 'lib/constants'

import {
  ENCRYPTION_KEY,
  POSTGRES_DATABASE,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PORT,
  POSTGRES_SSL_MODE,
  POSTGRES_USER_READ_ONLY,
  POSTGRES_USER_READ_WRITE,
} from './constants'

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

export function getConnectionString({ readOnly }: { readOnly: boolean }) {
  const postgresUser = readOnly ? POSTGRES_USER_READ_ONLY : POSTGRES_USER_READ_WRITE
  const postgresOptions = POSTGRES_SSL_MODE != '' ? `?sslmode=${POSTGRES_SSL_MODE}` : ''

  return `postgresql://${postgresUser}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}${postgresOptions}`
}
