import { PermissionAction } from '@supabase/shared-types/out/constants'
import FlagContext from 'components/ui/Flag/FlagContext'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useContext } from 'react'

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

export const useIsOptedIntoProjectLevelPermissions = (slug: string) => {
  const orgsOptedIn = useFlag('projectLevelPermissionsOptIn') as string | undefined
  const canReadSubscriptions = useCheckPermissions(
    PermissionAction.BILLING_READ,
    'stripe.subscriptions'
  )
  const { data: subscription } = useOrgSubscriptionQuery(
    { orgSlug: slug },
    { enabled: canReadSubscriptions }
  )

  const isEnterprise = subscription?.plan.id === 'enterprise'
  if (!isEnterprise) return false

  if (typeof orgsOptedIn === 'string') {
    const organizations = orgsOptedIn.split(',').map((x) => x.trim())
    return organizations.includes(slug)
  } else {
    return false
  }
}
