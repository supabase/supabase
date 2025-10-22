import { useDebounce } from '@uidotdev/usehooks'
import { Search, X } from 'lucide-react'
import { parseAsString, useQueryStates } from 'nuqs'
import { ChangeEvent, ReactNode, useEffect, useState } from 'react'

import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { useQueryPerformanceSort } from './hooks/useQueryPerformanceSort'

export const QueryPerformanceFilterBar = ({ actions }: { actions?: ReactNode }) => {
  const { sort, clearSort } = useQueryPerformanceSort()

  const [{ search: searchQuery }, setSearchParams] = useQueryStates({
    search: parseAsString.withDefault(''),
  })

  const [inputValue, setInputValue] = useState(searchQuery)
  const debouncedInputValue = useDebounce(inputValue, 500)
  const searchValue = inputValue.length === 0 ? inputValue : debouncedInputValue

  const onSearchQueryChange = (value: string) => {
    setSearchParams({ search: value || '' })
  }

  useEffect(() => {
    onSearchQueryChange(searchValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  return (
    <div className="px-4 py-1.5 bg-surface-200 border-t -mt-px flex justify-between items-center overflow-x-auto overflow-y-hidden w-full flex-shrink-0">
      <div className="flex items-center gap-x-4">
        <div className="flex items-center gap-x-2">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
            value={inputValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            name="keyword"
            id="keyword"
            placeholder="Filter by query"
            className="w-56"
            actions={[
              inputValue && (
                <Button
                  size="tiny"
                  type="text"
                  icon={<X />}
                  onClick={() => setInputValue('')}
                  className="p-0 h-5 w-5"
                />
              ),
            ]}
          />

          {sort && (
            <div className="text-xs border rounded-md px-1.5 md:px-2.5 py-1 h-[26px] flex items-center gap-x-2">
              <p className="md:inline-flex gap-x-1 hidden truncate">
                Sort: {sort.column} <span className="text-foreground-lighter">{sort.order}</span>
              </p>
              <Tooltip>
                <TooltipTrigger onClick={clearSort}>
                  <X size={14} className="text-foreground-light hover:text-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom">Clear sort</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 items-center pl-2">{actions}</div>
    </div>
  )
}
