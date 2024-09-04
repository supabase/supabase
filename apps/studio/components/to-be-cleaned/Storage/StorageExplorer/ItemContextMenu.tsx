import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronRight, Clipboard, Download, Edit, Move, Trash2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { Item, Menu, Separator, Submenu } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'

import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { URL_EXPIRY_DURATION } from '../Storage.constants'
import { StorageItemWithColumn } from '../Storage.types'
import { useCopyUrl } from './useCopyUrl'

interface ItemContextMenuProps {
  id: string
}

const ItemContextMenu = ({ id = '' }: ItemContextMenuProps) => {
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
  const { onCopyUrl } = useCopyUrl(storageExplorerStore.projectRef)
  const isPublic = selectedBucket.public
  const canUpdateFiles = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const onHandleClick = async (event: any, item: StorageItemWithColumn, expiresIn?: number) => {
    if (item.isCorrupted) return
    switch (event) {
      case 'copy':
        if (expiresIn !== undefined && expiresIn < 0) return setSelectedFileCustomExpiry(item)
        else return onCopyUrl(item.name, getFileUrl(item, expiresIn))
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
          <Clipboard size="14" strokeWidth={1} />
          <span className="ml-2 text-xs">Get URL</span>
        </Item>
      ) : (
        <Submenu
          label={
            <div className="flex items-center space-x-2">
              <Clipboard size="14" />
              <span className="text-xs">Get URL</span>
            </div>
          }
          arrow={<ChevronRight size="14" strokeWidth={1} />}
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
          <Edit size="14" strokeWidth={1} />
          <span className="ml-2 text-xs">Rename</span>
        </Item>,
        <Item key="move-file" onClick={({ props }) => onHandleClick('move', props.item)}>
          <Move size="14" strokeWidth={1} />
          <span className="ml-2 text-xs">Move</span>
        </Item>,
        <Item key="download-file" onClick={({ props }) => onHandleClick('download', props.item)}>
          <Download size="14" strokeWidth={1} />
          <span className="ml-2 text-xs">Download</span>
        </Item>,
        <Separator key="file-separator" />,
        <Item key="delete-file" onClick={({ props }) => setSelectedItemsToDelete([props.item])}>
          <Trash2 size="14" strokeWidth={1} stroke="red" />
          <span className="ml-2 text-xs">Delete</span>
        </Item>,
      ]}
    </Menu>
  )
}

export default observer(ItemContextMenu)
