import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronRight, Copy, Download, Edit, Move, Trash2 } from 'lucide-react'
import { Item, ItemParams, Menu, Separator, Submenu } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { URL_EXPIRY_DURATION } from '../Storage.constants'
import { StorageItemWithColumn } from '../Storage.types'
import { useCopyUrl } from './useCopyUrl'

interface ItemContextMenuProps {
  id: string
}

export const ItemContextMenu = ({ id = '' }: ItemContextMenuProps) => {
  const snap = useStorageExplorerStateSnapshot()
  const { setSelectedFileCustomExpiry } = snap

  const {
    selectedBucket,
    setSelectedItemsToDelete,
    setSelectedItemToRename,
    setSelectedItemsToMove,
    downloadFile,
  } = useStorageExplorerStateSnapshot()
  const { onCopyUrl } = useCopyUrl()
  const isPublic = selectedBucket.public
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const onHandleClick = async (event: any, item: StorageItemWithColumn, expiresIn?: number) => {
    if (!item) {
      toast.error('Unable to perform action. Please try again.')
      console.error('ItemContextMenu: Action failed - missing item', { event, expiresIn })
      return
    }
    if (item.isCorrupted) return
    switch (event) {
      case 'copy':
        if (expiresIn !== undefined && expiresIn < 0) return setSelectedFileCustomExpiry(item)
        else return onCopyUrl(item.name, expiresIn)
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

  const handleDelete = (args: ItemParams) => {
    if (!args.props?.item) {
      toast.error('Unable to delete file. Please try again.')
      console.error('ItemContextMenu: Delete failed - missing item in props', args.props)
      return
    }
    setSelectedItemsToDelete([args.props.item])
  }

  return (
    <Menu id={id} animation="fade">
      {isPublic ? (
        <Item onClick={({ props }) => onHandleClick('copy', props?.item)}>
          <Copy size={14} />
          <span className="ml-2 text-xs">Get URL</span>
        </Item>
      ) : (
        <Submenu
          label={
            <div className="flex items-center space-x-2">
              <Copy size={14} />
              <span className="text-xs">Get URL</span>
            </div>
          }
          arrow={<ChevronRight size={14} />}
        >
          <Item
            onClick={({ props }) => onHandleClick('copy', props?.item, URL_EXPIRY_DURATION.WEEK)}
          >
            <span className="ml-2 text-xs">Expire in 1 week</span>
          </Item>
          <Item
            onClick={({ props }) => onHandleClick('copy', props?.item, URL_EXPIRY_DURATION.MONTH)}
          >
            <span className="ml-2 text-xs">Expire in 1 month</span>
          </Item>
          <Item
            onClick={({ props }) => onHandleClick('copy', props?.item, URL_EXPIRY_DURATION.YEAR)}
          >
            <span className="ml-2 text-xs">Expire in 1 year</span>
          </Item>
          <Item onClick={({ props }) => onHandleClick('copy', props?.item, -1)}>
            <span className="ml-2 text-xs">Custom expiry</span>
          </Item>
        </Submenu>
      )}
      {canUpdateFiles && [
        <Item key="rename-file" onClick={({ props }) => onHandleClick('rename', props?.item)}>
          <Edit size={14} strokeWidth={1} />
          <span className="ml-2 text-xs">Rename</span>
        </Item>,
        <Item key="move-file" onClick={({ props }) => onHandleClick('move', props?.item)}>
          <Move size={14} strokeWidth={1} />
          <span className="ml-2 text-xs">Move</span>
        </Item>,
        <Item key="download-file" onClick={({ props }) => onHandleClick('download', props?.item)}>
          <Download size={14} strokeWidth={1} />
          <span className="ml-2 text-xs">Download</span>
        </Item>,
        <Separator key="file-separator" />,
        <Item key="delete-file" onClick={handleDelete}>
          <Trash2 size={14} strokeWidth={1} stroke="red" />
          <span className="ml-2 text-xs">Delete</span>
        </Item>,
      ]}
    </Menu>
  )
}
