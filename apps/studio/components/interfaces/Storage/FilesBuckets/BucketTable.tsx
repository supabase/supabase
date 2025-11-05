import { Edit, FolderOpen, MoreVertical, Trash2 } from 'lucide-react'
import Link from 'next/link'

import {
  VirtualizedTableCell,
  VirtualizedTableHead,
  VirtualizedTableHeader,
  VirtualizedTableRow,
} from 'components/ui/VirtualizedTable'
import { Bucket } from 'data/storage/buckets-query'
import { formatBytes } from 'lib/helpers'
import {
  Badge,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

type BucketTableMode = 'standard' | 'virtualized'

type BucketTableHeaderProps = {
  mode: BucketTableMode
}

export const BucketTableHeader = ({ mode }: BucketTableHeaderProps) => {
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

export const BucketTableEmptyState = ({ mode, filterString }: BucketTableEmptyStateProps) => {
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

export const BucketTableRow = ({
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
          <Link
            href={`/project/${projectRef}/storage/files/buckets/${encodeURIComponent(bucket.id)}`}
            title={bucket.id}
            className="text-link-table-cell"
          >
            {bucket.id}
          </Link>
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
