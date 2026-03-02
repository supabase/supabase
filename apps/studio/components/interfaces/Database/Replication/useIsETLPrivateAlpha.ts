import { useFlag } from 'common'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'

const useIsCurrentOrgInFlagList = (flagName: string, overrideFlagName?: string) => {
  const { data: organization } = useSelectedOrganizationQuery()

  const flagValue = useFlag<string | boolean>(flagName)
  const allowedOrgSlugs =
    typeof flagValue === 'string' ? flagValue.split(',').map((x: string) => x.trim()) : []

  const isOverrideEnabled = overrideFlagName ? useFlag(overrideFlagName) : false

  return isOverrideEnabled || allowedOrgSlugs.includes(organization?.slug ?? '')
}

/**
 * Organization level opt in for ETL private alpha
 */
export const useIsETLPrivateAlpha = () => {
  return useIsCurrentOrgInFlagList('etlPrivateAlpha', 'etlPrivateAlphaOverride')
}

export const useIsETLBigQueryPrivateAlpha = () => {
  return useIsCurrentOrgInFlagList('etlEnableBigQueryPrivateAlpha')
}

export const useIsETLIcebergPrivateAlpha = () => {
  return useIsCurrentOrgInFlagList('etlEnableIcebergPrivateAlpha')
}
