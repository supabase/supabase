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
        isSelected && 'text-scale-1200 bg-scale-300'
      )}
    >
      <Link href={`/project/${projectRef}/storage/buckets/${bucket.id}`}>
        <a className="py-1 px-3 w-full">
          <div className="flex items-center justify-between space-x-2 truncate w-full">
            <p
              className="text-sm text-scale-1100 group-hover:text-scale-1200 transition truncate"
              title={bucket.name}
            >
              {bucket.name}
            </p>
            {bucket.public && <Badge color="yellow">Public</Badge>}
          </div>
        </a>
      </Link>
      <div className="pr-3">
        {/* [JOSHEN TODO] need to change this */}
        {false ? (
          <IconLoader className="animate-spin" size={16} strokeWidth={2} />
        ) : canUpdateBuckets && isSelected ? (
          <DropdownMenu_Shadcn_>
            <DropdownMenuTrigger_Shadcn_>
              <Button
                asChild
                type="text"
                icon={<IconChevronDown size="tiny" strokeWidth={2} className="text-scale-1100" />}
                style={{ padding: '3px' }}
              >
                <span></span>
              </Button>
            </DropdownMenuTrigger_Shadcn_>
            <DropdownMenuContent_Shadcn_ side="bottom" align="start">
              <DropdownMenuItem_Shadcn_
                key="toggle-private"
                onClick={() => onSelectEditBucket(bucket)}
              >
                <IconEdit2 size="tiny" />
                <p className="text-scale-1200 text-sm">Edit bucket</p>
              </DropdownMenuItem_Shadcn_>
              <DropdownMenuSeparator_Shadcn_ key="bucket-separator" />
              <DropdownMenuItem_Shadcn_
                key="delete-bucket"
                onClick={() => onSelectDeleteBucket(bucket)}
              >
                <IconTrash size="tiny" />
                <p className="text-scale-1200 text-sm">Delete bucket</p>
              </DropdownMenuItem_Shadcn_>
            </DropdownMenuContent_Shadcn_>
          </DropdownMenu_Shadcn_>
        ) : (
          <div className="w-5" />
        )}
      </div>
    </div>
  )
}

export default BucketRow
