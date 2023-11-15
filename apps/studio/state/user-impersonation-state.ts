import { User } from 'data/auth/users-query'
import { proxy, snapshot, useSnapshot } from 'valtio'

export const userImpersonationState = proxy({
  user: null as User | null,
  setUser: (user: User | null) => {
    userImpersonationState.user = user
  },
})

export const getUserImpersonationStateSnapshot = () => snapshot(userImpersonationState)

export const useUserImpersonationStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(userImpersonationState, options)

export function getImpersonatedUser() {
  return getUserImpersonationStateSnapshot().user
}
