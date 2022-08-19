import { FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { useStore } from 'hooks'
import {
  Badge,
  Button,
  Dropdown,
  Menu,
  Typography,
  IconLoader,
  IconMoreVertical,
  Alert,
  IconEdit,
  IconTrash,
} from '@supabase/ui'

import ProductMenuItem from 'components/ui/ProductMenu/ProductMenuItem'
import { STORAGE_ROW_STATUS } from 'components/to-be-cleaned/Storage/Storage.constants'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'

interface Props {}

const StorageMenu: FC<Props> = () => {
  const router = useRouter()
  const { ref, bucketId } = router.query
  const page = router.pathname.split('/')[4] as undefined | 'policies' | 'settings' | 'usage'

  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref

  const storageExplorerStore = useStorageStore()
  const {
    loaded,
    buckets,
    openCreateBucketModal,
    openDeleteBucketModal,
    openToggleBucketPublicModal,
  } = storageExplorerStore || {}

  return (
    <Menu type="pills" className="my-6 flex flex-col flex-grow px-5">
      <div className="px-2 mb-6">
        <Button
          block
          type="default"
          icon={
            <div className="text-scale-900">
              <IconEdit size={14} />
            </div>
          }
          style={{ justifyContent: 'start' }}
          onClick={openCreateBucketModal}
        >
          New bucket
        </Button>
      </div>
      <div className="space-y-6">
        <div className="">
          <div>
            <Menu.Group title="All buckets" />
            {!loaded ? (
              <div className="py-2 px-2 flex items-center space-x-2">
                <IconLoader className="animate-spin" size={14} strokeWidth={2} />
                <span className="text-sm">Loading buckets</span>
              </div>
            ) : (
              <>
                {buckets.length === 0 && (
                  <div className="px-2">
                    <Alert title="No buckets available">
                      Buckets that you create will appear here
                    </Alert>
                  </div>
                )}
                {buckets.map((bucket: any, idx: number) => {
                  const isSelected = bucketId === bucket.id
                  return (
                    <BucketRow
                      key={`${idx}_${bucket.id}`}
                      bucket={bucket}
                      projectRef={ref}
                      isSelected={isSelected}
                      onSelectDeleteBucket={openDeleteBucketModal}
                      onSelectToggleBucketPublic={openToggleBucketPublicModal}
                    />
                  )
                })}
              </>
            )}
          </div>
        </div>

        <div className="">
          <Menu.Group title="Configuration" />
          <Link href={`/project/${projectRef}/storage/settings`}>
            <Menu.Item rounded active={page === 'settings'}>
              <Typography.Text className="truncate">Settings</Typography.Text>
            </Menu.Item>
          </Link>
          <Link href={`/project/${projectRef}/storage/policies`}>
            <Menu.Item rounded active={page === 'policies'}>
              <Typography.Text className="truncate">Policies</Typography.Text>
            </Menu.Item>
          </Link>
          <Link href={`/project/${projectRef}/storage/usage`}>
            <Menu.Item rounded active={page === 'usage'}>
              <Typography.Text className="truncate">Usage</Typography.Text>
            </Menu.Item>
          </Link>
        </div>
      </div>
    </Menu>
  )
}

export default observer(StorageMenu)

const BucketRow = ({
  bucket = {},
  projectRef = '',
  isSelected = false,
  onSelectDeleteBucket = () => {},
  onSelectToggleBucketPublic = () => {},
}: any) => {
  return (
    <ProductMenuItem
      key={bucket.id}
      name={
        <div className="flex items-center space-x-2">
          <Typography.Text>{bucket.name}</Typography.Text>
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
              <Dropdown.Seperator key="bucket-separator" />,
              <Dropdown.Item
                icon={<IconTrash size="tiny" />}
                key="delete-bucket"
                onClick={() => onSelectDeleteBucket(bucket)}
              >
                Delete bucket
              </Dropdown.Item>,
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
        ) : (
          <div />
        )
      }
    />
  )
}
