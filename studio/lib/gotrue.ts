import { User } from '@supabase/gotrue-js'
import { gotrueClient } from 'common'
import { DEFAULT_HOME, IS_PLATFORM } from './constants'
export { STORAGE_KEY } from 'common'

export const auth = gotrueClient

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

// NOTE: do not use any imports in this function as it is used standalone in the documents head
// [Joshen] Potentially can remove after full move over to /dashboard
export const getReturnToPath = (fallback = DEFAULT_HOME) => {
  const searchParams = new URLSearchParams(location.search)

  // [Joshen] Remove base path value ("/dashboard") from returnTo
  // because we're having this in the document's head, we won't have access
  // to process.env, hardcoding the value as a workaround
  const returnTo = (searchParams.get('returnTo') ?? fallback).replace('/dashboard', '')

  searchParams.delete('returnTo')

  const remainingSearchParams = searchParams.toString()

  let validReturnTo

  // only allow returning to internal pages. e.g. /dashboard
  try {
    // if returnTo is a relative path, this will throw an error
    new URL(returnTo)
    // if no error, returnTo is a valid URL and NOT an internal page
    validReturnTo = fallback
  } catch (_) {
    validReturnTo = returnTo
  }

  return validReturnTo + (remainingSearchParams ? `?${remainingSearchParams}` : '')
}
