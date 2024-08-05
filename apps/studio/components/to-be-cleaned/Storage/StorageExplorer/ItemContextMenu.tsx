import { PermissionAction } from '@supabase/shared-types/out/constants'
import { noop } from 'lodash'
import { observer } from 'mobx-react-lite'
import { Item, Menu, Separator, Submenu } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'

import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { IconChevronRight, IconClipboard, IconDownload, IconEdit, IconMove, IconTrash2 } from 'ui'
import { URL_EXPIRY_DURATION } from '../Storage.constants'
import { StorageItemWithColumn } from '../Storage.types'

interface ItemContextMenuProps {
  id: string
  onCopyUrl: (name: string, url: string) => void
}

const ItemContextMenu = ({ id = '', onCopyUrl = noop }: ItemContextMenuProps) => {
  const storageExplorerStore = useStorageStore()
  const {
    getFileUrl,
    downloadFile,
    selectedBucket,
    setSelectedItemsToDelete,
    setSelectedItemToRename,
    setSelectedItemsToMove,
    setSelectedFileCustomExpiry,
  } = storageExplorerStore
  const isPublic = selectedBucket.public
  const canUpdateFiles = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const onHandleClick = async (event: any, item: StorageItemWithColumn, expiresIn?: number) => {
    if (item.isCorrupted) return
    switch (event) {
      case 'copy':
        if (expiresIn !== undefined && expiresIn < 0) return setSelectedFileCustomExpiry(item)
        else return onCopyUrl(item.name, await getFileUrl(item, expiresIn))
      case 'rename':
        return setSelectedItemToRename(item)
      case 'move':
        return setSelectedItemsToMove([item])
      case 'download':
        return await downloadFile(item)
      default:
        break
    }
  }

  return (
    <Menu id={id} animation="fade">
      {isPublic ? (
        <Item onClick={({ props }) => onHandleClick('copy', props.item)}>
          <IconClipboard size="tiny" />
          <span className="ml-2 text-xs">Get URL</span>
        </Item>
      ) : (
        <Submenu
          label={
            <div className="flex items-center space-x-2">
              <IconClipboard size="tiny" />
              <span className="text-xs">Get URL</span>
            </div>
          }
          arrow={<IconChevronRight size="tiny" />}
        >
          <Item
            onClick={({ props }) => onHandleClick('copy', props.item, URL_EXPIRY_DURATION.WEEK)}
          >
            <span className="ml-2 text-xs">Expire in 1 week</span>
          </Item>
          <Item
            onClick={({ props }) => onHandleClick('copy', props.item, URL_EXPIRY_DURATION.MONTH)}
          >
            <span className="ml-2 text-xs">Expire in 1 month</span>
          </Item>
          <Item
            onClick={({ props }) => onHandleClick('copy', props.item, URL_EXPIRY_DURATION.YEAR)}
          >
            <span className="ml-2 text-xs">Expire in 1 year</span>
          </Item>
          <Item onClick={({ props }) => onHandleClick('copy', props.item, -1)}>
            <span className="ml-2 text-xs">Custom expiry</span>
          </Item>
        </Submenu>
      )}
      {canUpdateFiles && [
        <Item key="rename-file" onClick={({ props }) => onHandleClick('rename', props.item)}>
          <IconEdit size="tiny" />
          <span className="ml-2 text-xs">Rename</span>
        </Item>,
        <Item key="move-file" onClick={({ props }) => onHandleClick('move', props.item)}>
          <IconMove size="tiny" />
          <span className="ml-2 text-xs">Move</span>
        </Item>,
        <Item key="download-file" onClick={({ props }) => onHandleClick('download', props.item)}>
          <IconDownload size="tiny" />
          <span className="ml-2 text-xs">Download</span>
        </Item>,
        <Separator key="file-separator" />,
        <Item key="delete-file" onClick={({ props }) => setSelectedItemsToDelete([props.item])}>
          <IconTrash2 size="tiny" stroke="red" />
          <span className="ml-2 text-xs">Delete</span>
        </Item>,
      ]}
    </Menu>
  )
}

export default observer(ItemContextMenu)
