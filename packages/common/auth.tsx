'use client'

import type { AuthError, Session } from '@supabase/supabase-js'
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { clearLocalStorage } from './constants/local-storage'
import { gotrueClient, type User } from './gotrue'

export type { User }

const DEFAULT_SESSION: any = {
  access_token: undefined,
  expires_at: 0,
  expires_in: 0,
  refresh_token: '',
  token_type: '',
  user: {
    aud: '',
    app_metadata: {},
    confirmed_at: '',
    created_at: '',
    email: '',
    email_confirmed_at: '',
    id: '',
    identities: [],
    last_signed_in_at: '',
    phone: '',
    role: '',
    updated_at: '',
    user_metadata: {},
  },
} as unknown as Session

/* Auth Context */

type AuthState =
  | {
      session: Session | null
      error: AuthError | null
      isLoading: false
    }
  | {
      session: null
      error: AuthError | null
      isLoading: true
    }

export type AuthContext = { refreshSession: () => Promise<Session | null> } & AuthState

export const AuthContext = createContext<AuthContext>({
  session: null,
  error: null,
  isLoading: true,
  refreshSession: () => Promise.resolve(null),
})

export type AuthProviderProps = {
  alwaysLoggedIn?: boolean
}

export const AuthProvider = ({
  alwaysLoggedIn,
  children,
}: PropsWithChildren<AuthProviderProps>) => {
  const [state, setState] = useState<AuthState>({ session: null, error: null, isLoading: true })

  useEffect(() => {
    let mounted = true
    gotrueClient.initialize().then(({ error }) => {
      if (mounted && error !== null) {
        setState((prev) => ({ ...prev, error }))
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  // Keep the session in sync
  useEffect(() => {
    const {
      data: { subscription },
    } = gotrueClient.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        session,
        // If there is a session, we clear the error
        error: session !== null ? null : prev.error,
        isLoading: false,
      }))
    })

    return subscription.unsubscribe
  }, [])

  // Helper method to refresh the session.
  // For example after a user updates their profile
  const refreshSession = useCallback(async () => {
    const {
      data: { session },
    } = await gotrueClient.refreshSession()

    return session
  }, [])

  const value = useMemo(() => {
    if (alwaysLoggedIn) {
      return { session: DEFAULT_SESSION, error: null, isLoading: false, refreshSession } as const
    } else {
      return { ...state, refreshSession } as const
    }
  }, [state, refreshSession])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* Auth Utils */

export const useAuth = () => useContext(AuthContext)

export const useSession = () => useAuth().session

export const useUser = () => useSession()?.user ?? null

export const useIsUserLoading = () => useAuth().isLoading

export const useIsLoggedIn = () => {
  const user = useUser()

  return user !== null
}

export const useAuthError = () => useAuth().error

export const useIsMFAEnabled = () => {
  const user = useUser()

  return user !== null && user.factors && user.factors.length > 0
}

export const signOut = async () => await gotrueClient.signOut()

export const logOut = async () => {
  await signOut()
  clearLocalStorage()
}

let currentSession: Session | null = null

gotrueClient.onAuthStateChange((event, session) => {
  currentSession = session
})

/**
 * Gets a current access token.
 *
 * Calls getSession, which will refresh the token if needed.
 */
export async function getAccessToken() {
  // ignore if server-side
  if (typeof window === 'undefined') return undefined

  const {
    data: { session },
    error,
  } = await gotrueClient.getSession()
  if (error) {
    throw error
  }

  return session?.access_token
}
