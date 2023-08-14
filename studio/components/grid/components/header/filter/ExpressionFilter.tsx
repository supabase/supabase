import { useUrlState } from 'hooks'
import { useMemo, useState } from 'react'
import { Button, Input } from 'ui'
import { formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import { FilterOperatorOptions } from './Filter.constants'
import { isEqual } from 'lodash'
import * as Tooltip from '@radix-ui/react-tooltip'

function convertToSingleSpace(input: string) {
  // Replace multiple spaces with a single space
  return input.replace(/\s+/g, ' ')
}

function isValidSearch(searchText: string) {
  return searchText
}

function parseFilterFromText(textFilter: string) {
  // Convert "id = 3" into [id, =, 3] or "name is not null" to [name, is, not null]
  const textFilters = textFilter.trim().split(' ')
  if (textFilters.length < 3) return '' // Filter is incomplete, return no filter
  const column = textFilters[0]
  let operator = textFilters[1]
  if (operator === '!=') operator = '<>' // Autocorrection - Users will often write != instead of <> accidentally
  const value = textFilter.split(operator)[1].trim()

  const selectedOperator = FilterOperatorOptions.find(
    (option) => option.value === operator || option.abbrev === operator
  )
  if (!selectedOperator) return '' // Operator is invalid, return no filter
  return `${column}:${selectedOperator.abbrev}:${value}`
}

export function ExpressionFilter() {
  const [{ filter: filtersFromUrl }, setParams] = useUrlState({
    arrayKeys: ['sort', 'filter'],
  })

  const textFilter = useMemo(
    () =>
      formatFilterURLParams((filtersFromUrl as string[]) ?? [])
        .map((filter) => `${filter.column} ${filter.operator} ${filter.value}`)
        .join(' AND '),
    [filtersFromUrl]
  )

  function onApplyFilter(searchText: string) {
    setParams((prevParams) => {
      return {
        ...prevParams,
        filter: isValidSearch(searchText)
          ? searchText.split(' AND ').map((textFilter) => parseFilterFromText(textFilter))
          : [],
      }
    })
  }

  return <ExpressionInput key={textFilter} onApplyFilter={onApplyFilter} textFilter={textFilter} />
}

function ExpressionInput({
  onApplyFilter,
  textFilter,
}: {
  onApplyFilter: (searchText: string) => void
  textFilter: string
}) {
  const [searchText, setSearchText] = useState<string>(textFilter)

  return (
    <div className="flex gap-1 mr-5">
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger className="w-full">
          <Input
            size="tiny"
            type="search"
            className="w-full"
            placeholder={`Enter an SQL expression to filter results, e.g. price > 100 AND location like %Avenue%`}
            value={searchText}
            onChange={(event) =>
              setSearchText(
                // Trim excessive whitespaces into a single one, and capitalize AND keyword
                convertToSingleSpace(event.target.value.replace(/(?<=\s)and(?=\s)/gi, 'AND'))
              )
            }
          />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="bottom" align="start">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                'border border-scale-200',
              ].join(' ')}
            >
              <div className="text-xs text-scale-1200">
                You can use any operator listed in the Filter dropdown above.
              </div>
              <span className="text-xs text-scale-1200 italic">
                Note: Multiple filters can be chained with the AND operator. We don't support OR
                yet.
              </span>
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Button
        disabled={isEqual(textFilter, searchText)}
        type="default"
        onClick={() => onApplyFilter(searchText)}
      >
        Apply filter
      </Button>
    </div>
  )
}
