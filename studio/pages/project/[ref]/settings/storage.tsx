import { useEffect } from 'react'

import { useParams } from 'common/hooks'
import { SettingsLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { StorageSettings } from 'components/to-be-cleaned/Storage'
import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { project } = useProjectContext()

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${projectRef}/restore`, {})
    }
  }, [project])

  return (
    <div className="flex flex-grow p-4 storage-container">
      <StorageSettings projectRef={projectRef} />
    </div>
  )
}

PageLayout.getLayout = (page) => <SettingsLayout title="Settings">{page}</SettingsLayout>

export default PageLayout
