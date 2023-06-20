import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

import { useParams } from 'common'
import { StorageLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { StoragePolicies } from 'components/to-be-cleaned/Storage'
import { useFlag, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { NextPageWithLayout } from 'types'

/**
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout: NextPageWithLayout = () => {
  const { ref } = useParams()

  const { meta } = useStore()
  const { project } = useProjectContext()

  const kpsEnabled = useFlag('initWithKps')

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${ref}/restore`, { kps_enabled: kpsEnabled })
    }
    meta.roles.load()
  }, [project])

  if (!project) return <div></div>

  return (
    <div className="storage-container flex flex-grow p-4">
      <StoragePolicies />
    </div>
  )
}

PageLayout.getLayout = (page) => <StorageLayout title="Policies">{page}</StorageLayout>

export default observer(PageLayout)
