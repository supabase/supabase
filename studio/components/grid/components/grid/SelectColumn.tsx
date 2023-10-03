import * as React from 'react'
import {
  CalculatedColumn,
  RenderCellProps,
  RenderGroupCellProps,
  useRowSelection,
} from 'react-data-grid'
import { Button, IconMaximize2 } from 'ui'

import { SELECT_COLUMN_KEY } from '../../constants'
import { useTrackedState } from '../../store'
import { SupaRow } from '../../types'
import { useFocusRef } from '../../utils'

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
  // rowGroup: false,
  renderHeaderCell: (props) => {
    return (
      <SelectCellHeader
        aria-label="Select All"
        // [Next 18 refactor] Need to fix
        value={false}
        onChange={() => {}}
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
        tabIndex={-1}
        // [Next 18 refactor] Need to fix
        isCellSelected={false}
        // isCellSelected={props.isCellSelected}
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
        tabIndex={-1}
        // [Next 18 refactor] Need to fix
        isCellSelected={false}
        // isCellSelected={props.isCellSelected}
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

function stopPropagation(event: React.SyntheticEvent) {
  event.stopPropagation()
}

type SharedInputProps = Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  'disabled' | 'tabIndex' | 'onClick' | 'aria-label' | 'aria-labelledby'
>

interface SelectCellFormatterProps extends SharedInputProps {
  isCellSelected: boolean
  value: boolean
  row?: SupaRow
  onChange: (value: boolean, isShiftClick: boolean) => void
}

function SelectCellFormatter({
  row,
  value,
  tabIndex,
  isCellSelected,
  disabled,
  onClick,
  onChange,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectCellFormatterProps) {
  const state = useTrackedState()
  const { onEditRow } = state
  const inputRef = useFocusRef<HTMLInputElement>(isCellSelected)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked, (e.nativeEvent as MouseEvent).shiftKey)
  }

  function onEditClick(e: React.MouseEvent) {
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
        ref={inputRef}
        type="checkbox"
        className="rdg-row__select-column__select-action"
        disabled={disabled}
        checked={value}
        onChange={handleChange}
        onClick={onClick}
      />
      {onEditRow && row && (
        <Button
          type="text"
          size="tiny"
          className="rdg-row__select-column__edit-action"
          icon={<IconMaximize2 size="tiny" />}
          onClick={onEditClick}
          style={{ padding: '3px' }}
        />
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
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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
