import { Badge, Button, Dropdown, IconChevronDown, IconLoader, IconTrash } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions } from 'hooks'
import { STORAGE_ROW_STATUS } from 'components/to-be-cleaned/Storage/Storage.constants'
import clsx from 'clsx'
import Link from 'next/link'

interface BucketRowProps {
  bucket: any
  projectRef?: string
  isSelected: boolean
  onSelectDeleteBucket: (bucket: any) => void
  onSelectToggleBucketPublic: (bucket: any) => void
}

const BucketRow = ({
  bucket = {},
  projectRef = '',
  isSelected = false,
  onSelectDeleteBucket = () => {},
  onSelectToggleBucketPublic = () => {},
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
                onClick={() => onSelectToggleBucketPublic(bucket)}
              >
                {bucket.public ? 'Make private' : 'Make public'}
              </Dropdown.Item>,
              <Dropdown.Separator key="bucket-separator" />,
              <Dropdown.Item
                icon={<IconTrash size="tiny" />}
                key="delete-bucket"
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
        ) : null}
      </div>
    </div>
  )
}

export default BucketRow
