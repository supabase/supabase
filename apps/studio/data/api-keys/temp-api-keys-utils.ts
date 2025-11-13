/**
 * Utilities for managing temporary API keys
 */

export interface TemporaryUploadKey {
  apiKey: string
  expiryTime: number
}

/**
 * Type guard to check if a temporary upload key is valid
 * Returns true if key exists, has all required properties, and has more than 60 seconds remaining
 *
 * @param key - The temporary upload key to validate
 * @returns true if the key is valid and has more than 60 seconds remaining
 */
export function isTemporaryUploadKeyValid(
  key: TemporaryUploadKey | null | undefined
): key is TemporaryUploadKey {
  if (!key) return false
  if (!key.apiKey || typeof key.expiryTime !== 'number') {
    return false
  }

  const now = Date.now()
  const timeRemaining = key.expiryTime - now
  return timeRemaining > 60000 // More than 60 seconds remaining
}

/**
 * Get the time remaining in milliseconds for a temporary upload key
 *
 * @param key - The temporary upload key
 * @returns The time remaining in milliseconds, or 0 if invalid
 */
export function getKeyTimeRemaining(key: TemporaryUploadKey | null | undefined): number {
  if (!key || typeof key.expiryTime !== 'number') return 0

  const now = Date.now()
  const timeRemaining = key.expiryTime - now
  return Math.max(0, timeRemaining)
}

/**
 * Create a temporary upload key object with expiry time
 *
 * @param apiKey - The API key string
 * @param expiryInSeconds - The expiry duration in seconds (default: 3600 = 1 hour)
 * @returns A temporary upload key object
 */
export function createTemporaryUploadKey(
  apiKey: string,
  expiryInSeconds: number = 3600
): TemporaryUploadKey {
  return {
    apiKey,
    expiryTime: Date.now() + expiryInSeconds * 1000,
  }
}

