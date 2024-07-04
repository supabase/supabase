import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ArrowUpRight, Edit } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import CreateBucketModal from 'components/interfaces/Storage/CreateBucketModal'
import EditBucketModal from 'components/interfaces/Storage/EditBucketModal'
import type { StorageBucket } from 'components/interfaces/Storage/Storage.types'
import { DeleteBucketModal } from 'components/to-be-cleaned/Storage'
import { EmptyBucketModal } from 'components/to-be-cleaned/Storage/EmptyBucketModal'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Menu } from 'ui'
import BucketRow from './BucketRow'

const StorageMenu = () => {
  const router = useRouter()
  const { ref, bucketId } = useParams()
  const projectDetails = useSelectedProject()
  const isBranch = projectDetails?.parent_project_ref !== undefined

  const [showCreateBucketModal, setShowCreateBucketModal] = useState(false)
  const [selectedBucketToEdit, setSelectedBucketToEdit] = useState<StorageBucket>()
  const [selectedBucketToEmpty, setSelectedBucketToEmpty] = useState<StorageBucket>()
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
      <Menu type="pills" className="my-6 flex flex-grow flex-col">
        <div className="mb-6 mx-5">
          <ButtonTooltip
            block
            type="default"
            icon={<Edit size={14} />}
            disabled={!canCreateBuckets}
            style={{ justifyContent: 'start' }}
            onClick={() => setShowCreateBucketModal(true)}
            tooltip={{
              content: {
                side: 'bottom',
                text: 'You need additional permissions to create buckets',
              },
            }}
          >
            New bucket
          </ButtonTooltip>
        </div>

        <div className="space-y-6">
          <div className="mx-3">
            <Menu.Group title={<span className="uppercase font-mono">All buckets</span>} />

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
                    <Alert_Shadcn_>
                      <AlertTitle_Shadcn_>No buckets available</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        Buckets that you create will appear here
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
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
                      onSelectEmptyBucket={() => setSelectedBucketToEmpty(bucket)}
                      onSelectDeleteBucket={() => setSelectedBucketToDelete(bucket)}
                      onSelectEditBucket={() => setSelectedBucketToEdit(bucket)}
                    />
                  )
                })}
              </>
            )}
          </div>

          <div className="h-px w-full bg-border" />

          <div className="mx-3">
            <Menu.Group title={<span className="uppercase font-mono">Configuration</span>} />
            <Link href={`/project/${ref}/storage/policies`} legacyBehavior>
              <Menu.Item rounded active={page === 'policies'}>
                <p className="truncate">Policies</p>
              </Menu.Item>
            </Link>
            <Link href={`/project/${ref}/settings/storage`}>
              <Menu.Item rounded>
                <div className="flex items-center justify-between">
                  <p className="truncate">Settings</p>
                  <ArrowUpRight strokeWidth={1} className="h-4 w-4" />
                </div>
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

      <EmptyBucketModal
        visible={selectedBucketToEmpty !== undefined}
        bucket={selectedBucketToEmpty}
        onClose={() => setSelectedBucketToEmpty(undefined)}
      />

      <DeleteBucketModal
        visible={selectedBucketToDelete !== undefined}
        bucket={selectedBucketToDelete}
        onClose={() => setSelectedBucketToDelete(undefined)}
      />
    </>
  )
}

export default StorageMenu
