import type { AuthMFAGetAuthenticatorAssuranceLevelResponse } from '@supabase/supabase-js'
import { gotrueClient } from 'common/gotrue'

type MfaAssuranceLevelData = NonNullable<AuthMFAGetAuthenticatorAssuranceLevelResponse['data']>

export interface AuthService {
  signOut: () => ReturnType<typeof gotrueClient.signOut>
  getMfaAssuranceLevel: () => Promise<MfaAssuranceLevelData>
}

export const authServiceLive: AuthService = {
  signOut: () => gotrueClient.signOut(),
  getMfaAssuranceLevel: async () => {
    const { data, error } = await gotrueClient.mfa.getAuthenticatorAssuranceLevel()
    if (error) throw error
    return data
  },
}
