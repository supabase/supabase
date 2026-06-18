import { LOCAL_STORAGE_KEYS } from 'common'

import { useLocalStorageQuery } from './useLocalStorage'
import { useProfile } from '@/lib/profile'

export const useLastVisitedOrganization = () => {
  const { profile, isLoading: isLoadingProfile, isSuccess: isSuccessProfile } = useProfile()
  const [
    lastVisitedOrganization,
    setLastVisitedOrganization,
    { isLoading: isLoadingLocalStorage, isSuccess: isSuccessLocalStorage },
  ] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION(profile?.id), '')

  const isSuccess = isSuccessProfile && isSuccessLocalStorage
  const isPending = isLoadingProfile || isLoadingLocalStorage

  return {
    isSuccess,
    isPending,
    lastVisitedOrganization: isSuccess ? lastVisitedOrganization : undefined,
    setLastVisitedOrganization,
  }
}
