import * as Tooltip from '@radix-ui/react-tooltip'
import {
  CalculatedColumn,
  RenderCellProps,
  RenderGroupCellProps,
  RenderHeaderCellProps,
  useRowSelection,
} from 'react-data-grid'
import { Button, IconMaximize2 } from 'ui'

import { ChangeEvent, InputHTMLAttributes, SyntheticEvent } from 'react'
import { SELECT_COLUMN_KEY } from '../../constants'
import { useTrackedState } from '../../store/Store'
import type { SupaRow } from '../../types'

export const SelectColumn: CalculatedColumn<any, any> = {
  key: SELECT_COLUMN_KEY,
  name: '',
  idx: 0,
  width: 65,
  maxWidth: 65,
  resizable: false,
  sortable: false,
  frozen: true,
  isLastFrozenColumn: false,
  renderHeaderCell: (props: RenderHeaderCellProps<unknown>) => {
    // [Joshen] formatter is actually a valid React component, so we can use hooks here
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isRowSelected, onRowSelectionChange] = useRowSelection()

    return (
      <SelectCellHeader
        aria-label="Select All"
        tabIndex={props.tabIndex}
        value={isRowSelected}
        onChange={(checked) => onRowSelectionChange({ type: 'HEADER', checked })}
      />
    )
  },
  renderCell: (props: RenderCellProps<SupaRow>) => {
    // [Alaister] formatter is actually a valid React component, so we can use hooks here
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isRowSelected, onRowSelectionChange] = useRowSelection()
    return (
      <SelectCellFormatter
        aria-label="Select"
        tabIndex={props.tabIndex}
        value={isRowSelected}
        row={props.row}
        onChange={(checked, isShiftClick) => {
          onRowSelectionChange({ type: 'ROW', row: props.row, checked, isShiftClick })
        }}
        // Stop propagation to prevent row selection
        onClick={stopPropagation}
      />
    )
  },
  renderGroupCell: (props: RenderGroupCellProps<SupaRow>) => {
    // [Alaister] groupFormatter is actually a valid React component, so we can use hooks here
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isRowSelected, onRowSelectionChange] = useRowSelection()
    return (
      <SelectCellFormatter
        aria-label="Select Group"
        tabIndex={props.tabIndex}
        value={isRowSelected}
        onChange={(checked) => {
          onRowSelectionChange({
            type: 'ROW',
            row: props.row,
            checked,
            isShiftClick: false,
          })
        }}
        // Stop propagation to prevent row selection
        onClick={stopPropagation}
      />
    )
  },

  // [Next 18 Refactor] Double check if this is correct
  parent: undefined,
  level: 0,
  minWidth: 0,
  draggable: false,
}

function stopPropagation(event: SyntheticEvent) {
  event.stopPropagation()
}

type SharedInputProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  'disabled' | 'tabIndex' | 'onClick' | 'aria-label' | 'aria-labelledby'
>

interface SelectCellFormatterProps extends SharedInputProps {
  value: boolean
  row?: SupaRow
  onChange: (value: boolean, isShiftClick: boolean) => void
}

function SelectCellFormatter({
  row,
  value,
  tabIndex,
  disabled,
  onClick,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectCellFormatterProps) {
  const state = useTrackedState()
  const { onEditRow } = state

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked, (e.nativeEvent as MouseEvent).shiftKey)
  }

  function onEditClick(e: any) {
    e.stopPropagation()
    if (onEditRow && row) {
      onEditRow(row)
    }
  }

  return (
    <div className="sb-grid-select-cell__formatter">
      <input
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={tabIndex}
        type="checkbox"
        className="rdg-row__select-column__select-action"
        disabled={disabled}
        checked={value}
        onChange={handleChange}
        onClick={onClick}
      />
      {onEditRow && row && (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
            <Button
              type="text"
              size="tiny"
              className="rdg-row__select-column__edit-action"
              icon={<IconMaximize2 size="tiny" strokeWidth={1.5} className="text-foreground" />}
              onClick={onEditClick}
              style={{ padding: '3px' }}
            />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                  'border border-background',
                ].join(' ')}
              >
                <span className="text-xs text-foreground">Expand row</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
    </div>
  )
}

interface SelectCellHeaderProps extends SharedInputProps {
  value: boolean
  onChange: (value: boolean, isShiftClick: boolean) => void
}

function SelectCellHeader({
  disabled,
  tabIndex,
  value,
  onChange,
  onClick,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectCellHeaderProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked, (e.nativeEvent as MouseEvent).shiftKey)
  }

  return (
    <div className="sb-grid-select-cell__header">
      <input
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={tabIndex}
        type="checkbox"
        className="sb-grid-select-cell__header__input"
        disabled={disabled}
        checked={value}
        onChange={handleChange}
        onClick={onClick}
      />
    </div>
  )
}
