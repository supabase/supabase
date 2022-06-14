import { FC } from 'react'
import { Button, IconPlus, IconFilter, Popover } from '@supabase/ui'
import { uuidv4 } from 'lib/helpers'
import { useDispatch, useTrackedState } from '../../../store'
import FilterRow from './FilterRow'

const FilterPopover: FC = () => {
  const state = useTrackedState()
  const btnText =
    state.filters.length > 0
      ? `Filtered by ${state.filters.length} rule${state.filters.length > 1 ? 's' : ''}`
      : 'Filter'

  return (
    <Popover size="large" align="start" className="sb-grid-filter-popover" overlay={<Filter />}>
      <Button
        as={'span'}
        type="text"
        icon={
          <div className="text-scale-900">
            <IconFilter strokeWidth={1.5} />
          </div>
        }
      >
        {btnText}
      </Button>
    </Popover>
  )
}
export default FilterPopover

const Filter: FC = () => {
  const state = useTrackedState()
  const dispatch = useDispatch()

  function onAddFilter() {
    dispatch({
      type: 'ADD_FILTER',
      payload: {
        id: uuidv4(),
        column: state.table?.columns[0].name,
        operator: '=',
        value: '',
      },
    })
  }

  return (
    <div className="space-y-2 py-2">
      <div className="space-y-2">
        {state.filters.map((filter, index) => (
          <FilterRow key={`filter-${filter.id}`} filterIdx={index} now={Date.now()} />
        ))}
        {state.filters.length == 0 && (
          <div className="space-y-1 px-3">
            <h5 className="text-scale-1100 text-sm">No filters applied to this view</h5>
            <p className="text-scale-900 text-xs">Add a column below to filter the view</p>
          </div>
        )}
      </div>
      <Popover.Seperator />
      <div className="px-3">
        <Button icon={<IconPlus />} type="text" onClick={onAddFilter}>
          Add filter
        </Button>
      </div>
    </div>
  )
}
