import { FC } from 'react'
import { Button, IconPlus, IconFilter, Popover } from '@supabase/ui'

import { useUrlState } from 'hooks'
import FilterRow from './FilterRow'
import { useTrackedState } from 'components/grid/store'
import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'

const FilterPopover: FC = () => {
  const [{ filter: filters }]: any = useUrlState({ arrayKeys: ['filter'] })
  const btnText =
    (filters || []).length > 0
      ? `Filtered by ${filters.length} rule${filters.length > 1 ? 's' : ''}`
      : 'Filter'

  return (
    <Popover size="large" align="start" className="sb-grid-filter-popover" overlay={<Filter />}>
      <Button
        as="span"
        type={(filters || []).length > 0 ? 'link' : 'text'}
        icon={
          <div className="text-scale-1000">
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

  const [{ filter: filters }, setParams] = useUrlState({ arrayKeys: ['filter'] })
  const formattedFilters = formatFilterURLParams(filters as string[])

  function onAddFilter() {
    setParams((prevParams) => {
      const existingFilters = (prevParams?.filter ?? []) as string[]
      const column = state.table?.columns[0].name
      return {
        ...prevParams,
        filter: existingFilters.concat([`${column}:eq:`]),
      }
    })
  }

  return (
    <div className="space-y-2 py-2">
      <div className="space-y-2">
        {formattedFilters.map((filter, index) => (
          <FilterRow
            key={`filter-${(filters as string[])[index]}-${[index]}`}
            filter={filter}
            filterIdx={index}
          />
        ))}
        {formattedFilters.length == 0 && (
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
