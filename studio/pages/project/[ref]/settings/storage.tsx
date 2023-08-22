import { useParams } from 'common'

import { SettingsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { StorageSettings } from 'components/to-be-cleaned/Storage'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()

  return (
    <div className="flex flex-grow p-4 storage-container">
      <StorageSettings projectRef={projectRef} />
    </div>
  )
}

PageLayout.getLayout = (page) => <SettingsLayout title="Settings">{page}</SettingsLayout>

export default PageLayout
