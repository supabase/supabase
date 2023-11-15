import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconEdit,
  Menu,
} from 'ui'

import CreateBucketModal from 'components/interfaces/Storage/CreateBucketModal'
import EditBucketModal from 'components/interfaces/Storage/EditBucketModal'
import { StorageBucket } from 'components/interfaces/Storage/Storage.types'
import { DeleteBucketModal } from 'components/to-be-cleaned/Storage'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useCheckPermissions, useSelectedProject } from 'hooks'
import BucketRow from './BucketRow'

const StorageMenu = () => {
  const router = useRouter()
  const { ref, bucketId } = useParams()
  const projectDetails = useSelectedProject()
  const isBranch = projectDetails?.parent_project_ref !== undefined

  const [showCreateBucketModal, setShowCreateBucketModal] = useState(false)
  const [selectedBucketToEdit, setSelectedBucketToEdit] = useState<StorageBucket>()
  const [selectedBucketToDelete, setSelectedBucketToDelete] = useState<StorageBucket>()
  const canCreateBuckets = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const page = router.pathname.split('/')[4] as
    | undefined
    | 'policies'
    | 'settings'
    | 'usage'
    | 'logs'

  const { data, error, isLoading, isError, isSuccess } = useBucketsQuery({ projectRef: ref })
  const buckets = data ?? []
  const tempNotSupported = error?.message.includes('Tenant config') && isBranch

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
                  <div className="text-foreground-lighter">
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
                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                      'border border-background',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      You need additional permissions to create buckets
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        </div>
        <div className="space-y-6">
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
                <Alert_Shadcn_ variant={tempNotSupported ? 'default' : 'warning'}>
                  <AlertTitle_Shadcn_ className="text-xs tracking-normal">
                    {tempNotSupported
                      ? 'Storage is not available on preview branches for now'
                      : 'Failed to fetch buckets'}
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_ className="text-xs">
                    {tempNotSupported
                      ? "We're actively looking into making this available on preview branches"
                      : 'Please refresh to try again'}
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
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
                {buckets.map((bucket, idx: number) => {
                  const isSelected = bucketId === bucket.id
                  return (
                    <BucketRow
                      key={`${idx}_${bucket.id}`}
                      bucket={bucket}
                      projectRef={ref}
                      isSelected={isSelected}
                      onSelectDeleteBucket={() => setSelectedBucketToDelete(bucket)}
                      onSelectEditBucket={() => setSelectedBucketToEdit(bucket)}
                    />
                  )
                })}
              </>
            )}
          </div>
          <div className="h-px w-full bg-border"></div>
          <div className="">
            <Menu.Group title="Configuration" />
            <Link href={`/project/${ref}/storage/policies`} legacyBehavior>
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

      <DeleteBucketModal
        visible={selectedBucketToDelete !== undefined}
        bucket={selectedBucketToDelete}
        onClose={() => setSelectedBucketToDelete(undefined)}
      />
    </>
  )
}

export default observer(StorageMenu)
