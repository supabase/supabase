/**
 * [console fork] better-auth-backed shim for the GoTrue client.
 *
 * The forked dashboard authenticates against our control-plane better-auth
 * (`/api/auth/*`, same-origin via a Next rewrite -> the backend). This module
 * implements the subset of the `@supabase/auth-js` AuthClient surface that the
 * dashboard actually consumes (see `common/auth.tsx` + the SignIn form),
 * translating better-auth's REST responses into GoTrue-shaped `{ data, error }`.
 *
 * Auth is cookie-based: the session cookie (`supabase-console.session`) rides
 * every same-origin request, so there is no client-accessible JWT. We synthesize
 * a GoTrue-ish session object whose `access_token` is a sentinel; real API auth
 * happens server-side (the BFF forwards the cookie).
 */

const AUTH_BASE = '/api/auth'

type GotrueUser = {
  id: string
  email: string
  app_metadata: Record<string, unknown>
  user_metadata: Record<string, unknown>
  aud: string
  role: string
  created_at: string
  updated_at: string
  factors: unknown[]
  // carry through useful better-auth fields
  [k: string]: unknown
}

type GotrueSession = {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  token_type: string
  user: GotrueUser
}

type AuthChangeEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED'
type Subscriber = (event: AuthChangeEvent, session: GotrueSession | null) => void

const isBrowser = typeof window !== 'undefined'

function toGotrueUser(u: any): GotrueUser {
  return {
    id: u?.id ?? '',
    email: u?.email ?? '',
    app_metadata: { provider: 'email', role: u?.role },
    user_metadata: {
      full_name: u?.name,
      firstName: u?.firstName,
      lastName: u?.lastName,
      username: u?.username,
    },
    aud: 'authenticated',
    role: 'authenticated',
    created_at: u?.createdAt ?? '',
    updated_at: u?.updatedAt ?? '',
    // MFA factors: better-auth exposes a boolean; the dashboard only checks
    // `factors.length`, so reflect the boolean as a single synthetic factor.
    factors: u?.twoFactorEnabled ? [{ id: 'totp', factor_type: 'totp', status: 'verified' }] : [],
    name: u?.name,
    firstName: u?.firstName,
    lastName: u?.lastName,
    username: u?.username,
    twoFactorEnabled: u?.twoFactorEnabled,
  }
}

function toGotrueSession(payload: any): GotrueSession | null {
  if (!payload || !payload.user || !payload.session) return null
  const expiresAtMs = payload.session.expiresAt ? new Date(payload.session.expiresAt).getTime() : 0
  return {
    // Sentinel — real auth is the http-only cookie; not a usable bearer token.
    access_token: 'console-cookie-session',
    refresh_token: '',
    expires_at: Math.floor(expiresAtMs / 1000),
    expires_in: Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000)),
    token_type: 'cookie',
    user: toGotrueUser(payload.user),
  }
}

async function authFetch(path: string, init?: RequestInit) {
  return fetch(`${AUTH_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
}

function makeConsoleGotrueShim() {
  let currentSession: GotrueSession | null = null
  const subscribers = new Set<Subscriber>()

  const emit = (event: AuthChangeEvent) => {
    for (const cb of subscribers) {
      try {
        cb(event, currentSession)
      } catch {
        // a misbehaving subscriber must not break the others
      }
    }
  }

  const fetchSession = async (): Promise<GotrueSession | null> => {
    if (!isBrowser) return null
    try {
      const res = await authFetch('/get-session', { method: 'GET' })
      if (!res.ok) {
        currentSession = null
        return null
      }
      const json = await res.json().catch(() => null)
      currentSession = toGotrueSession(json)
      return currentSession
    } catch {
      currentSession = null
      return null
    }
  }

  const ok = <T,>(data: T) => ({ data, error: null as null })
  const fail = (message: string, status = 400) => ({
    data: { user: null, session: null },
    error: { message, status, name: 'AuthApiError', __isAuthError: true },
  })

  const shim = {
    async initialize() {
      await fetchSession()
      // defer so subscribers registered after initialize() still get the event
      if (isBrowser) setTimeout(() => emit('INITIAL_SESSION'), 0)
      return { error: null }
    },

    onAuthStateChange(cb: Subscriber) {
      subscribers.add(cb)
      // emit current state asynchronously, mirroring gotrue-js behavior
      if (isBrowser) setTimeout(() => cb('INITIAL_SESSION', currentSession), 0)
      return {
        data: {
          subscription: {
            id: Math.random().toString(36).slice(2),
            callback: cb,
            unsubscribe: () => {
              subscribers.delete(cb)
            },
          },
        },
      }
    },

    async getSession() {
      const session = await fetchSession()
      return ok({ session })
    },

    async getUser() {
      const session = await fetchSession()
      return session
        ? ok({ user: session.user })
        : { data: { user: null }, error: { message: 'No session', name: 'AuthApiError' } }
    },

    async refreshSession() {
      const session = await fetchSession()
      if (session) emit('TOKEN_REFRESHED')
      return ok({ session, user: session?.user ?? null })
    },

    async signInWithPassword(credentials: { email: string; password: string; options?: any }) {
      try {
        const res = await authFetch('/sign-in/email', {
          method: 'POST',
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          return fail(json?.message ?? 'Invalid login credentials', res.status)
        }
        const session = await fetchSession()
        emit('SIGNED_IN')
        return ok({ user: session?.user ?? toGotrueUser(json?.user), session })
      } catch (e: any) {
        return fail(e?.message ?? 'Failed to sign in', 500)
      }
    },

    // MFA namespace. The dashboard checks `currentLevel !== nextLevel` after
    // sign-in to decide whether to route to the second-factor screen. Until the
    // BFF surfaces two-factor status, report aal1==aal1 (no step-up needed).
    mfa: {
      async getAuthenticatorAssuranceLevel() {
        const session = await fetchSession()
        const hasTotp = !!(session?.user as any)?.twoFactorEnabled
        return ok({
          currentLevel: 'aal1',
          nextLevel: hasTotp ? 'aal2' : 'aal1',
          currentAuthenticationMethods: [],
        })
      },
      async listFactors() {
        return ok({ all: [], totp: [], phone: [] })
      },
    },

    async signOut() {
      try {
        await authFetch('/sign-out', { method: 'POST', body: '{}' })
      } catch {
        // ignore network errors on sign-out; clear local state regardless
      }
      currentSession = null
      emit('SIGNED_OUT')
      return { error: null }
    },
  }

  // Any AuthClient method we haven't implemented (sign-up, OTP, password reset,
  // identity linking, etc.) resolves to a benign "not implemented" error instead
  // of throwing, so unrelated pages don't crash the app on load.
  return new Proxy(shim, {
    get(target, prop: string) {
      if (prop in target) return (target as any)[prop]
      return async () => ({
        data: { user: null, session: null },
        error: {
          message: `auth.${prop} is not implemented in the console fork`,
          name: 'AuthApiError',
        },
      })
    },
  })
}

export const consoleGotrueShim = makeConsoleGotrueShim()
