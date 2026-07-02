import { useFlag } from 'common'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

/**
 * Organization-level access for Pipelines alpha destinations. The flag names still use
 * the original ETL identifiers, but the UI checks whether the org has access to at least one
 * destination type.
 */
const useIsCurrentOrgInFlagList = (flag: string) => {
  const flagValue = useFlag(flag)
  const { data: organization } = useSelectedOrganizationQuery()

  const allowedOrgSlugs =
    typeof flagValue === 'string'
      ? (flagValue as string).split(',').map((x: string) => x.trim())
      : []

  // [Joshen] Override to enable for all organizations by setting the flag value as `all`
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

export const useIsETLDucklakePrivateAlpha = () => {
  return useIsCurrentOrgInFlagList('etlEnableDucklakePrivateAlpha')
}

export const useIsETLSnowflakePrivateAlpha = () => {
  return useIsCurrentOrgInFlagList('etlEnableSnowflakePrivateAlpha')
}

export const useIsETLPrivateAlpha = () => {
  const hasAccessToETLBigQuery = useIsCurrentOrgInFlagList('etlEnableBigQueryPrivateAlpha')
  const hasAccessToETLIceberg = useIsCurrentOrgInFlagList('etlEnableIcebergPrivateAlpha')
  const hasAccessToETLDucklake = useIsCurrentOrgInFlagList('etlEnableDucklakePrivateAlpha')
  const hasAccessToETLSnowflake = useIsCurrentOrgInFlagList('etlEnableSnowflakePrivateAlpha')

  return (
    hasAccessToETLBigQuery ||
    hasAccessToETLIceberg ||
    hasAccessToETLDucklake ||
    hasAccessToETLSnowflake
  )
}
