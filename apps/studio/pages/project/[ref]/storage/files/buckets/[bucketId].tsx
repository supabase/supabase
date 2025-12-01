import { ChevronDown, FolderOpen, Settings, Shield, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DeleteBucketModal } from 'components/interfaces/Storage/DeleteBucketModal'
import { EditBucketModal } from 'components/interfaces/Storage/EditBucketModal'
import { EmptyBucketModal } from 'components/interfaces/Storage/EmptyBucketModal'
import { useSelectedBucket } from 'components/interfaces/Storage/FilesBuckets/useSelectedBucket'
import StorageBucketsError from 'components/interfaces/Storage/StorageBucketsError'
import { StorageExplorer } from 'components/interfaces/Storage/StorageExplorer/StorageExplorer'
import { useBucketPolicyCount } from 'components/interfaces/Storage/useBucketPolicyCount'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import StorageLayout from 'components/layouts/StorageLayout/StorageLayout'
import type { NextPageWithLayout } from 'types'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

const BucketPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { bucketId, ref } = useParams()
  const { data: bucket, error, isSuccess, isError } = useSelectedBucket()

  const [showEditModal, setShowEditModal] = useQueryState(
    'edit',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const [showEmptyModal, setShowEmptyModal] = useQueryState(
    'empty',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const [showDeleteModal, setShowDeleteModal] = useQueryState(
    'delete',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const { getPolicyCount } = useBucketPolicyCount()
  const policyCount = bucket ? getPolicyCount(bucket.id) : 0

  useEffect(() => {
    if (isSuccess && !bucket) {
      toast.info(`Bucket "${bucketId}" does not exist in your project`)
      router.push(`/project/${ref}/storage/files`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  if (isError) {
    return <StorageBucketsError error={error as any} />
  }

  return (
    <>
      <PageLayout
        size="full"
        isCompact
        className="[&>div:first-child]:!border-b-0" // Override the border-b from ScaffoldContainer
        title={
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="truncate">{bucketId}</span>
            {bucket?.public && (
              <Badge variant="warning" size="small" className="flex-shrink-0">
                Public
              </Badge>
            )}
          </div>
        }
        breadcrumbs={[
          {
            label: 'Files',
            href: `/project/${ref}/storage/files`,
          },
          {
            label: 'Buckets',
          },
        ]}
        primaryActions={
          <>
            <Button
              asChild
              type="default"
              icon={<Shield size={14} />}
              iconRight={
                policyCount > 0 ? (
                  <span className="w-4 h-4 bg-surface-200 text-foreground-light text-xs rounded-full flex items-center justify-center font-medium">
                    {policyCount}
                  </span>
                ) : undefined
              }
            >
              <Link
                href={`/project/${ref}/storage/files/policies?search=${encodeURIComponent(bucket?.name ?? '')}`}
              >
                Policies
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" iconRight={<ChevronDown size={14} />}>
                  Edit bucket
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  className="flex items-center space-x-2"
                  onClick={() => setShowEditModal(true)}
                >
                  <Settings size={12} />
                  <p>Bucket settings</p>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center space-x-2"
                  onClick={() => setShowEmptyModal(true)}
                >
                  <FolderOpen size={12} />
                  <p>Empty bucket</p>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center space-x-2"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={12} />
                  <p>Delete bucket</p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      >
        <div className="flex-1 min-h-0 px-6 pb-6">
          <StorageExplorer />
        </div>
      </PageLayout>

      {bucket && (
        <>
          <EditBucketModal
            visible={showEditModal}
            bucket={bucket}
            onClose={() => setShowEditModal(false)}
          />
          <EmptyBucketModal
            visible={showEmptyModal}
            bucket={bucket}
            onClose={() => setShowEmptyModal(false)}
          />
          <DeleteBucketModal
            visible={showDeleteModal}
            bucket={bucket}
            onClose={() => setShowDeleteModal(false)}
          />
        </>
      )}
    </>
  )
}

BucketPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default BucketPage
