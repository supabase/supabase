import { Menu, Item, Separator, Submenu } from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'

import { STORAGE_VIEWS, STORAGE_SORT_BY, STORAGE_SORT_BY_ORDER } from '../Storage.constants'
import { IconEye, IconChevronRight, IconFolderPlus, IconClipboard, IconChevronsUp, IconChevronsDown } from 'ui'

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
         <IconFolderPlus size="tiny" />
         <span className="sb-grid-context-menu__label">New folder</span>
      </Item>
      <Separator />
      <Item
        onClick={({ props }) => {
          onSelectAllItems(props.index)
        }}
      >
        <IconClipboard size="tiny" />
        <span className="sb-grid-context-menu__label">Select all items</span>
      </Item>
      <Separator />
      <Submenu label={
          <div className="flex items-center space-x-2">
            <IconEye size="tiny" />
            <span className="text-xs">View</span>
          </div>
        }
        arrow={<IconChevronRight size="tiny" />}
      >
        <Item onClick={() => onSelectView(STORAGE_VIEWS.COLUMNS)}>
          <span className="sb-grid-context-menu__label">As columns</span>
        </Item>
        <Item onClick={() => onSelectView(STORAGE_VIEWS.LIST)}>
          <span className="sb-grid-context-menu__label">As list</span>
        </Item>
      </Submenu>
      <Submenu label={
          <div className="flex items-center space-x-2">
            <IconChevronsDown size="tiny" />
            <span className="text-xs">Sort by</span>
          </div>
        }
        arrow={<IconChevronRight size="tiny" />}
      >
        <Item onClick={() => onSelectSort(STORAGE_SORT_BY.NAME)}>
          <span className="text-xs">Name</span>
        </Item>
        <Item onClick={() => onSelectSort(STORAGE_SORT_BY.CREATED_AT)}>
          <span className="text-xs">Last created</span>
        </Item>
        <Item onClick={() => onSelectSort(STORAGE_SORT_BY.UPDATED_AT)}>
          <span className="text-xs">Last modified</span>
        </Item>
        <Item onClick={() => onSelectSort(STORAGE_SORT_BY.LAST_ACCESSED_AT)}>
          <span className="text-xs">Last accessed</span>
        </Item>
      </Submenu>
      <Submenu label={
          <div className="flex items-center space-x-2">
            <IconChevronsUp size="tiny" />
            <span className="text-xs">Sort by order</span>
          </div>
        }
        arrow={<IconChevronRight size="tiny" />}
      >
        <Item onClick={() => onSelectSortByOrder(STORAGE_SORT_BY_ORDER.ASC)}>
          <span className="text-xs">Ascending</span>
        </Item>
        <Item onClick={() => onSelectSortByOrder(STORAGE_SORT_BY_ORDER.DESC)}>
          <span className="text-xs">Descending</span>
        </Item>
      </Submenu>
    </Menu>
  )
}

export default ColumnContextMenu
