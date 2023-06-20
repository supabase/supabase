import { find } from 'lodash'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'

import { useParams } from 'common'
import { StorageLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { StorageExplorer } from 'components/to-be-cleaned/Storage'
import { useFlag } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { NextPageWithLayout } from 'types'

/**
 * PageLayout is used to setup layout - as usual it will requires inject global store
 */
const PageLayout: NextPageWithLayout = () => {
  const { ref, bucketId } = useParams()
  const { project } = useProjectContext()

  const storageStore = useStorageStore()
  const { buckets, loaded } = storageStore

  const kpsEnabled = useFlag('initWithKps')

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${ref}/restore`, { kps_enabled: kpsEnabled })
    }
  }, [project])

  if (!project) return <div></div>

  const bucket = find(buckets, { id: bucketId })

  return (
    <div className="storage-container flex flex-grow p-4">
      {loaded ? (
        !bucket ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-scale-1100">Bucket {bucketId} cannot be found</p>
          </div>
        ) : (
          // @ts-ignore
          <StorageExplorer bucket={bucket} />
        )
      ) : (
        <div />
      )}
    </div>
  )
}

PageLayout.getLayout = (page) => <StorageLayout title="Buckets">{page}</StorageLayout>

export default observer(PageLayout)
