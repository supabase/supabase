import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { Menu, Item, Separator } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'
import { IconEdit, IconDownload, IconTrash2 } from 'ui'

const FolderContextMenu = ({ id = '', onRenameFolder = () => {}, onDeleteFolder = () => {} }) => {
  const storageExplorerStore = useStorageStore()
  const { downloadFolder } = storageExplorerStore

  return (
    <Menu id={id} animation="fade" className="!bg-scale-300 border border-scale-500">
      <Item onClick={({ props }) => onRenameFolder(props.item)}>
        <IconEdit size="tiny" />
        <span className="ml-2 text-xs">Rename</span>
      </Item>
      <Item onClick={({ props }) => downloadFolder(props.item)}>
        <IconDownload size="tiny" />
        <span className="ml-2 text-xs">Download</span>
      </Item>
      <Separator />
      <Item onClick={({ props }) => onDeleteFolder(props.item)}>
        <IconTrash2 size="tiny" />
        <span className="ml-2 text-xs">Delete</span>
      </Item>
    </Menu>
  )
}

export default FolderContextMenu
