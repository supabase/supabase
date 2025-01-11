import type { User } from '@supabase/auth-js'
import { getAccessToken, gotrueClient } from 'common'

export const auth = gotrueClient
export { getAccessToken }

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
  const searchParams = new URLSearchParams(location.search)
  return `${pathname}?${searchParams.toString()}`
}

export const getReturnToPath = (fallback = '/projects') => {
  const searchParams = new URLSearchParams(location.search)

  let returnTo = searchParams.get('returnTo') ?? fallback

  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    returnTo = returnTo.replace(process.env.NEXT_PUBLIC_BASE_PATH, '')
  }

  searchParams.delete('returnTo')

  const remainingSearchParams = searchParams.toString()

  let validReturnTo

  // only allow returning to internal pages. e.g. /projects
  try {
    // if returnTo is a relative path, this will throw an error
    new URL(returnTo)
    // if no error, returnTo is a valid URL and NOT an internal page
    validReturnTo = fallback
  } catch (_) {
    // check returnTo doesn't try trick the browser to redirect
    // don't try sanitize, it is a losing battle. Go to fallback
    // disallow anything that starts with /non-word-char+/ or non-char+/
    const pattern = /^\/?[\W]+\//
    validReturnTo = pattern.test(returnTo) ? fallback : returnTo
  }

  return validReturnTo + (remainingSearchParams ? `?${remainingSearchParams}` : '')
}
