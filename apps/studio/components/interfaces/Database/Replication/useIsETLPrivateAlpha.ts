import { useFlag } from 'common'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

/**
 * Organization level opt in for ETL private alpha, there's 2 flags we're using which controls
 * the individual destination types. Access to the ETL UI (`useIsETLPrivateAlpha`) will just
 * check if the org has access to at least one of the destination types
 */
const useIsCurrentOrgInFlagList = (flag: string) => {
  const flagValue = useFlag(flag)
  const { data: organization } = useSelectedOrganizationQuery()

  const allowedOrgSlugs =
    typeof flagValue === 'string'
      ? (flagValue as string).split(',').map((x: string) => x.trim())
      : []

  // [Joshen] Override for to enable for all organizations by setting the flag value as `all`
  if (allowedOrgSlugs.includes('all')) return true

  // [Joshen] Otherwise fallback to checking against org slug
  return allowedOrgSlugs.includes(organization?.slug ?? '')
}

export const useIsETLBigQueryPrivateAlpha = () => {
  return useIsCurrentOrgInFlagList('etlEnableBigQueryPrivateAlpha')
}

export const useIsETLIcebergPrivateAlpha = () => {
  return useIsCurrentOrgInFlagList('etlEnableIcebergPrivateAlpha')
}

export const useIsETLPrivateAlpha = () => {
  const hasAccessToETLBigQuery = useIsCurrentOrgInFlagList('etlEnableBigQueryPrivateAlpha')
  const hasAccessToETLIceberg = useIsCurrentOrgInFlagList('etlEnableIcebergPrivateAlpha')

  return hasAccessToETLBigQuery || hasAccessToETLIceberg
}
