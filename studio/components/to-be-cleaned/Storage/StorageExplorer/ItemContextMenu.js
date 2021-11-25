import { Menu, Item } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'

const ItemContextMenu = ({
  id = '',
  onCopyFileURL = () => {},
  onSelectItemRename = () => {},
  onSelectItemMove = () => {},
  onDownloadFile = () => {},
  onSelectItemDelete = () => {},
}) => {
  return (
    <Menu id={id} animation="fade">
      <Item onClick={({ props }) => onCopyFileURL(props.item)}>Copy URL</Item>
      <Item onClick={({ props }) => onSelectItemRename(props.item)}>Rename</Item>
      <Item onClick={({ props }) => onSelectItemMove(props.item)}>Move</Item>
      <Item onClick={({ props }) => onDownloadFile(props.item)}>Download</Item>
      <Item onClick={({ props }) => onSelectItemDelete(props.item)}>Delete</Item>
    </Menu>
  )
}

export default ItemContextMenu
