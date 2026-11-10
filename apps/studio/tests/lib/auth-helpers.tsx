import { Session } from '@supabase/auth-js'
import { AuthContext as AuthContextType } from 'common'

export const createMockSession = (overrides: Partial<Session> = {}): Session => {
  const baseSession: Session = {
    access_token: '',
    refresh_token: '',
    expires_in: 1000,
    token_type: 'bearer',
    user: {
      id: '00000000-0000-0000-0000-000000000000',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2020-09-21T15:47:47.900481Z',
    },
  }

  return Object.assign(baseSession, overrides)
}

export const createMockAuthContext = (
  overrides: Partial<AuthContextType> = {}
): AuthContextType => {
  const session = overrides.session ?? createMockSession()
  const refreshSession = async () => session

  // @ts-expect-error Session is an union where when isLoading is true, session should be null
  return {
    session,
    error: overrides.error ?? null,
    isLoading: overrides.isLoading ?? false,
    refreshSession: overrides.refreshSession ?? refreshSession,
  }
}
