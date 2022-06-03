import { CalculatedColumn } from '@supabase/react-data-grid'
import {
  Button,
  Dropdown,
  IconChevronDown,
  Divider,
  IconEdit,
  IconTrash,
  IconLock,
  IconUnlock,
} from '@supabase/ui'
import * as React from 'react'
import { useDispatch, useTrackedState } from '../../store'

type ColumnMenuProps = {
  column: CalculatedColumn<any, unknown>
}

const ColumnMenu: React.FC<ColumnMenuProps> = ({ column }) => {
  const state = useTrackedState()
  const dispatch = useDispatch()
  const { onEditColumn: onEditColumnFunc, onDeleteColumn: onDeleteColumnFunc } = state

  const columnKey = column.key

  function onFreezeColumn() {
    dispatch({ type: 'FREEZE_COLUMN', payload: { columnKey } })
  }

  function onUnfreezeColumn() {
    dispatch({ type: 'UNFREEZE_COLUMN', payload: { columnKey } })
  }

  function onEditColumn() {
    if (onEditColumnFunc) onEditColumnFunc(columnKey)
  }

  function onDeleteColumn() {
    if (onDeleteColumnFunc) onDeleteColumnFunc(columnKey)
  }

  function renderMenu() {
    return (
      <>
        {state.editable && onEditColumn !== undefined && (
          <Dropdown.Item onClick={onEditColumn} icon={<IconEdit size="tiny" />}>
            Edit column
          </Dropdown.Item>
        )}
        <Dropdown.Item
          onClick={column.frozen ? onUnfreezeColumn : onFreezeColumn}
          icon={column.frozen ? <IconUnlock size="tiny" /> : <IconLock size="tiny" />}
        >
          {column.frozen ? 'Unfreeze column' : 'Freeze column'}
        </Dropdown.Item>
        {state.editable && onDeleteColumn !== undefined && (
          <>
            <Divider light />
            <Dropdown.Item onClick={onDeleteColumn} icon={<IconTrash size="tiny" stroke="red" />}>
              Delete Column
            </Dropdown.Item>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <Dropdown align="end" side="bottom" overlay={renderMenu()}>
        <Button
          as={'span'}
          className="opacity-50"
          type="text"
          icon={<IconChevronDown />}
          style={{ padding: '3px' }}
        />
      </Dropdown>
    </>
  )
}
export default ColumnMenu
