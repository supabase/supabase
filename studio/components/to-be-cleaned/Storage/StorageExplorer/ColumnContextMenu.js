import { Menu, Item, Separator, Submenu } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'

import { STORAGE_VIEWS, STORAGE_SORT_BY, STORAGE_SORT_BY_ORDER } from '../Storage.constants'

const ColumnContextMenu = ({
  id = '',
  onCreateNewFolder = () => {},
  onSelectAllItems = () => {},
  onSelectView = () => {},
  onSelectSort = () => {},
  onSelectSortByOrder = () => {},
}) => {
  return (
    <Menu id={id} animation="fade">
      <Item
        onClick={({ props }) => {
          onCreateNewFolder(props.index)
        }}
      >
        New folder
      </Item>
      <Separator />
      <Item
        onClick={({ props }) => {
          onSelectAllItems(props.index)
        }}
      >
        Select all items
      </Item>
      <Submenu label="View">
        <Item onClick={() => onSelectView(STORAGE_VIEWS.COLUMNS)}>As columns</Item>
        <Item onClick={() => onSelectView(STORAGE_VIEWS.LIST)}>As list</Item>
      </Submenu>
      <Submenu label="Sort by">
        <Item onClick={() => onSelectSort(STORAGE_SORT_BY.NAME)}>Name</Item>
        <Item onClick={() => onSelectSort(STORAGE_SORT_BY.CREATED_AT)}>Last created</Item>
        <Item onClick={() => onSelectSort(STORAGE_SORT_BY.UPDATED_AT)}>Last modified</Item>
        <Item onClick={() => onSelectSort(STORAGE_SORT_BY.LAST_ACCESSED_AT)}>Last accessed</Item>
      </Submenu>
      <Submenu label="Sort by order">
        <Item onClick={() => onSelectSortByOrder(STORAGE_SORT_BY_ORDER.ASC)}>Ascending</Item>
        <Item onClick={() => onSelectSortByOrder(STORAGE_SORT_BY_ORDER.DESC)}>Descending</Item>
      </Submenu>
    </Menu>
  )
}

export default ColumnContextMenu
