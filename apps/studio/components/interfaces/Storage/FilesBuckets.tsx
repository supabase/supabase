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
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { CreateBucketModal } from './CreateBucketModal'
import { DeleteBucketModal } from './DeleteBucketModal'
import { EditBucketModal } from './EditBucketModal'
import { EmptyBucketModal } from './EmptyBucketModal'
import { EmptyBucketState } from './EmptyBucketState'
import { STORAGE_BUCKET_SORT } from './Storage.constants'

type BucketTableMode = 'standard' | 'virtualized'

type BucketTableHeaderProps = {
  mode: BucketTableMode
}

const BucketTableHeader = ({ mode }: BucketTableHeaderProps) => {
  const BucketTableHeader = mode === 'standard' ? TableHeader : VirtualizedTableHeader
  const BucketTableRow = mode === 'standard' ? TableRow : VirtualizedTableRow
  const BucketTableHead = mode === 'standard' ? TableHead : VirtualizedTableHead

  const stickyClasses = 'sticky top-0 z-10 bg-200'

  return (
    <BucketTableHeader>
      <BucketTableRow>
        <BucketTableHead className={cn('w-[280px]', stickyClasses)}>Name</BucketTableHead>
        <BucketTableHead className={stickyClasses}>Policies</BucketTableHead>
        <BucketTableHead className={stickyClasses}>File size limit</BucketTableHead>
        <BucketTableHead className={stickyClasses}>Allowed MIME types</BucketTableHead>
        <BucketTableHead className={stickyClasses}>
          <span className="sr-only">Actions</span>
        </BucketTableHead>
      </BucketTableRow>
    </BucketTableHeader>
  )
}

type BucketTableEmptyStateProps = {
  mode: BucketTableMode
  filterString: string
}

const BucketTableEmptyState = ({ mode, filterString }: BucketTableEmptyStateProps) => {
  const BucketTableRow = mode === 'standard' ? TableRow : VirtualizedTableRow
  const BucketTableCell = mode === 'standard' ? TableCell : VirtualizedTableCell

  return (
    <BucketTableRow className="[&>td]:hover:bg-inherit">
      <BucketTableCell colSpan={5}>
        <p className="text-sm text-foreground">No results found</p>
        <p className="text-sm text-foreground-light">
          Your search for "{filterString}" did not return any results
        </p>
      </BucketTableCell>
    </BucketTableRow>
  )
}

type BucketTableRowProps = {
  mode: BucketTableMode
  bucket: Bucket
  projectRef: string
  formattedGlobalUploadLimit: string
  getPolicyCount: (bucketName: string) => number
  setSelectedBucket: (bucket: Bucket) => void
  setModal: (modal: 'edit' | 'empty' | 'delete' | null) => void
}

const BucketTableRow = ({
  mode,
  bucket,
  projectRef,
  formattedGlobalUploadLimit,
  getPolicyCount,
  setSelectedBucket,
  setModal,
}: BucketTableRowProps) => {
  const BucketTableRow = mode === 'standard' ? TableRow : VirtualizedTableRow
  const BucketTableCell = mode === 'standard' ? TableCell : VirtualizedTableCell

  return (
    <BucketTableRow key={bucket.id}>
      <BucketTableCell>
        <div className="flex items-center gap-2">
          <p title={bucket.id} className="text-foreground truncate max-w-[240px]">
            {bucket.id}
          </p>
          {bucket.public && <Badge variant="warning">Public</Badge>}
        </div>
      </BucketTableCell>

      <BucketTableCell>
        <p className="text-foreground-light">{getPolicyCount(bucket.id)}</p>
      </BucketTableCell>

      <BucketTableCell>
        <p className={bucket.file_size_limit ? 'text-foreground-light' : 'text-foreground-muted'}>
          {bucket.file_size_limit
            ? formatBytes(bucket.file_size_limit)
            : `Unset (${formattedGlobalUploadLimit})`}
        </p>
      </BucketTableCell>

      <BucketTableCell>
        <p
          className={bucket.allowed_mime_types ? 'text-foreground-light' : 'text-foreground-muted'}
        >
          {bucket.allowed_mime_types ? bucket.allowed_mime_types.join(', ') : 'Any'}
        </p>
      </BucketTableCell>

      <BucketTableCell>
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
      </BucketTableCell>
    </BucketTableRow>
  )
}

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

const BucketsTableUnvirtualized = ({
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
    <Table
      containerProps={{ containerClassName: 'h-full overflow-auto', className: 'overflow-visible' }}
    >
      <BucketTableHeader mode="standard" />
      <TableBody>
        {showSearchEmptyState ? (
          <BucketTableEmptyState mode="standard" filterString={filterString} />
        ) : (
          buckets.map((bucket) => (
            <BucketTableRow
              mode="standard"
              key={bucket.id}
              bucket={bucket}
              projectRef={projectRef}
              formattedGlobalUploadLimit={formattedGlobalUploadLimit}
              getPolicyCount={getPolicyCount}
              setSelectedBucket={setSelectedBucket}
              setModal={setModal}
            />
          ))
        )}
      </TableBody>
    </Table>
  )
}

const BucketsTableVirtualized = ({
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
      <BucketTableHeader mode="virtualized" />
      <VirtualizedTableBody<Bucket>
        paddingColSpan={5}
        emptyContent={
          showSearchEmptyState ? (
            <BucketTableEmptyState mode="virtualized" filterString={filterString} />
          ) : undefined
        }
      >
        {(bucket) => (
          <BucketTableRow
            mode="virtualized"
            key={bucket.id}
            bucket={bucket}
            projectRef={projectRef}
            formattedGlobalUploadLimit={formattedGlobalUploadLimit}
            getPolicyCount={getPolicyCount}
            setSelectedBucket={setSelectedBucket}
            setModal={setModal}
          />
        )}
      </VirtualizedTableBody>
    </VirtualizedTable>
  )
}

const BucketsTable = (props: BucketsTableProps) => {
  const isVirtualized = props.buckets.length > 50
  return isVirtualized ? (
    <BucketsTableVirtualized {...props} />
  ) : (
    <BucketsTableUnvirtualized {...props} />
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
