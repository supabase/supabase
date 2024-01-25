import { GeneralSettings as GeneralSettingsLegacy } from 'components/interfaces/Organization'
import { OrganizationLayout } from 'components/layouts'
import Loading from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'

const OrgGeneralSettings: NextPageWithLayout = () => {
  const { isLoading: isLoadingPermissions } = usePermissionsQuery()
  const selectedOrganization = useSelectedOrganization()

  return (
    <>
      {selectedOrganization === undefined && isLoadingPermissions ? (
        <Loading />
      ) : (
        <GeneralSettingsLegacy />
      )}
    </>
  )
}

OrgGeneralSettings.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>
export default OrgGeneralSettings
