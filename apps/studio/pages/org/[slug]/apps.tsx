import { OAuthApps } from 'components/interfaces/Organization'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
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

OrgOAuthApps.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>
export default OrgOAuthApps
