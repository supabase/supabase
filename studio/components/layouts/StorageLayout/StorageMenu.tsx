import { FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { useParams } from 'hooks'
import { Button, Menu, IconLoader, Alert, IconEdit } from 'ui'

import BucketRow from './BucketRow'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'

interface Props {}

const StorageMenu: FC<Props> = () => {
  const router = useRouter()
  const { ref, bucketId } = useParams()

  const page = router.pathname.split('/')[4] as
    | undefined
    | 'policies'
    | 'settings'
    | 'usage'
    | 'logs'

  const storageExplorerStore = useStorageStore()
  const {
    loaded,
    buckets,
    openCreateBucketModal,
    openDeleteBucketModal,
    openToggleBucketPublicModal,
  } = storageExplorerStore || {}

  return (
    <Menu type="pills" className="my-6 flex flex-grow flex-col px-5">
      <div className="mb-6 px-2">
        <Button
          block
          type="default"
          icon={
            <div className="text-scale-900">
              <IconEdit size={14} />
            </div>
          }
          style={{ justifyContent: 'start' }}
          onClick={openCreateBucketModal}
        >
          New bucket
        </Button>
      </div>
      <div className="space-y-6">
        <div className="">
          <div>
            <Menu.Group title="All buckets" />
            {!loaded ? (
              <div className="flex items-center space-x-2 py-2 px-2">
                <IconLoader className="animate-spin" size={14} strokeWidth={2} />
                <span className="text-sm">Loading buckets</span>
              </div>
            ) : (
              <>
                {buckets.length === 0 && (
                  <div className="px-2">
                    <Alert title="No buckets available">
                      Buckets that you create will appear here
                    </Alert>
                  </div>
                )}
                {buckets.map((bucket: any, idx: number) => {
                  const isSelected = bucketId === bucket.id
                  return (
                    <BucketRow
                      key={`${idx}_${bucket.id}`}
                      bucket={bucket}
                      projectRef={ref}
                      isSelected={isSelected}
                      onSelectDeleteBucket={openDeleteBucketModal}
                      onSelectToggleBucketPublic={openToggleBucketPublicModal}
                    />
                  )
                })}
              </>
            )}
          </div>
        </div>
        <div className="h-px w-full bg-scale-500"></div>
        <div className="">
          <Menu.Group title="Configuration" />
          <Link href={`/project/${ref}/storage/policies`}>
            <Menu.Item rounded active={page === 'policies'}>
              <p className="truncate">Policies</p>
            </Menu.Item>
          </Link>
        </div>
      </div>
    </Menu>
  )
}

export default observer(StorageMenu)
