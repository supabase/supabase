import { useParams } from 'common'
import { ChevronDown, FolderOpen, Settings, Shield, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { PageBreadcrumbs, PageBreadcrumbsActions } from 'ui-patterns/PageBreadcrumbs'
import { PageContainer } from 'ui-patterns/PageContainer'

import { DeleteBucketModal } from '@/components/interfaces/Storage/DeleteBucketModal'
import { EditBucketModal } from '@/components/interfaces/Storage/EditBucketModal'
import { EmptyBucketModal } from '@/components/interfaces/Storage/EmptyBucketModal'
import { useSelectedBucket } from '@/components/interfaces/Storage/FilesBuckets/useSelectedBucket'
import { PublicBucketWarning } from '@/components/interfaces/Storage/PublicBucketWarning'
import { PUBLIC_BUCKET_TOOLTIP } from '@/components/interfaces/Storage/Storage.constants'
import StorageBucketsError from '@/components/interfaces/Storage/StorageBucketsError'
import { StorageExplorer } from '@/components/interfaces/Storage/StorageExplorer/StorageExplorer'
import { useBucketPolicyCount } from '@/components/interfaces/Storage/useBucketPolicyCount'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import StorageLayout from '@/components/layouts/StorageLayout/StorageLayout'
import { StorageExplorerStateContextProvider } from '@/state/storage-explorer'
import type { NextPageWithLayout } from '@/types'

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
    return <StorageBucketsError error={error} />
  }

  return (
    <StorageExplorerStateContextProvider key={`storage-explorer-state-${ref}`}>
      <div className="w-full min-h-full flex flex-col items-stretch">
        <PageBreadcrumbs
          actions={
            <PageBreadcrumbsActions>
              <Button
                asChild
                variant="outline"
                size="tiny"
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
                  <Button variant="outline" size="tiny" iconRight={<ChevronDown size={14} />}>
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
            </PageBreadcrumbsActions>
          }
        >
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/project/${ref}/storage/files`}>Files</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/project/${ref}/storage/files`}>Buckets</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="flex min-w-0 items-center gap-2">
                <span className="truncate">{bucketId}</span>
                {bucket?.public && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="warning" className="flex shrink-0">
                        Public
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{PUBLIC_BUCKET_TOOLTIP}</TooltipContent>
                  </Tooltip>
                )}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageBreadcrumbs>

        <PageContainer size="full" className="flex flex-1 min-h-0 flex-col px-0 xl:px-0">
          {ref && bucketId && (
            <div className="px-4 py-4 empty:hidden">
              <PublicBucketWarning projectRef={ref} bucketId={bucketId} />
            </div>
          )}
          <div className="flex-1 min-h-0">
            <StorageExplorer />
          </div>
        </PageContainer>
      </div>

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
    </StorageExplorerStateContextProvider>
  )
}

BucketPage.getLayout = (page) => (
  <DefaultLayout>
    <StorageLayout title="Buckets">{page}</StorageLayout>
  </DefaultLayout>
)

export default BucketPage
