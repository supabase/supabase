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
  IconPlus,
  IconLoader,
  IconMoreVertical,
} from '@supabase/ui'

import { STORAGE_ROW_STATUS } from 'components/to-be-cleaned/Storage/Storage.constants'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'

interface Props {}

const StorageMenu: FC<Props> = () => {
  const router = useRouter()
  const { ref, bucketId } = router.query
  const page = router.pathname.split('/')[4] as undefined | 'policies' | 'usage'

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
    <div className="my-6 flex flex-col flex-grow space-y-6">
      <div className="mx-4">
        <Button
          block
          icon={<IconPlus />}
          type="text"
          style={{ justifyContent: 'start' }}
          onClick={openCreateBucketModal}
        >
          New bucket
        </Button>
      </div>
      <div className="mx-4 my-4 space-y-2">
        <div className="mx-4 w-full flex">
          <Typography.Text type="secondary" small>
            All buckets
          </Typography.Text>
        </div>
        <div className="space-y-1">
          {!loaded ? (
            <div className="py-2 px-4 flex items-center space-x-2">
              <IconLoader className="animate-spin" size={12} strokeWidth={2} />
              <Typography.Text type="secondary">Loading buckets</Typography.Text>
            </div>
          ) : (
            <>
              {buckets.length === 0 && (
                <div className="py-2 px-4 flex items-center">
                  <Typography.Text type="secondary">No buckets available</Typography.Text>
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
      <div className="mx-4 flex flex-col space-y-2">
        <div className="mx-4 space-y-1">
          <Typography.Text type="secondary" small>
            Settings
          </Typography.Text>
        </div>
        <div className="dash-product-menu space-y-1">
          <Link href={`/project/${projectRef}/storage/policies`}>
            <a className="block">
              <Menu.Item rounded active={page === 'policies'}>
                <Typography.Text className="truncate">Policies</Typography.Text>
              </Menu.Item>
            </a>
          </Link>
          <Link href={`/project/${projectRef}/storage/usage`}>
            <a className="block">
              <Menu.Item rounded active={page === 'usage'}>
                <Typography.Text className="truncate">Usage</Typography.Text>
              </Menu.Item>
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default observer(StorageMenu)

const BucketRow = ({
  bucket = {},
  projectRef = '',
  isSelected = false,
  onSelectBucket = () => {},
  onSelectDeleteBucket = () => {},
  onSelectToggleBucketPublic = () => {},
}: any) => {
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
    <div className="group dash-product-menu">
      <Menu.Item rounded active={isSelected} onClick={() => onSelectBucket(bucket)}>
        <div className="flex items-center justify-between">
          {/* Need to investigate, why links here are reopning the entire page */}
          <Link href={`/project/${projectRef}/storage/buckets/${bucket.id}`}>
            <a className="block w-full">
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
