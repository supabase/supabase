import { FC } from 'react'
import { Badge, Dropdown, IconLoader, IconMoreVertical, IconTrash } from 'ui'

import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import { STORAGE_ROW_STATUS } from 'components/to-be-cleaned/Storage/Storage.constants'

interface Props {
  bucket: any
  projectRef?: string
  isSelected: boolean
  onSelectDeleteBucket: (bucket: any) => void
  onSelectToggleBucketPublic: (bucket: any) => void
}

const BucketRow: FC<Props> = ({
  bucket = {},
  projectRef = '',
  isSelected = false,
  onSelectDeleteBucket = () => {},
  onSelectToggleBucketPublic = () => {},
}) => {
  return (
    <ProductMenuItem
      key={bucket.id}
      name={
        <div className="flex items-center justify-between space-x-2 truncate w-full">
          <p className="truncate" title={bucket.name}>
            {bucket.name}
          </p>
          {bucket.public && <Badge color="yellow">Public</Badge>}
        </div>
      }
      url={`/project/${projectRef}/storage/buckets/${bucket.id}`}
      isActive={isSelected}
      action={
        bucket.status === STORAGE_ROW_STATUS.LOADING ? (
          <IconLoader className="animate-spin" size={16} strokeWidth={2} />
        ) : bucket.status === STORAGE_ROW_STATUS.READY ? (
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
            <IconMoreVertical
              className="opacity-0 group-hover:opacity-100"
              size="tiny"
              strokeWidth={2}
            />
          </Dropdown>
        ) : (
          <div />
        )
      }
    />
  )
}

export default BucketRow
