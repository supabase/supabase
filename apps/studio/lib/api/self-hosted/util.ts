import { IS_PLATFORM } from 'lib/constants'
import crypto from 'crypto-js'

const ENCRYPTION_KEY = 'SAMPLE_KEY' // See postgres-meta `CRYPTO_KEY` fallback

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
