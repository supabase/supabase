import { TeamSettings } from 'components/interfaces/Organization/TeamSettings/TeamSettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { Loading } from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from 'types'

const OrgTeamSettings: NextPageWithLayout = () => {
  const { isLoading: isLoadingPermissions } = usePermissionsQuery()
  const selectedOrganization = useSelectedOrganization()

  return selectedOrganization === undefined && isLoadingPermissions ? <Loading /> : <TeamSettings />
}

OrgTeamSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default OrgTeamSettings
