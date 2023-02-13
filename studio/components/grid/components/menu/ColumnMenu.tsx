import { CalculatedColumn } from '@supabase/react-data-grid'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  Button,
  Dropdown,
  IconChevronDown,
  Divider,
  IconEdit,
  IconTrash,
  IconLock,
  IconUnlock,
} from 'ui'
import * as React from 'react'
import { useDispatch, useTrackedState } from '../../store'

type ColumnMenuProps = {
  column: CalculatedColumn<any, unknown>
  isEncrypted?: boolean
}

const ColumnMenu: React.FC<ColumnMenuProps> = ({ column, isEncrypted }) => {
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
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger className={`w-full ${isEncrypted ? 'opacity-50' : ''}`}>
              <Dropdown.Item
                onClick={onEditColumn}
                disabled={isEncrypted}
                icon={<IconEdit size="tiny" />}
              >
                Edit column
              </Dropdown.Item>
            </Tooltip.Trigger>
            {isEncrypted && (
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200',
                  ].join(' ')}
                >
                  <span className="text-xs text-scale-1200">
                    Encrypted columns cannot be edited
                  </span>
                </div>
              </Tooltip.Content>
            )}
          </Tooltip.Root>
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
