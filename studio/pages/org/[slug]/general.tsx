import { observer } from 'mobx-react-lite'

import { NextPageWithLayout } from 'types'
import { useStore } from 'hooks'
import Loading from 'components/ui/Loading'
import { OrganizationLayout } from 'components/layouts'
import { GeneralSettings } from 'components/interfaces/Organization'

const OrgGeneralSettings: NextPageWithLayout = () => {
  const { ui } = useStore()

  return (
    <>
      {ui.selectedOrganization === undefined && (ui?.permissions ?? []).length === 0 ? (
        <Loading />
      ) : (
        <GeneralSettings />
      )}
    </>
  )
}

OrgGeneralSettings.getLayout = (page) => <OrganizationLayout>{page}</OrganizationLayout>

export default observer(OrgGeneralSettings)
