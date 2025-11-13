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

  const now = Date.now()
  const timeRemaining = key.expiryTime - now
  return timeRemaining > 60000 // More than 60 seconds remaining
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
  expiryInSeconds: number
): TemporaryUploadKey {
  return {
    apiKey,
    expiryTime: Date.now() + expiryInSeconds * 1000,
  }
}
