import React, { FC } from 'react'
import { Button, IconList, IconChevronDown, Popover } from '@supabase/ui'

import { useUrlState } from 'hooks'
import SortRow from './SortRow'
import { useTrackedState } from 'components/grid/store'
import { DropdownControl } from 'components/grid/components/common'
import { formatSortURLParams } from 'components/grid/SupabaseGrid.utils'

const SortPopover: FC = () => {
  const [{ sort: sorts }]: any = useUrlState({ arrayKeys: ['sort'] })
  const btnText =
    (sorts || []).length > 0
      ? `Sorted by ${sorts.length} rule${sorts.length > 1 ? 's' : ''}`
      : 'Sort'

  return (
    <Popover size="large" align="start" className="sb-grid-sort-popover" overlay={<Sort />}>
      <Button
        as="span"
        type={(sorts || []).length > 0 ? 'link' : 'text'}
        icon={
          <div className="text-scale-1000">
            <IconList strokeWidth={1.5} />
          </div>
        }
      >
        {btnText}
      </Button>
    </Popover>
  )
}
export default SortPopover

const Sort: FC = () => {
  const state = useTrackedState()

  const [{ sort: sorts }, setParams] = useUrlState({ arrayKeys: ['sort'] })
  const formattedSorts = formatSortURLParams(sorts as string[])

  const columns = state?.table?.columns!.filter((x) => {
    const found = formattedSorts.find((y) => y.column == x.name)
    return !found
  })

  const dropdownOptions =
    columns?.map((x) => {
      return { value: x.name, label: x.name }
    }) || []

  function onAddSort(columnName: string | number) {
    setParams((prevParams) => {
      const existingSorts = (prevParams?.sort ?? []) as string[]
      return {
        ...prevParams,
        sort: existingSorts.concat([`${columnName}:asc`]),
      }
    })
  }

  return (
    <div className="space-y-2 py-2">
      {formattedSorts.map((sort, index) => (
        <SortRow key={sort.column} index={index} columnName={sort.column} sort={sort} />
      ))}
      {formattedSorts.length === 0 && (
        <div className="space-y-1 px-3">
          <h5 className="text-scale-1100 text-sm">No sorts applied to this view</h5>
          <p className="text-scale-900 text-xs">Add a column below to sort the view</p>
        </div>
      )}

      <Popover.Seperator />
      <div className="px-3">
        {columns && columns.length > 0 ? (
          <DropdownControl
            options={dropdownOptions}
            onSelect={onAddSort}
            side="bottom"
            align="start"
          >
            <Button
              as="span"
              type="text"
              iconRight={<IconChevronDown />}
              className="sb-grid-dropdown__item-trigger"
            >
              {`Pick ${formattedSorts.length > 1 ? 'another' : 'a'} column to sort by`}
            </Button>
          </DropdownControl>
        ) : (
          <p className="text-scale-1100 text-sm">All columns have been added</p>
        )}
      </div>
    </div>
  )
}
