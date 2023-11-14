import * as Tooltip from '@radix-ui/react-tooltip'
import { CalculatedColumn } from 'react-data-grid'
import {
  Button,
  Divider,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
              <DropdownMenuItem className="space-x-2" onClick={onEditColumn} disabled={isEncrypted}>
                <IconEdit size="tiny" />
                <p>Edit column</p>
              </DropdownMenuItem>
            </Tooltip.Trigger>
            {isEncrypted && (
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                      'border border-background',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      Encrypted columns cannot be edited
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            )}
          </Tooltip.Root>
        )}
        <DropdownMenuItem
          className="space-x-2"
          onClick={column.frozen ? onUnfreezeColumn : onFreezeColumn}
        >
          {column.frozen ? (
            <>
              <IconUnlock size="tiny" />
              <p>Unfreeze column</p>
            </>
          ) : (
            <>
              <IconLock size="tiny" />
              <p>Freeze column</p>
            </>
          )}
        </DropdownMenuItem>
        {state.editable && onDeleteColumn !== undefined && (
          <>
            <Divider light />
            <DropdownMenuItem className="space-x-2" onClick={onDeleteColumn}>
              <IconTrash size="tiny" stroke="red" />
              <p>Delete column</p>
            </DropdownMenuItem>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            asChild
            className="opacity-50 flex"
            type="text"
            icon={<IconChevronDown />}
            style={{ padding: '3px' }}
          >
            <span></span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          {renderMenu()}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export default ColumnMenu
