import type { Session } from '@supabase/supabase-js'
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { gotrueClient } from './gotrue'

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
      isLoading: false
    }
  | {
      session: null
      isLoading: true
    }

export type AuthContext = { refreshSession: () => Promise<Session | null> } & AuthState

export const AuthContext = createContext<AuthContext>({
  session: null,
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
  const [state, setState] = useState<AuthState>({ session: null, isLoading: true })

  // Keep the session in sync
  useEffect(() => {
    const {
      data: { subscription },
    } = gotrueClient.onAuthStateChange((_event, session) => {
      setState({ session, isLoading: false })
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
      return { session: DEFAULT_SESSION, isLoading: false, refreshSession } as const
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
