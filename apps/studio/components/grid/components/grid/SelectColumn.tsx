import { Maximize2 } from 'lucide-react'
import { ChangeEvent, InputHTMLAttributes, SyntheticEvent, useEffect, useRef } from 'react'
import {
  CalculatedColumn,
  RenderCellProps,
  RenderGroupCellProps,
  RenderHeaderCellProps,
  useHeaderRowSelection,
  useRowSelection,
} from 'react-data-grid'

import { SELECT_COLUMN_KEY } from '../../constants'
import type { SupaRow } from '../../types'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

export const SelectColumn: CalculatedColumn<any, any> = {
  key: SELECT_COLUMN_KEY,
  name: '',
  idx: 0,
  width: 65,
  maxWidth: 65,
  resizable: false,
  sortable: false,
  frozen: true,
  renderHeaderCell: (props: RenderHeaderCellProps<unknown>) => {
    // [Joshen] formatter is actually a valid React component, so we can use hooks here
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isRowSelected, onRowSelectionChange } = useHeaderRowSelection()

    return (
      <SelectCellHeader
        aria-label="Select All"
        tabIndex={props.tabIndex}
        value={isRowSelected}
        onChange={(checked) => onRowSelectionChange({ checked })}
      />
    )
  },
  renderCell: (props: RenderCellProps<SupaRow>) => {
    // [Alaister] formatter is actually a valid React component, so we can use hooks here
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isRowSelected, onRowSelectionChange } = useRowSelection()
    return (
      <SelectCellFormatter
        aria-label="Select"
        tabIndex={props.tabIndex}
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
  renderGroupCell: (props: RenderGroupCellProps<SupaRow>) => {
    // [Alaister] groupFormatter is actually a valid React component, so we can use hooks here
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isRowSelected, onRowSelectionChange } = useRowSelection()
    return (
      <SelectCellFormatter
        aria-label="Select Group"
        tabIndex={props.tabIndex}
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
  const snap = useTableEditorStateSnapshot()

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked, (e.nativeEvent as MouseEvent).shiftKey)
  }

  function onEditClick(e: any) {
    e.stopPropagation()
    if (row) {
      snap.onEditRow(row)
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
      {row && (
        <ButtonTooltip
          type="text"
          size="tiny"
          className="px-1 rdg-row__select-column__edit-action"
          icon={<Maximize2 />}
          onClick={onEditClick}
          tooltip={{
            content: {
              side: 'bottom',
              text: 'Expand row',
            },
          }}
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
  const snap = useTableEditorTableStateSnapshot()
  const inputRef = useRef<HTMLInputElement>(null)

  // indeterminate state === some rows are selected but not all
  const isIndeterminate = snap.selectedRows.size > 0 && !snap.allRowsSelected

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.checked, (e.nativeEvent as MouseEvent).shiftKey)
  }

  return (
    <div className="sb-grid-select-cell__header">
      <input
        ref={inputRef}
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
