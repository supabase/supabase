import { getAccessToken, type User } from 'common/auth'
import { gotrueClient } from 'common/gotrue'

export const auth = gotrueClient
export { getAccessToken }

export const DEFAULT_FALLBACK_PATH = '/organizations'

export const validateReturnTo = (
  returnTo: string,
  fallback: string = DEFAULT_FALLBACK_PATH
): string => {
  // Block protocol-relative URLs and external URLs
  if (returnTo.startsWith('//') || returnTo.includes('://')) {
    return fallback
  }

  // For internal paths:
  // 1. Must start with /
  // 2. Only allow alphanumeric chars, slashes, hyphens, underscores
  // 3. For query params, also allow =, &, and ?
  const safePathPattern = /^\/[a-zA-Z0-9/\-_]*(?:\?[a-zA-Z0-9\-_=&]*)?$/
  return safePathPattern.test(returnTo) ? returnTo : fallback
}

export const getAuthUser = async (token: String): Promise<any> => {
  try {
    const {
      data: { user },
      error,
    } = await auth.getUser(token.replace('Bearer ', ''))
    if (error) throw error

    return { user, error: null }
  } catch (err) {
    console.error(err)
    return { user: null, error: err }
  }
}

export const getAuth0Id = (provider: String, providerId: String): String => {
  return `${provider}|${providerId}`
}

export const getIdentity = (gotrueUser: User) => {
  try {
    if (gotrueUser !== undefined && gotrueUser.identities !== undefined) {
      return { identity: gotrueUser.identities[0], error: null }
    }
    throw 'Missing identity'
  } catch (err) {
    return { identity: null, error: err }
  }
}

/**
 * Transfers the search params from the current location path to a newly built path
 */
export const buildPathWithParams = (pathname: string) => {
  const [basePath, existingParams] = pathname.split('?', 2)

  const pathnameSearchParams = new URLSearchParams(existingParams || '')

  // Merge the parameters, with pathname parameters taking precedence
  // over the current location's search parameters
  const mergedParams = new URLSearchParams(location.search)
  for (const [key, value] of pathnameSearchParams.entries()) {
    mergedParams.set(key, value)
  }

  const queryString = mergedParams.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

export const getReturnToPath = (fallback = DEFAULT_FALLBACK_PATH) => {
  // If we're in a server environment, return the fallback
  if (typeof location === 'undefined') {
    return fallback
  }

  const searchParams = new URLSearchParams(location.search)

  let returnTo = searchParams.get('returnTo') ?? fallback

  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    returnTo = returnTo.replace(process.env.NEXT_PUBLIC_BASE_PATH, '')
  }

  searchParams.delete('returnTo')

  const remainingSearchParams = searchParams.toString()
  const validReturnTo = validateReturnTo(returnTo, fallback)

  const [path, existingQuery] = validReturnTo.split('?')

  const finalSearchParams = new URLSearchParams(existingQuery || '')

  // Add all remaining search params to the final search params
  if (remainingSearchParams) {
    const remainingParams = new URLSearchParams(remainingSearchParams)
    remainingParams.forEach((value, key) => {
      finalSearchParams.append(key, value)
    })
  }

  const finalQuery = finalSearchParams.toString()
  return path + (finalQuery ? `?${finalQuery}` : '')
}
