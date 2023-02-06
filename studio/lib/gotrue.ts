import { GoTrueClient, User } from '@supabase/gotrue-js'

export const STORAGE_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'supabase.dashboard.auth.token'

export const auth = new GoTrueClient({
  url: process.env.NEXT_PUBLIC_GOTRUE_URL,
  storageKey: STORAGE_KEY,
  detectSessionInUrl: true,
})

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

// NOTE: do not use any imports in this function,
// as it is used standalone in the documents head
export const getReturnToPath = (fallback = '/projects') => {
  const searchParams = new URLSearchParams(location.search)
  let returnTo = searchParams.get('returnTo') ?? fallback

  searchParams.delete('returnTo')

  const remainingSearchParams = searchParams.toString()

  return returnTo + (remainingSearchParams ? `?${remainingSearchParams}` : '')
}
