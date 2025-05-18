import { OAuthApps } from 'components/interfaces/Organization'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { Loading } from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from 'types'

const OrgOAuthApps: NextPageWithLayout = () => {
  const selectedOrganization = useSelectedOrganization()
  const { isLoading: isLoadingPermissions } = usePermissionsQuery()

  return (
    <>{selectedOrganization === undefined && isLoadingPermissions ? <Loading /> : <OAuthApps />}</>
  )
}

OrgOAuthApps.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)
export default OrgOAuthApps
