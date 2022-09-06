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
    <Menu id={id} animation="fade" className="!bg-scale-300 border border-scale-500">
      <Item
        onClick={({ props }) => (!props.item.isCorrupted ? onCopyFileURL(props.item) : () => {})}
      >
        <span className="text-xs">Copy URL</span>
      </Item>
      <Item
        onClick={({ props }) =>
          !props.item.isCorrupted ? onSelectItemRename(props.item) : () => {}
        }
      >
        <span className="text-xs">Rename</span>
      </Item>
      <Item
        onClick={({ props }) => (!props.item.isCorrupted ? onSelectItemMove(props.item) : () => {})}
      >
        <span className="text-xs">Move</span>
      </Item>
      <Item
        onClick={({ props }) => (!props.item.isCorrupted ? onDownloadFile(props.item) : () => {})}
      >
        <span className="text-xs">Download</span>
      </Item>
      <Item onClick={({ props }) => onSelectItemDelete(props.item)}>
        <span className="text-xs">Delete</span>
      </Item>
    </Menu>
  )
}

export default ItemContextMenu
