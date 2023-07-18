import { GeneralSettings } from 'components/interfaces/Organization'
import { OrganizationLayout } from 'components/layouts'
import SettingsLayout from 'components/layouts/SettingsLayout/SettingsLayout'
import Loading from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'

const OrganizationSettings: NextPageWithLayout = () => {
  const { isLoading: isLoadingPermissions } = usePermissionsQuery()
  const selectedOrganization = useSelectedOrganization()

  return (
    <>
      <p>settings</p>
    </>
  )
}

OrganizationSettings.getLayout = (page) => <SettingsLayout>{page}</SettingsLayout>
export default OrganizationSettings
