import { ArrowDownNarrowWide, Edit, FolderOpen, MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import {
  VirtualizedTable,
  VirtualizedTableBody,
  VirtualizedTableCell,
  VirtualizedTableHead,
  VirtualizedTableHeader,
  VirtualizedTableRow,
} from 'components/ui/VirtualizedTable'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
import { useStoragePolicyCounts } from 'hooks/storage/useStoragePolicyCounts'
import { IS_PLATFORM } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { CreateBucketModal } from './CreateBucketModal'
import { DeleteBucketModal } from './DeleteBucketModal'
import { EditBucketModal } from './EditBucketModal'
import { EmptyBucketModal } from './EmptyBucketModal'
import { EmptyBucketState } from './EmptyBucketState'
import { STORAGE_BUCKET_SORT } from './Storage.constants'

type BucketDropdownMenuProps = {
  bucket: Bucket
  setSelectedBucket: (bucket: Bucket) => void
  setModal: (modal: 'edit' | 'empty' | 'delete' | null) => void
}

const BucketDropdownMenu = ({ bucket, setSelectedBucket, setModal }: BucketDropdownMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="default" className="px-1" icon={<MoreVertical />} />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-40">
        <DropdownMenuItem
          className="flex items-center space-x-2"
          onClick={() => {
            setModal('edit')
            setSelectedBucket(bucket)
          }}
        >
          <Edit size={12} />
          <p>Edit bucket</p>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center space-x-2"
          onClick={() => {
            setModal('empty')
            setSelectedBucket(bucket)
          }}
        >
          <FolderOpen size={12} />
          <p>Empty bucket</p>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex items-center space-x-2"
          onClick={() => {
            setModal('delete')
            setSelectedBucket(bucket)
          }}
        >
          <Trash2 size={12} />
          <p>Delete bucket</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type BucketsTableProps = {
  buckets: Bucket[]
  projectRef: string
  filterString: string
  formattedGlobalUploadLimit: string
  setSelectedBucket: (bucket: Bucket) => void
  setModal: (modal: 'edit' | 'empty' | 'delete' | null) => void
  getPolicyCount: (bucketName: string) => number
}

const BucketsTable = ({
  buckets,
  projectRef,
  filterString,
  formattedGlobalUploadLimit,
  setSelectedBucket,
  setModal,
  getPolicyCount,
}: BucketsTableProps) => {
  const showSearchEmptyState = buckets.length === 0 && filterString.length > 0

  return (
    <VirtualizedTable data={buckets} estimateSize={() => 59} getItemKey={(bucket) => bucket.id}>
      <VirtualizedTableHeader>
        <VirtualizedTableRow>
          <VirtualizedTableHead className="w-[280px]">Name</VirtualizedTableHead>
          <VirtualizedTableHead>Policies</VirtualizedTableHead>
          <VirtualizedTableHead>File size limit</VirtualizedTableHead>
          <VirtualizedTableHead>Allowed MIME types</VirtualizedTableHead>
          <VirtualizedTableHead>
            <span className="sr-only">Actions</span>
          </VirtualizedTableHead>
        </VirtualizedTableRow>
      </VirtualizedTableHeader>
      <VirtualizedTableBody<Bucket>
        paddingColSpan={5}
        emptyContent={
          showSearchEmptyState ? (
            <VirtualizedTableRow className="[&>td]:hover:bg-inherit">
              <VirtualizedTableCell colSpan={5}>
                <p className="text-sm text-foreground">No results found</p>
                <p className="text-sm text-foreground-light">
                  Your search for "{filterString}" did not return any results
                </p>
              </VirtualizedTableCell>
            </VirtualizedTableRow>
          ) : undefined
        }
      >
        {(bucket) => (
          <VirtualizedTableRow key={bucket.id}>
            <VirtualizedTableCell>
              <div className="flex items-center gap-2">
                <p title={bucket.id} className="text-foreground truncate max-w-[240px]">
                  {bucket.id}
                </p>
                {bucket.public && <Badge variant="warning">Public</Badge>}
              </div>
            </VirtualizedTableCell>

            <VirtualizedTableCell>
              <p className="text-foreground-light">{getPolicyCount(bucket.id)}</p>
            </VirtualizedTableCell>

            <VirtualizedTableCell>
              <p
                className={
                  bucket.file_size_limit ? 'text-foreground-light' : 'text-foreground-muted'
                }
              >
                {bucket.file_size_limit
                  ? formatBytes(bucket.file_size_limit)
                  : `Unset (${formattedGlobalUploadLimit})`}
              </p>
            </VirtualizedTableCell>

            <VirtualizedTableCell>
              <p
                className={
                  bucket.allowed_mime_types ? 'text-foreground-light' : 'text-foreground-muted'
                }
              >
                {bucket.allowed_mime_types ? bucket.allowed_mime_types.join(', ') : 'Any'}
              </p>
            </VirtualizedTableCell>

            <VirtualizedTableCell>
              <div className="flex justify-end gap-2">
                <Button asChild type="default">
                  <Link
                    href={`/project/${projectRef}/storage/files/buckets/${encodeURIComponent(bucket.id)}`}
                  >
                    View files
                  </Link>
                </Button>
                <BucketDropdownMenu
                  bucket={bucket}
                  setSelectedBucket={setSelectedBucket}
                  setModal={setModal}
                />
              </div>
            </VirtualizedTableCell>
          </VirtualizedTableRow>
        )}
      </VirtualizedTableBody>
    </VirtualizedTable>
  )
}

export const FilesBuckets = () => {
  const { ref } = useParams()
  const snap = useStorageExplorerStateSnapshot()

  const [modal, setModal] = useState<'edit' | 'empty' | 'delete' | null>(null)
  const [selectedBucket, setSelectedBucket] = useState<Bucket>()
  const [filterString, setFilterString] = useState('')

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { data: buckets = [], isLoading: isLoadingBuckets } = useBucketsQuery({ projectRef: ref })
  const { getPolicyCount, isLoading: isLoadingPolicies } = useStoragePolicyCounts(buckets)

  const formattedGlobalUploadLimit = formatBytes(data?.fileSizeLimit ?? 0)

  const isLoading = isLoadingBuckets || isLoadingPolicies
  const filesBuckets = buckets
    .filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD')
    .filter((bucket) =>
      filterString.length === 0
        ? true
        : bucket.id.toLowerCase().includes(filterString.toLowerCase())
    )

  const sortedFilesBuckets = useMemo(
    () =>
      snap.sortBucket === 'alphabetical'
        ? filesBuckets.sort((a, b) =>
            a.id.toLowerCase().trim().localeCompare(b.id.toLowerCase().trim())
          )
        : filesBuckets.sort((a, b) => (new Date(b.created_at) > new Date(a.created_at) ? 1 : -1)),
    [filesBuckets, snap.sortBucket]
  )

  return (
    <>
      {!isLoading &&
      buckets.filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD').length === 0 ? (
        <EmptyBucketState bucketType="files" />
      ) : (
        // Add !pt-8 to override the default first:pt-12
        <ScaffoldSection isFullWidth className="h-full gap-y-4">
          <div className="flex flex-grow justify-between gap-x-2 items-center">
            <div className="flex items-center gap-x-2">
              <Input
                size="tiny"
                className="flex-grow lg:flex-grow-0 w-52"
                placeholder="Search for a bucket"
                value={filterString}
                onChange={(e) => setFilterString(e.target.value)}
                icon={<Search size={12} />}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" icon={<ArrowDownNarrowWide />}>
                    Sorted by {snap.sortBucket === 'alphabetical' ? 'name' : 'created at'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  <DropdownMenuRadioGroup
                    value={snap.sortBucket}
                    onValueChange={(value) => snap.setSortBucket(value as STORAGE_BUCKET_SORT)}
                  >
                    <DropdownMenuRadioItem value="alphabetical">Sort by name</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="created_at">
                      Sort by created at
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CreateBucketModal buttonType="primary" buttonClassName="w-fit" />
          </div>

          {isLoading ? (
            <GenericSkeletonLoader />
          ) : (
            <Card>
              <BucketsTable
                buckets={sortedFilesBuckets}
                projectRef={ref ?? '_'}
                filterString={filterString}
                formattedGlobalUploadLimit={formattedGlobalUploadLimit}
                setSelectedBucket={setSelectedBucket}
                setModal={setModal}
                getPolicyCount={getPolicyCount}
              />
            </Card>
          )}
        </ScaffoldSection>
      )}

      {selectedBucket && (
        <>
          <EditBucketModal
            visible={modal === 'edit'}
            bucket={selectedBucket}
            onClose={() => setModal(null)}
          />
          <EmptyBucketModal
            visible={modal === 'empty'}
            bucket={selectedBucket}
            onClose={() => setModal(null)}
          />
          <DeleteBucketModal
            visible={modal === `delete`}
            bucket={selectedBucket}
            onClose={() => setModal(null)}
          />
        </>
      )}
    </>
  )
}
