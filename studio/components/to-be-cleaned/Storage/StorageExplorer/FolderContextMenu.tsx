import { FC } from 'react'
import { Menu, Item, Separator } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'
import { IconEdit, IconDownload, IconTrash2 } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useCheckPermissions } from 'hooks'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'

interface Props {
  id: string
}

const FolderContextMenu: FC<Props> = ({ id = '' }) => {
  const storageExplorerStore = useStorageStore()
  const { downloadFolder, setSelectedItemToRename, setSelectedItemsToDelete } = storageExplorerStore
  const canUpdateFiles = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  return (
    <Menu id={id} animation="fade">
      {canUpdateFiles && (
        <Item onClick={({ props }) => setSelectedItemToRename(props.item)}>
          <IconEdit size="tiny" />
          <span className="ml-2 text-xs">Rename</span>
        </Item>
      )}
      <Item onClick={({ props }) => downloadFolder(props.item)}>
        <IconDownload size="tiny" />
        <span className="ml-2 text-xs">Download</span>
      </Item>
      {canUpdateFiles && [
        <Separator key="separator" />,
        <Item key="delete" onClick={({ props }) => setSelectedItemsToDelete([props.item])}>
          <IconTrash2 size="tiny" stroke="red" />
          <span className="ml-2 text-xs">Delete</span>
        </Item>,
      ]}
    </Menu>
  )
}

export default FolderContextMenu
