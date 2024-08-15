import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useContext } from 'react'

import FlagContext from 'components/ui/Flag/FlagContext'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export function useFlag<T = boolean>(name: string) {
  const store: any = useContext(FlagContext)

  const isObjectEmpty = (objectName: Object) => {
    return Object.keys(objectName).length === 0
  }

  if (!isObjectEmpty(store) && store[name] === undefined) {
    console.error(`Flag key "${name}" does not exist in flagStore`)
    return false
  }
  return store[name] as T
}
