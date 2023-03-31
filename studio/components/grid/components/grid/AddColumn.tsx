import * as React from 'react'
import { CalculatedColumn } from '@supabase/react-data-grid'
import { Button, IconPlus } from 'ui'
import { ADD_COLUMN_KEY } from '../../constants'
import { useTrackedState } from '../../store'
import { DefaultFormatter } from '../formatter'

export const AddColumn: CalculatedColumn<any, any> = {
  key: ADD_COLUMN_KEY,
  name: '',
  idx: 999,
  width: 100,
  maxWidth: 100,
  resizable: false,
  sortable: false,
  frozen: false,
  isLastFrozenColumn: false,
  rowGroup: false,
  headerRenderer(props) {
    return (
      <AddColumnHeader
        aria-label="Add New Row"
        value={props.allRowsSelected}
        onChange={props.onAllRowsSelectionChange}
      />
    )
  },
  formatter: DefaultFormatter,
}

type SharedInputProps = Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  'disabled' | 'tabIndex' | 'onClick' | 'aria-label' | 'aria-labelledby'
>

interface AddColumnHeaderProps extends SharedInputProps {
  value: boolean
  onChange: (value: boolean, isShiftClick: boolean) => void
}

const AddColumnHeader: React.FC<AddColumnHeaderProps> = () => {
  const state = useTrackedState()
  const { onAddColumn } = state
  return (
    <div className="sb-grid-add-column">
      <Button block type="text" onClick={onAddColumn!} icon={<IconPlus />} />
    </div>
  )
}
