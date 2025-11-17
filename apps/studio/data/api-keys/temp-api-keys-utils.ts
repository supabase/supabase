export interface TemporaryUploadKey {
  apiKey: string
  expiryTime: number
}

export function createTemporaryUploadKey(
  apiKey: string,
  expiryInSeconds: number
): TemporaryUploadKey {
  return {
    apiKey,
    expiryTime: Date.now() + expiryInSeconds * 1000,
  }
}

export function isTemporaryUploadKeyValid(
  key: TemporaryUploadKey | null | undefined
): key is TemporaryUploadKey {
  if (!key) return false

  const now = Date.now()
  const timeRemaining = key.expiryTime - now
  return timeRemaining > 60000 // More than 60 seconds remaining
}
