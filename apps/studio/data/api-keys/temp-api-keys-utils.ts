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

const checkOrRefreshTemporaryApiKey = async (
  projectRef: ProjectRef,
  existingKey: Promise<TemporaryApiKey> | undefined
): Promise<TemporaryApiKey> => {
  const resolvedKey = await existingKey
  if (isTemporaryApiKeyValid(resolvedKey)) {
    return resolvedKey
  }

  const expiryInSeconds = 600
  const fetchedKey = getTemporaryAPIKey({
    projectRef,
    expiry: expiryInSeconds,
  }).then((data) => createTemporaryApiKey(data.api_key, expiryInSeconds))

  return fetchedKey
}

// This function should never be marked as async, it should always return a promise.
export function getOrRefreshTemporaryApiKey(projectRef: ProjectRef): Promise<TemporaryApiKey> {
  const existingKey = projectApiKeys.get(projectRef)
  if (!existingKey) {
    const data = checkOrRefreshTemporaryApiKey(projectRef, undefined)
    projectApiKeys.set(projectRef, data)
  }
  return projectApiKeys.get(projectRef)!
}
