import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config.js'

// Thin browser adapter over the pinned, locally served supabase-js bundle.
// Keeping the adapter small means Supabase owns session persistence, refresh
// rotation, PKCE, and the OAuth-server endpoint contract.

function configurationError() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return 'Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in config.js.'
  }
  if (SUPABASE_PUBLISHABLE_KEY.startsWith('YOUR_')) {
    return 'Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in config.js.'
  }

  try {
    new URL(SUPABASE_URL)
  } catch {
    return 'SUPABASE_URL in config.js must be a valid URL.'
  }

  if (typeof globalThis.supabase?.createClient !== 'function') {
    return 'The bundled Supabase client could not be loaded.'
  }

  return null
}

export const configError = configurationError()

const client = configError
  ? null
  : globalThis.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })

function auth() {
  if (configError || !client) throw new Error(configError ?? 'Supabase Auth is unavailable.')
  return client.auth
}

function dataOrThrow(result) {
  if (result.error) throw result.error
  return result.data
}

export async function getSession() {
  return dataOrThrow(await auth().getSession()).session
}

/** Return an Auth-verified user rather than trusting the copy in local storage. */
export async function getUser() {
  if (!(await getSession())) return null

  const { data, error } = await auth().getUser()
  if (!error) return data.user

  if (error.status === 401) {
    await auth().signOut({ scope: 'local' })
    return null
  }
  throw error
}

export async function signInWithPassword({ email, password }) {
  return dataOrThrow(await auth().signInWithPassword({ email, password })).session
}

export async function signUp({ email, password, emailRedirectTo }) {
  const data = dataOrThrow(
    await auth().signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    })
  )
  return data.session
}

export async function signOut() {
  const { error } = await auth().signOut()
  if (error) throw error
}

export async function signInWithProvider(provider, { redirectTo }) {
  const data = dataOrThrow(
    await auth().signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    })
  )
  if (!data.url) throw new Error('The provider did not return an authorization URL.')
  location.assign(data.url)
}

/** Drop auth parameters from the address bar so a reload cannot replay them. */
function stripAuthParamsFromUrl() {
  const url = new URL(location.href)
  for (const key of ['code', 'error', 'error_code', 'error_description']) {
    url.searchParams.delete(key)
  }
  url.hash = ''
  history.replaceState(null, '', url)
}

/**
 * Finish a PKCE provider/email callback or a legacy implicit callback.
 * Returns the new session, or null when this page load is not an Auth redirect.
 */
export async function completeSignInRedirect() {
  const query = new URLSearchParams(location.search)
  const fragment = new URLSearchParams(location.hash.replace(/^#/, ''))
  const errorDescription = query.get('error_description') ?? fragment.get('error_description')
  const code = query.get('code')
  const accessToken = fragment.get('access_token')

  if (!errorDescription && !code && !accessToken) return null

  if (errorDescription) {
    stripAuthParamsFromUrl()
    throw new Error(errorDescription)
  }

  let result
  if (code) {
    result = await auth().exchangeCodeForSession(code)
  } else {
    const refreshToken = fragment.get('refresh_token')
    if (!refreshToken) {
      stripAuthParamsFromUrl()
      throw new Error('The sign-in redirect did not include a refresh token.')
    }
    result = await auth().setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  stripAuthParamsFromUrl()
  return dataOrThrow(result).session
}

export async function getAuthorization(authorizationId) {
  return dataOrThrow(await auth().oauth.getAuthorizationDetails(authorizationId))
}

export async function decideAuthorization(authorizationId, action) {
  const options = { skipBrowserRedirect: true }
  const result =
    action === 'approve'
      ? await auth().oauth.approveAuthorization(authorizationId, options)
      : await auth().oauth.denyAuthorization(authorizationId, options)
  return dataOrThrow(result)
}

export async function listGrants() {
  const grants = dataOrThrow(await auth().oauth.listGrants())
  return Array.isArray(grants) ? grants : (grants?.grants ?? [])
}

export async function revokeGrant(clientId) {
  dataOrThrow(await auth().oauth.revokeGrant({ clientId }))
}
