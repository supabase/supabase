import { CalculatedColumn } from 'react-data-grid'
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
  // rowGroup: false,
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
      <Button block type="text" onClick={onAddColumn!} icon={<IconPlus />} />
    </div>
  )
}
