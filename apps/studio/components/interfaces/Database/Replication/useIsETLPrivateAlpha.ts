import { useFlag } from 'common'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'

/**
 * Organization level opt in for ETL private alpha
 */
export const useIsETLPrivateAlpha = () => {
  const { data: organization } = useSelectedOrganizationQuery()

  const etlPrivateAlpha = useFlag('etlPrivateAlpha')
  const privateAlphaOrgSlugs =
    typeof etlPrivateAlpha === 'string'
      ? (etlPrivateAlpha as string).split(',').map((x) => x.trim())
      : []

  const etlShowForAllProjects = useFlag('etlPrivateAlphaOverride')

  return etlShowForAllProjects || privateAlphaOrgSlugs.includes(organization?.slug ?? '')
}
