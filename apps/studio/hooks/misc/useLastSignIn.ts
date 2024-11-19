import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useLocalStorage } from './useLocalStorage'

export type LastSignInType = 'github' | 'email' | 'sso' | null

export function useLastSignIn() {
  return useLocalStorage<LastSignInType>(LOCAL_STORAGE_KEYS.LAST_SIGN_IN_METHOD, null)
}
