import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import { Menu, Item } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'

const FolderContextMenu = ({ id = '', onRenameFolder = () => {}, onDeleteFolder = () => {} }) => {
  const storageExplorerStore = useStorageStore()
  const { downloadFolder } = storageExplorerStore

  return (
    <Menu id={id} animation="fade">
      <Item onClick={({ props }) => onRenameFolder(props.item)}>Rename</Item>
      <Item onClick={({ props }) => downloadFolder(props.item)}>Download</Item>
      <Item onClick={({ props }) => onDeleteFolder(props.item)}>Delete</Item>
    </Menu>
  )
}

export default FolderContextMenu
