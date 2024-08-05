import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import { noop } from 'lodash'
import Link from 'next/link'

import type { Bucket } from 'data/storage/buckets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconChevronDown,
  IconEdit2,
  IconTrash,
  IconXCircle,
  cn,
} from 'ui'

export interface BucketRowProps {
  bucket: Bucket
  projectRef?: string
  isSelected: boolean
  onSelectEmptyBucket: () => void
  onSelectDeleteBucket: () => void
  onSelectEditBucket: () => void
}

const BucketRow = ({
  bucket,
  projectRef = '',
  isSelected = false,
  onSelectEmptyBucket = noop,
  onSelectDeleteBucket = noop,
  onSelectEditBucket = noop,
}: BucketRowProps) => {
  const canUpdateBuckets = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  return (
    <div
      key={bucket.id}
      className={clsx(
        'group flex items-center justify-between rounded-md',
        isSelected && 'text-foreground bg-surface-100'
      )}
    >
      {/* Even though we trim whitespaces from bucket names, there may be some existing buckets with trailing whitespaces. */}
      <Link
        href={`/project/${projectRef}/storage/buckets/${encodeURIComponent(bucket.id)}`}
        className={cn('py-1 px-3', isSelected ? 'w-[88%]' : 'w-full')}
      >
        <div className="flex items-center justify-between space-x-2 truncate w-full">
          <p
            className={`text-sm group-hover:text-foreground transition truncate ${
              isSelected ? 'text-foreground' : 'text-foreground-light'
            }`}
            title={bucket.name}
          >
            {bucket.name}
          </p>
          {bucket.public && <Badge variant="warning">Public</Badge>}
        </div>
      </Link>
      {canUpdateBuckets && isSelected ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="text"
              icon={
                <IconChevronDown size="tiny" strokeWidth={2} className="text-foreground-light" />
              }
              className="mr-1 p-0.5"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem
              key="toggle-private"
              className="space-x-2"
              onClick={() => onSelectEditBucket()}
            >
              <IconEdit2 size="tiny" />
              <p>Edit bucket</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              key="delete-bucket"
              className="space-x-2"
              onClick={() => onSelectEmptyBucket()}
            >
              <IconXCircle size="tiny" />
              <p>Empty bucket</p>
            </DropdownMenuItem>
            <DropdownMenuItem
              key="delete-bucket"
              className="space-x-2"
              onClick={() => onSelectDeleteBucket()}
            >
              <IconTrash size="tiny" />
              <p>Delete bucket</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="w-5" />
      )}
    </div>
  )
}

export default BucketRow
