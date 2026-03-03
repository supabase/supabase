import { TeamSettings } from 'components/interfaces/Organization/TeamSettings/TeamSettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from 'types'
import { LogoLoader } from 'ui'

const OrgTeamSettings: NextPageWithLayout = () => {
  const { isPending: isLoadingPermissions } = usePermissionsQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  return selectedOrganization === undefined && isLoadingPermissions ? (
    <LogoLoader />
  ) : (
    <TeamSettings />
  )
}

OrgTeamSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>{page}</OrganizationLayout>
  </DefaultLayout>
)

export default OrgTeamSettings
