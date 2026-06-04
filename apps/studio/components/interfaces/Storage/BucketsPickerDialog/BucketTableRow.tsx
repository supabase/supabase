import { FilesBucket as FilesBucketIcon } from 'icons'
import { ChevronRight } from 'lucide-react'
import { KeyboardEventHandler, MouseEventHandler } from 'react'
import { Badge, cn, TableCell, TableRow, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { AllowedBucketType } from './types'
import { PUBLIC_BUCKET_TOOLTIP } from '@/components/interfaces/Storage/Storage.constants'
import { useBucketPolicyCount } from '@/components/interfaces/Storage/useBucketPolicyCount'
import { VirtualizedTableCell, VirtualizedTableRow } from '@/components/ui/VirtualizedTable'
import { Bucket } from '@/data/storage/buckets-query'
import { formatBytes } from '@/lib/helpers'

type BucketTableMode = 'standard' | 'virtualized'

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
  onSelectBucket: (bucket: Bucket) => void
  allowedBucketType: AllowedBucketType
  formattedGlobalUploadLimit: string
}

export const BucketTableRow = ({
  mode,
  bucket,
  onSelectBucket,
  allowedBucketType,
  formattedGlobalUploadLimit,
}: BucketTableRowProps) => {
  const { getPolicyCount } = useBucketPolicyCount()

  const BucketTableRow = mode === 'standard' ? TableRow : VirtualizedTableRow
  const BucketTableCell = mode === 'standard' ? TableCell : VirtualizedTableCell

  const isDisabled = !(
    allowedBucketType === 'all' ||
    (allowedBucketType === 'public' && bucket.public) ||
    (allowedBucketType === 'private' && !bucket.public)
  )

  const handleRowActivate: MouseEventHandler<HTMLTableRowElement> = (e) => {
    e.preventDefault()
    if (isDisabled) return
    onSelectBucket(bucket)
  }

  const handleRowKeyDown: KeyboardEventHandler<HTMLTableRowElement> = (e) => {
    if (isDisabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectBucket(bucket)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <BucketTableRow
          key={bucket.id}
          data-bucket-id={bucket.id}
          className={cn(
            'relative cursor-pointer h-16 group inset-focus',
            isDisabled && 'opacity-50 [&>td]:hover:bg-transparent cursor-not-allowed'
          )}
          onClick={handleRowActivate}
          onKeyDown={handleRowKeyDown}
          tabIndex={isDisabled ? -1 : 0}
          aria-disabled={isDisabled || undefined}
        >
          <BucketTableCell className="w-2 pr-1">
            <FilesBucketIcon aria-label="bucket icon" size={16} className="text-foreground-muted" />
          </BucketTableCell>
          <BucketTableCell className="flex-1">
            <div className="flex items-center gap-2.5">
              <p className="whitespace-nowrap max-w-[512px] truncate">{bucket.id}</p>
              {bucket.public && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="warning" className="flex">
                      Public
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">{PUBLIC_BUCKET_TOOLTIP}</TooltipContent>
                </Tooltip>
              )}
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
              className={
                bucket.allowed_mime_types ? 'text-foreground-light' : 'text-foreground-muted'
              }
            >
              {bucket.allowed_mime_types ? bucket.allowed_mime_types.join(', ') : 'Any'}
            </p>
          </BucketTableCell>

          <BucketTableCell>
            {!isDisabled && (
              <>
                <div className="flex justify-end items-center h-full">
                  <ChevronRight aria-hidden={true} size={14} className="text-foreground-muted/60" />
                </div>
                <button tabIndex={-1} className="sr-only">
                  Go to bucket details
                </button>
              </>
            )}
          </BucketTableCell>
        </BucketTableRow>
      </TooltipTrigger>
      {isDisabled && (
        <TooltipContent>
          {allowedBucketType === 'public'
            ? 'Private buckets are not selectable for this action. Please select a public bucket.'
            : 'Public buckets are not selectable for this action. Please select a private bucket.'}
        </TooltipContent>
      )}
    </Tooltip>
  )
}
