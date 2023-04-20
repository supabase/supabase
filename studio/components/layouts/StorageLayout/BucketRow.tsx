import clsx from 'clsx'
import Link from 'next/link'
import { noop } from 'lodash'
import { Badge, Button, Dropdown, IconChevronDown, IconEdit2, IconLoader, IconTrash } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions } from 'hooks'
import { STORAGE_ROW_STATUS } from 'components/to-be-cleaned/Storage/Storage.constants'

interface BucketRowProps {
  bucket: any
  projectRef?: string
  isSelected: boolean
  onSelectDeleteBucket: (bucket: any) => void
  onSelectEditBucket: (bucket: any) => void
}

const BucketRow = ({
  bucket = {},
  projectRef = '',
  isSelected = false,
  onSelectDeleteBucket = noop,
  onSelectEditBucket = noop,
}: BucketRowProps) => {
  const canUpdateBuckets = checkPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

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
        {bucket.status === STORAGE_ROW_STATUS.LOADING ? (
          <IconLoader className="animate-spin" size={16} strokeWidth={2} />
        ) : canUpdateBuckets && bucket.status === STORAGE_ROW_STATUS.READY && isSelected ? (
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
              as="span"
              type="text"
              icon={<IconChevronDown size="tiny" strokeWidth={2} className="text-scale-1100" />}
              style={{ padding: '3px' }}
            />
          </Dropdown>
        ) : (
          <div className="w-5" />
        )}
      </div>
    </div>
  )
}

export default BucketRow
