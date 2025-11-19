import { getTemporaryAPIKey } from './temp-api-keys-query'

type ProjectRef = string

const projectApiKeys = new Map<ProjectRef, Promise<TemporaryApiKey>>()

export interface TemporaryApiKey {
  apiKey: string
  expiryTime: number
}

export function createTemporaryApiKey(apiKey: string, expiryInSeconds: number): TemporaryApiKey {
  return {
    apiKey,
    expiryTime: Date.now() + expiryInSeconds * 1000,
  }
}

export function isTemporaryApiKeyValid(
  key: TemporaryApiKey | null | undefined
): key is TemporaryApiKey {
  if (!key) return false

  const now = Date.now()
  const timeRemaining = key.expiryTime - now
  return timeRemaining > 60000 // More than 60 seconds remaining
}

export async function getOrRefreshTemporaryApiKey(
  projectRef: ProjectRef
): Promise<TemporaryApiKey> {
  const existingKey = projectApiKeys.get(projectRef)
  const isValidKey = isTemporaryApiKeyValid(await existingKey)
  if (existingKey && isValidKey) {
    return existingKey
  }

  const expiryInSeconds = 600
  const data = getTemporaryAPIKey({
    projectRef,
    expiry: expiryInSeconds,
  }).then((data) => createTemporaryApiKey(data.api_key, expiryInSeconds))

  projectApiKeys.set(projectRef, data)
  return data
}
