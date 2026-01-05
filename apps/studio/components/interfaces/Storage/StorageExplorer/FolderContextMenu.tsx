import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Copy, Download, Edit, Trash2 } from 'lucide-react'
import { Item, ItemParams, Menu, Separator } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'
import { toast } from 'sonner'

import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { copyPathToFolder } from './StorageExplorer.utils'

interface FolderContextMenuProps {
  id: string
}

export const FolderContextMenu = ({ id = '' }: FolderContextMenuProps) => {
  const { openedFolders, downloadFolder, setSelectedItemToRename, setSelectedItemsToDelete } =
    useStorageExplorerStateSnapshot()
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const handleRename = (args: ItemParams) => {
    if (!args.props?.item) {
      toast.error('Unable to rename folder. Please try again.')
      console.error('FolderContextMenu: Rename failed - missing item in props', args.props)
      return
    }
    setSelectedItemToRename(args.props.item)
  }

  const handleDownload = (args: ItemParams) => {
    if (!args.props?.item) {
      toast.error('Unable to download folder. Please try again.')
      console.error('FolderContextMenu: Download failed - missing item in props', args.props)
      return
    }
    downloadFolder(args.props.item)
  }

  const handleCopyPath = (args: ItemParams) => {
    if (!args.props?.item) {
      toast.error('Unable to copy path. Please try again.')
      console.error('FolderContextMenu: Copy path failed - missing item in props', args.props)
      return
    }
    copyPathToFolder(openedFolders, args.props.item)
  }

  const handleDelete = (args: ItemParams) => {
    if (!args.props?.item) {
      toast.error('Unable to delete folder. Please try again.')
      console.error('FolderContextMenu: Delete failed - missing item in props', args.props)
      return
    }
    setSelectedItemsToDelete([args.props.item])
  }

  return (
    <Menu id={id} animation="fade">
      {canUpdateFiles && (
        <Item onClick={handleRename}>
          <Edit size={12} />
          <span className="ml-2 text-xs">Rename</span>
        </Item>
      )}
      <Item onClick={handleDownload}>
        <Download size={12} />
        <span className="ml-2 text-xs">Download</span>
      </Item>
      <Item onClick={handleCopyPath}>
        <Copy size={12} />
        <span className="ml-2 text-xs">Copy path to folder</span>
      </Item>
      {canUpdateFiles && [
        <Separator key="separator" />,
        <Item key="delete" onClick={handleDelete}>
          <Trash2 size={12} />
          <span className="ml-2 text-xs">Delete</span>
        </Item>,
      ]}
    </Menu>
  )
}
