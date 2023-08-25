import * as Tooltip from '@radix-ui/react-tooltip'
import { CalculatedColumn } from '@supabase/react-data-grid'
import {
  Button,
  Divider,
  Dropdown,
  IconChevronDown,
  IconEdit,
  IconLock,
  IconTrash,
  IconUnlock,
} from 'ui'

import { useDispatch, useTrackedState } from '../../store'

interface ColumnMenuProps {
  column: CalculatedColumn<any, unknown>
  isEncrypted?: boolean
}

const ColumnMenu = ({ column, isEncrypted }: ColumnMenuProps) => {
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
            <Tooltip.Trigger asChild className={`${isEncrypted ? 'opacity-50' : ''}`}>
              <Dropdown.Item
                onClick={onEditColumn}
                disabled={isEncrypted}
                icon={<IconEdit size="tiny" />}
              >
                Edit column
              </Dropdown.Item>
            </Tooltip.Trigger>
            {isEncrypted && (
              <Tooltip.Portal>
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
              </Tooltip.Portal>
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
              Delete column
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
          asChild
          className="opacity-50"
          type="text"
          icon={<IconChevronDown />}
          style={{ padding: '3px' }}
        >
          <span></span>
        </Button>
      </Dropdown>
    </>
  )
}
export default ColumnMenu
