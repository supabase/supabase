import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, Menu, Alert, IconEdit } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useCheckPermissions } from 'hooks'
import { useParams } from 'common/hooks'
import BucketRow from './BucketRow'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { StorageBucket } from 'components/interfaces/Storage/Storage.types'
import EditBucketModal from 'components/interfaces/Storage/EditBucketModal'
import CreateBucketModal from 'components/interfaces/Storage/CreateBucketModal'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useBucketsQuery } from 'data/storage/buckets-query'

const StorageMenu = () => {
  const router = useRouter()
  const { ref, bucketId } = useParams()
  const [showCreateBucketModal, setShowCreateBucketModal] = useState(false)
  const [selectedBucketToEdit, setSelectedBucketToEdit] = useState<StorageBucket>()
  const canCreateBuckets = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const page = router.pathname.split('/')[4] as
    | undefined
    | 'policies'
    | 'settings'
    | 'usage'
    | 'logs'

  const storageExplorerStore = useStorageStore()
  const { data, isLoading, isError, isSuccess } = useBucketsQuery({ projectRef: ref })
  const { openDeleteBucketModal } = storageExplorerStore || {}

  const buckets = data ?? []

  return (
    <>
      <Menu type="pills" className="my-6 flex flex-grow flex-col px-5">
        <div className="mb-6 px-2">
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger className="w-full">
              <Button
                block
                type="default"
                icon={
                  <div className="text-scale-900">
                    <IconEdit size={14} />
                  </div>
                }
                disabled={!canCreateBuckets}
                style={{ justifyContent: 'start' }}
                onClick={() => setShowCreateBucketModal(true)}
              >
                New bucket
              </Button>
            </Tooltip.Trigger>
            {!canCreateBuckets && (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-scale-1200">
                      You need additional permissions to create buckets
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>
        <div className="space-y-6">
          <div className="">
            <div>
              <Menu.Group title="All buckets" />

              {isLoading && (
                <div className="space-y-2 mx-2">
                  <ShimmeringLoader className="!py-2.5" />
                  <ShimmeringLoader className="!py-2.5" />
                  <ShimmeringLoader className="!py-2.5" />
                </div>
              )}

              {isError && (
                <div className="px-2">
                  <Alert variant="warning" title="Failed to fetch buckets">
                    Please refresh to try again.
                  </Alert>
                </div>
              )}

              {isSuccess && (
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
                        onSelectEditBucket={() => setSelectedBucketToEdit(bucket)}
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

      <CreateBucketModal
        visible={showCreateBucketModal}
        onClose={() => setShowCreateBucketModal(false)}
      />

      <EditBucketModal
        visible={selectedBucketToEdit !== undefined}
        bucket={selectedBucketToEdit}
        onClose={() => setSelectedBucketToEdit(undefined)}
      />
    </>
  )
}

export default observer(StorageMenu)
