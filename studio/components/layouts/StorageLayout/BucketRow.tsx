import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import { noop } from 'lodash'
import Link from 'next/link'
import {
  Badge,
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuSeparator_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconChevronDown,
  IconEdit2,
  IconLoader,
  IconTrash,
} from 'ui'

import { Bucket } from 'data/storage/buckets-query'
import { useCheckPermissions } from 'hooks'

export interface BucketRowProps {
  bucket: Bucket
  projectRef?: string
  isSelected: boolean
  onSelectDeleteBucket: (bucket: any) => void
  onSelectEditBucket: (bucket: any) => void
}

const BucketRow = ({
  bucket,
  projectRef = '',
  isSelected = false,
  onSelectDeleteBucket = noop,
  onSelectEditBucket = noop,
}: BucketRowProps) => {
  const canUpdateBuckets = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  return (
    <div
      key={bucket.id}
      className={clsx(
        'group flex items-center justify-between rounded-md',
        isSelected && 'text-foreground bg-scale-300'
      )}
    >
      <Link href={`/project/${projectRef}/storage/buckets/${bucket.id}`}>
        <a className="py-1 px-3 w-full">
          <div className="flex items-center justify-between space-x-2 truncate w-full">
            <p
              className="text-sm text-foreground-light group-hover:text-foreground transition truncate"
              title={bucket.name}
            >
              {bucket.name}
            </p>
            {bucket.public && <Badge color="yellow">Public</Badge>}
          </div>
        </a>
      </Link>
      {/* [JOSHEN TODO] need to change this */}
      {false ? (
        <IconLoader className="animate-spin" size={16} strokeWidth={2} />
      ) : canUpdateBuckets && isSelected ? (
        <DropdownMenu_Shadcn_>
          <DropdownMenuTrigger_Shadcn_ asChild>
            <Button
              asChild
              type="text"
              icon={
                <IconChevronDown size="tiny" strokeWidth={2} className="text-foreground-light" />
              }
              className="mr-1 p-0.5"
            >
              <span></span>
            </Button>
          </DropdownMenuTrigger_Shadcn_>
          <DropdownMenuContent_Shadcn_ side="bottom" align="start">
            <DropdownMenuItem_Shadcn_
              key="toggle-private"
              className="space-x-2"
              onClick={() => onSelectEditBucket(bucket)}
            >
              <IconEdit2 size="tiny" />
              <p className="text">Edit bucket</p>
            </DropdownMenuItem_Shadcn_>
            <DropdownMenuSeparator_Shadcn_ />
            <DropdownMenuItem_Shadcn_
              key="delete-bucket"
              className="space-x-2"
              onClick={() => onSelectDeleteBucket(bucket)}
            >
              <IconTrash size="tiny" />
              <p className="text">Delete bucket</p>
            </DropdownMenuItem_Shadcn_>
          </DropdownMenuContent_Shadcn_>
        </DropdownMenu_Shadcn_>
      ) : (
        <div className="w-5" />
      )}
    </div>
  )
}

export default BucketRow
