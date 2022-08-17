import { GoTrueClient, User } from '@supabase/gotrue-js'

export const GOTRUE_URL =
  process.env.NEXT_PUBLIC_GOTRUE_URL || `${process.env.SUPABASE_URL}/auth/v1`

export const auth = new GoTrueClient({
  url: GOTRUE_URL,
  autoRefreshToken: true,
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
    console.log(err)
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
