import { useParams } from 'common'

import { SettingsLayout } from 'components/layouts'
import { StorageSettings } from 'components/to-be-cleaned/Storage'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()

  return (
    <div className="1xl:px-28 mx-auto flex flex-col gap-8 px-5 py-6 lg:px-16 xl:px-24 2xl:px-32">
      <StorageSettings projectRef={projectRef} organizationSlug={organization?.slug} />
    </div>
  )
}

PageLayout.getLayout = (page) => <SettingsLayout title="Settings">{page}</SettingsLayout>

export default PageLayout
