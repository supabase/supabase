import type { CalculatedColumn } from 'react-data-grid'
import { Button } from 'ui'

import { Plus } from 'lucide-react'
import { ADD_COLUMN_KEY } from '../../constants'
import { useTrackedState } from '../../store/Store'
import { DefaultFormatter } from '../formatter/DefaultFormatter'

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
  renderHeaderCell() {
    return <AddColumnHeader aria-label="Add New Row" />
  },
  renderCell: DefaultFormatter,

  // [Next 18 Refactor] Double check if this is correct
  parent: undefined,
  level: 0,
  minWidth: 0,
  draggable: false,
}

type SharedInputProps = Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  'disabled' | 'tabIndex' | 'onClick' | 'aria-label' | 'aria-labelledby'
>

const AddColumnHeader = ({}: SharedInputProps) => {
  const state = useTrackedState()
  const { onAddColumn } = state
  return (
    <div className="sb-grid-add-column">
      <Button block type="text" onClick={onAddColumn!} icon={<Plus />} />
    </div>
  )
}
