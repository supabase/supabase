import { useOrganizationQuery } from '@/data/organizations/organization-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * Creation time of the selected organization, used to target free-plan experiments. Only
 * fetched for free-plan orgs. Read from the org detail endpoint as the org list response
 * doesn't include it.
 */
export function useSelectedOrganizationCreatedAtQuery() {
  const { data: selectedOrganization } = useSelectedOrganizationQuery({ enabled: IS_PLATFORM })
  const isFreePlan = selectedOrganization?.plan?.id === 'free'

  return useOrganizationQuery(
    { slug: selectedOrganization?.slug },
    { enabled: IS_PLATFORM && isFreePlan, select: (organization) => organization.created_at }
  )
}
