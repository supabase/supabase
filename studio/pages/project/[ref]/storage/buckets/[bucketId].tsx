import { useParams } from 'common'
import { find } from 'lodash'
import { observer } from 'mobx-react-lite'

import { StorageLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import StorageBucketsError from 'components/layouts/StorageLayout/StorageBucketsError'
import { StorageExplorer } from 'components/to-be-cleaned/Storage'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { NextPageWithLayout } from 'types'

const PageLayout: NextPageWithLayout = () => {
  const { ref, bucketId } = useParams()
  const { project } = useProjectContext()

  const { data, isSuccess, isError, error } = useBucketsQuery({ projectRef: ref })
  const buckets = data ?? []
  const bucket = find(buckets, { id: bucketId })

  if (!project) return null

  return (
    <div className="storage-container flex flex-grow p-4">
      {isError && <StorageBucketsError error={error as any} />}

      {isSuccess ? (
        !bucket ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-foreground-light">Bucket {bucketId} cannot be found</p>
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
