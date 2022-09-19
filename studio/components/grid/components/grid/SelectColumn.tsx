import * as React from 'react'
import {
  CalculatedColumn,
  FormatterProps,
  GroupFormatterProps,
  useRowSelection,
} from '@supabase/react-data-grid'
import { Button, IconMaximize2 } from 'ui'
import { SupaRow } from '../../types'
import { SELECT_COLUMN_KEY } from '../../constants'
import { useFocusRef } from '../../utils'
import { useTrackedState } from '../../store'

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
  rowGroup: false,
  headerRenderer: (props) => {
    return (
      <SelectCellHeader
        aria-label="Select All"
        value={props.allRowsSelected}
        onChange={props.onAllRowsSelectionChange}
      />
    )
  },
  formatter: (props: FormatterProps<SupaRow>) => {
    const [isRowSelected, onRowSelectionChange] = useRowSelection()
    return (
      <SelectCellFormatter
        aria-label="Select"
        tabIndex={-1}
        isCellSelected={props.isCellSelected}
        value={isRowSelected}
        row={props.row}
        onChange={(checked, isShiftClick) => {
          onRowSelectionChange({ row: props.row, checked, isShiftClick })
        }}
        // Stop propagation to prevent row selection
        onClick={stopPropagation}
      />
    )
  },
  groupFormatter: (props: GroupFormatterProps<SupaRow>) => {
    const [isRowSelected, onRowSelectionChange] = useRowSelection()
    return (
      <SelectCellFormatter
        aria-label="Select Group"
        tabIndex={-1}
        isCellSelected={props.isCellSelected}
        value={isRowSelected}
        onChange={(checked) => {
          onRowSelectionChange({
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
