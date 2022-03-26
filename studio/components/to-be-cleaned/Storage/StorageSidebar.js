import {
  Badge,
  Button,
  Dropdown,
  Space,
  Menu,
  IconLoader,
  IconPlus,
  IconMoreVertical,
  Typography,
} from '@supabase/ui'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { STORAGE_ROW_STATUS } from './Storage.constants'
import Flag from 'components/ui/Flag/Flag'

// [Joshen] I think this file is no longer in use, double check before removing (replaced by StorageMenu.tsx)

const BucketRow = ({
  bucket = {},
  projectRef = '',
  isSelected = false,
  onSelectBucket = () => {},
  onSelectDeleteBucket = () => {},
  onSelectToggleBucketPublic = () => {},
}) => {
  const bucketOptions = [
    {
      name: 'Delete bucket',
      onClick: () => onSelectDeleteBucket(bucket),
    },
    {
      name: bucket.public ? 'Make private' : 'Make public',
      onClick: () => onSelectToggleBucketPublic(bucket),
    },
  ]
  return (
    <div className="group">
      <Menu.Item rounded active={isSelected} onClick={() => onSelectBucket(bucket)}>
        <div className="flex items-center justify-between">
          {/* Need to investigate, why links here are reopning the entire page */}
          <Link href={`/project/${projectRef}/storage/buckets/${bucket.id}`}>
            <a className="w-full">
              <div className="flex items-center space-x-2">
                <Typography.Text>{bucket.name}</Typography.Text>
                {bucket.public && <Badge color="yellow">Public</Badge>}
              </div>
            </a>
          </Link>

          {bucket.status === STORAGE_ROW_STATUS.LOADING && (
            <IconLoader className="animate-spin" size={16} strokeWidth={2} />
          )}
          {bucket.status === STORAGE_ROW_STATUS.READY && (
            <Dropdown
              side="bottom"
              align="end"
              overlay={[
                bucketOptions.map((option) => (
                  <Dropdown.Item key={option.name} onClick={option.onClick}>
                    {option.name}
                  </Dropdown.Item>
                )),
              ]}
            >
              <Typography.Text>
                <IconMoreVertical
                  className="opacity-0 group-hover:opacity-100"
                  size="tiny"
                  strokeWidth={2}
                />
              </Typography.Text>
            </Dropdown>
          )}
        </div>
      </Menu.Item>
    </div>
  )
}

const StorageSidebar = ({
  loaded = false,
  buckets = [],
  onSelectCreateBucket = () => {},
  onSelectDeleteBucket = () => {},
  onSelectToggleBucketPublic = () => {},
}) => {
  const router = useRouter()
  const { ref, bucketId } = router.query

  return (
    <Space direction={'vertical'} className="mt-4" size={8}>
      <Menu>
        <div className="my-2 px-3">
          <Menu.Misc>
            <Button
              block
              className="mx-1"
              icon={<IconPlus />}
              type="text"
              style={{ justifyContent: 'start' }}
              onClick={onSelectCreateBucket}
            >
              New bucket
            </Button>
          </Menu.Misc>
        </div>
        <div className="my-2 px-3">
          <Menu.Group title="All Buckets" />
          <div className="space-y-1">
            {!loaded ? (
              <div className="flex items-center px-4 space-x-2">
                <Typography.Text>
                  <IconLoader className="animate-spin" size="tiny" strokeWidth={2} />
                </Typography.Text>
                <span className="text-xs">Loading buckets</span>
              </div>
            ) : (
              <>
                {buckets.length === 0 && (
                  <Typography.Text type="secondary">
                    <p className="mx-4 my-2 text-sm">No buckets available</p>
                  </Typography.Text>
                )}
                {buckets.map((bucket, idx) => {
                  const isSelected = bucketId === bucket.id
                  return (
                    <BucketRow
                      key={`${idx}_${bucket.id}`}
                      bucket={bucket}
                      projectRef={ref}
                      isSelected={isSelected}
                      onSelectDeleteBucket={onSelectDeleteBucket}
                      onSelectToggleBucketPublic={onSelectToggleBucketPublic}
                    />
                  )
                })}
              </>
            )}
          </div>
        </div>
        <div className="my-4 px-3">
          <Menu.Group title="Configuration" />
          <div className="space-y-1">
            <Flag name="storageSettings">
              <div>
                <Link href={`/project/${ref}/storage/settings`}>
                  <a>
                    <Menu.Item
                      key="settings"
                      rounded
                      active={router.pathname === '/project/[ref]/storage/settings'}
                    >
                      <Typography.Text>Settings</Typography.Text>
                    </Menu.Item>
                  </a>
                </Link>
              </div>
            </Flag>
            <div>
              <Link href={`/project/${ref}/storage/policies`}>
                <a>
                  <Menu.Item
                    key="policies"
                    rounded
                    active={router.pathname === '/project/[ref]/storage/policies'}
                  >
                    <Typography.Text>Policies</Typography.Text>
                  </Menu.Item>
                </a>
              </Link>
            </div>
            <div>
              <Link href={`/project/${ref}/storage/usage`}>
                <a>
                  <Menu.Item
                    key="usage"
                    rounded
                    active={router.pathname === '/project/[ref]/storage/usage'}
                  >
                    <Typography.Text>Usage</Typography.Text>
                  </Menu.Item>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </Menu>
    </Space>
  )
}

export default StorageSidebar
