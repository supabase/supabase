import { useDebounce } from '@uidotdev/usehooks'
import { Search, X } from 'lucide-react'
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { ChangeEvent, ReactNode, useEffect, useState } from 'react'

import { FilterPopover } from 'components/ui/FilterPopover'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { useQueryPerformanceSort } from './hooks/useQueryPerformanceSort'

export const QueryPerformanceFilterBar = ({
  actions,
  showRolesFilter = false,
}: {
  actions?: ReactNode
  showRolesFilter?: boolean
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { sort, clearSort } = useQueryPerformanceSort()

  const [{ search: searchQuery, roles: defaultFilterRoles, minCalls }, setSearchParams] =
    useQueryStates({
      search: parseAsString.withDefault(''),
      roles: parseAsArrayOf(parseAsString).withDefault([]),
      minCalls: parseAsInteger,
    })
  const { data, isLoading: isLoadingRoles } = useDatabaseRolesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const roles = (data ?? []).sort((a, b) => a.name.localeCompare(b.name))

  const [filters, setFilters] = useState<{ roles: string[] }>({
    roles: defaultFilterRoles,
  })
  const [inputValue, setInputValue] = useState(searchQuery)
  const [minCallsInput, setMinCallsInput] = useState(
    typeof minCalls === 'number' && Number.isFinite(minCalls) && minCalls >= 0
      ? String(minCalls)
      : ''
  )
  const debouncedInputValue = useDebounce(inputValue, 500)
  const debouncedMinCalls = useDebounce(minCallsInput, 300)
  const searchValue = inputValue.length === 0 ? inputValue : debouncedInputValue

  const onSearchQueryChange = (value: string) => {
    const sanitizedMinCalls =
      typeof minCalls === 'number' && Number.isFinite(minCalls) && minCalls >= 0
        ? Math.floor(minCalls)
        : undefined
    setSearchParams({ search: value || '', minCalls: sanitizedMinCalls })
  }

  const onFilterRolesChange = (roles: string[]) => {
    setFilters({ ...filters, roles })
    const sanitizedMinCalls =
      typeof minCalls === 'number' && Number.isFinite(minCalls) && minCalls >= 0
        ? Math.floor(minCalls)
        : undefined
    setSearchParams({ roles, minCalls: sanitizedMinCalls })
  }

  useEffect(() => {
    onSearchQueryChange(searchValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  useEffect(() => {
    const value = debouncedMinCalls.trim()
    if (value === '') {
      setSearchParams({ minCalls: undefined })
      return
    }
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) {
      setSearchParams({ minCalls: Math.floor(parsed) })
    } else {
      setSearchParams({ minCalls: undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMinCalls])

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

          <Input
            size="tiny"
            type="number"
            autoComplete="off"
            value={minCallsInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setMinCallsInput(e.target.value)}
            name="minCalls"
            id="minCalls"
            min={0}
            placeholder="Min. calls (e.g. 100)"
            className="w-32"
            actions={[
              minCallsInput && (
                <Button
                  size="tiny"
                  type="text"
                  icon={<X />}
                  onClick={() => setMinCallsInput('')}
                  className="p-0 h-5 w-5"
                />
              ),
            ]}
          />

          {showRolesFilter && (
            <FilterPopover
              name="Roles"
              options={roles}
              labelKey="name"
              valueKey="name"
              activeOptions={isLoadingRoles ? [] : filters.roles}
              onSaveFilters={onFilterRolesChange}
              className="w-56"
            />
          )}

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
