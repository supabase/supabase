import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import { noop } from 'lodash'
import Link from 'next/link'
import { Badge, Button, Dropdown, IconChevronDown, IconEdit2, IconLoader, IconTrash } from 'ui'

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
          <Dropdown
            side="bottom"
            align="start"
            overlay={[
              <Dropdown.Item
                key="toggle-private"
                icon={<IconEdit2 size="tiny" />}
                onClick={() => onSelectEditBucket(bucket)}
              >
                Edit bucket
              </Dropdown.Item>,
              <Dropdown.Separator key="bucket-separator" />,
              <Dropdown.Item
                key="delete-bucket"
                icon={<IconTrash size="tiny" />}
                onClick={() => onSelectDeleteBucket(bucket)}
              >
                Delete bucket
              </Dropdown.Item>,
            ]}
          >
            <Button
              asChild
              type="text"
              icon={<IconChevronDown size="tiny" strokeWidth={2} className="text-scale-1100" />}
              style={{ padding: '3px' }}
            >
              <span></span>
            </Button>
          </Dropdown>
        ) : (
          <div className="w-5" />
        )}
      </div>
    </div>
  )
}

export default BucketRow
