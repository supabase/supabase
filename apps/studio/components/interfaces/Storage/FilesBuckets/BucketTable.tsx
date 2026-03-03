import { useBucketPolicyCount } from 'components/interfaces/Storage/useBucketPolicyCount'
import {
  VirtualizedTableCell,
  VirtualizedTableHead,
  VirtualizedTableHeader,
  VirtualizedTableRow,
} from 'components/ui/VirtualizedTable'
import { Bucket } from 'data/storage/buckets-query'
import { FilesBucket as FilesBucketIcon } from 'icons'
import { formatBytes } from 'lib/helpers'
import { createNavigationHandler } from 'lib/navigation'
import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge, TableCell, TableHead, TableHeader, TableRow } from 'ui'

type BucketTableMode = 'standard' | 'virtualized'

type BucketTableHeaderProps = {
  mode: BucketTableMode
  hasBuckets?: boolean
}

export const BucketTableHeader = ({ mode, hasBuckets = true }: BucketTableHeaderProps) => {
  const BucketTableHeader = mode === 'standard' ? TableHeader : VirtualizedTableHeader
  const BucketTableRow = mode === 'standard' ? TableRow : VirtualizedTableRow
  const BucketTableHead = mode === 'standard' ? TableHead : VirtualizedTableHead

  const stickyClasses = 'sticky top-0 z-10 bg-200'

  return (
    <BucketTableHeader>
      <BucketTableRow>
        {hasBuckets && (
          <BucketTableHead className={`${stickyClasses} w-2 pr-1`}>
            <span className="sr-only">Icon</span>
          </BucketTableHead>
        )}
        <BucketTableHead className={stickyClasses}>Name</BucketTableHead>
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

export const BucketTableEmptyState = ({ mode, filterString }: BucketTableEmptyStateProps) => {
  const BucketTableRow = mode === 'standard' ? TableRow : VirtualizedTableRow
  const BucketTableCell = mode === 'standard' ? TableCell : VirtualizedTableCell

  return (
    <BucketTableRow className="[&>td]:hover:bg-inherit">
      <BucketTableCell colSpan={5}>
        <p className="text-sm text-foreground">No results found</p>
        <p className="text-sm text-foreground-lighter">
          Your search for “{filterString}” did not return any results
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
}

export const BucketTableRow = ({
  mode,
  bucket,
  projectRef,
  formattedGlobalUploadLimit,
}: BucketTableRowProps) => {
  const router = useRouter()
  const { getPolicyCount } = useBucketPolicyCount()

  const BucketTableRow = mode === 'standard' ? TableRow : VirtualizedTableRow
  const BucketTableCell = mode === 'standard' ? TableCell : VirtualizedTableCell

  const handleBucketNavigation = createNavigationHandler(
    `/project/${projectRef}/storage/files/buckets/${encodeURIComponent(bucket.id)}`,
    router
  )

  return (
    <BucketTableRow
      key={bucket.id}
      data-bucket-id={bucket.id}
      className="relative cursor-pointer h-16 group inset-focus"
      onClick={handleBucketNavigation}
      onAuxClick={handleBucketNavigation}
      onKeyDown={handleBucketNavigation}
      tabIndex={0}
    >
      <BucketTableCell className="w-2 pr-1">
        <FilesBucketIcon aria-label="bucket icon" size={16} className="text-foreground-muted" />
      </BucketTableCell>
      <BucketTableCell className="flex-1">
        <div className="flex items-center gap-2.5">
          <p className="whitespace-nowrap max-w-[512px] truncate">{bucket.id}</p>
          {bucket.public && <Badge variant="warning">Public</Badge>}
        </div>
      </BucketTableCell>

      <BucketTableCell>
        <p className="text-foreground-light">{getPolicyCount(bucket.id)}</p>
      </BucketTableCell>

      <BucketTableCell>
        <p
          className={`whitespace-nowrap ${bucket.file_size_limit ? 'text-foreground-light' : 'text-foreground-muted'}`}
        >
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
        <div className="flex justify-end items-center h-full">
          <ChevronRight aria-hidden={true} size={14} className="text-foreground-muted/60" />
        </div>
        <button tabIndex={-1} className="sr-only">
          Go to bucket details
        </button>
      </BucketTableCell>
    </BucketTableRow>
  )
}
