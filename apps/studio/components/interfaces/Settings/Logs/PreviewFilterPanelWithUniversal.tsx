import dayjs from 'dayjs'
import { Eye, EyeOff, RefreshCw, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useParams } from 'common'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { useLoadBalancersQuery } from 'data/read-replicas/load-balancers-query'
import { IS_PLATFORM } from 'lib/constants'
import { Button, Calendar, Tooltip, TooltipContent, TooltipTrigger, cn } from 'ui'
import type {
  CustomOptionProps,
  FilterCondition,
  FilterGroup,
  FilterProperty,
} from 'ui-patterns/FilterBar'
import { FilterBar } from 'ui-patterns/FilterBar'
import { DatePickerValue } from './Logs.DatePickers'
import { FILTER_OPTIONS, LOG_ROUTES_WITH_REPLICA_SUPPORT, LogsTableName } from './Logs.constants'
import type { Filters, LogSearchCallback, LogTemplate } from './Logs.types'

function CustomDateRangePicker({ onChange, onCancel }: CustomOptionProps) {
  const [dateRange, setDateRange] = useState<any | undefined>()

  return (
    <div className="w-full space-y-4">
      <Calendar
        initialFocus
        mode="range"
        defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={setDateRange}
        numberOfMonths={2}
      />
      <div className="flex justify-end gap-2 py-3 px-4 border-t">
        <Button type="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={() => {
            if (dateRange?.from) {
              const from = dayjs(dateRange.from).toISOString()
              const to = dateRange.to ? dayjs(dateRange.to).toISOString() : dayjs().toISOString()
              onChange(`${from}|${to}`)
            }
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  )
}

interface PreviewFilterPanelProps {
  defaultSearchValue?: string
  defaultToValue?: string
  defaultFromValue?: string
  templates?: any
  isLoading: boolean
  newCount: number
  onRefresh?: () => void
  onSearch?: LogSearchCallback
  onExploreClick?: () => void
  queryUrl: string
  onSelectTemplate: (template: LogTemplate) => void
  table: LogsTableName
  condensedLayout: Boolean
  isShowingEventChart: boolean
  onToggleEventChart: () => void
  csvData?: unknown[]
  onFiltersChange: (filters: Filters) => void
  filters: Filters
  onSelectedDatabaseChange: (id: string) => void
  className?: string
  selectedDatePickerValue: DatePickerValue
  setSelectedDatePickerValue: (value: DatePickerValue) => void
}

function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T
}

const PreviewFilterPanelWithUniversal = ({
  isLoading,
  newCount,
  onRefresh,
  onSearch = () => {},
  defaultSearchValue = '',
  defaultFromValue,
  defaultToValue,
  onExploreClick,
  queryUrl,
  condensedLayout,
  isShowingEventChart,
  onToggleEventChart,
  csvData,
  onFiltersChange,
  filters,
  table,
  onSelectedDatabaseChange,
  className,
  selectedDatePickerValue,
  setSelectedDatePickerValue,
}: PreviewFilterPanelProps) => {
  const router = useRouter()
  const { ref } = useParams()

  const logName = router.pathname.split('/').pop()

  const { data: loadBalancers } = useLoadBalancersQuery({ projectRef: ref })

  const showDatabaseSelector =
    IS_PLATFORM && LOG_ROUTES_WITH_REPLICA_SUPPORT.includes(router.pathname)

  const filterProperties = useMemo(() => {
    const tableFilters = FILTER_OPTIONS[table]
    if (!tableFilters) return []

    const properties: FilterProperty[] = []

    // Add date range filter
    properties.push({
      label: 'Time Range',
      name: 'timerange',
      type: 'string' as const,
      operators: ['='],
      options: [
        {
          label: 'Last 15 minutes',
          value: `${dayjs().subtract(15, 'minute').toISOString()}|${dayjs().toISOString()}`,
        },
        {
          label: 'Last 30 minutes',
          value: `${dayjs().subtract(30, 'minute').toISOString()}|${dayjs().toISOString()}`,
        },
        {
          label: 'Last hour',
          value: `${dayjs().subtract(1, 'hour').toISOString()}|${dayjs().toISOString()}`,
        },
        {
          label: 'Last 3 hours',
          value: `${dayjs().subtract(3, 'hour').toISOString()}|${dayjs().toISOString()}`,
        },
        {
          label: 'Last 24 hours',
          value: `${dayjs().subtract(24, 'hour').toISOString()}|${dayjs().toISOString()}`,
        },
        {
          label: 'Custom Range...',
          component: (props: CustomOptionProps) => <CustomDateRangePicker {...props} />,
        },
      ],
    })

    // Add table-specific filters
    Object.entries(tableFilters).forEach(([key, filterSet]) => {
      properties.push({
        label: filterSet.label,
        name: filterSet.key,
        type: 'string' as const,
        operators: ['='],
        options: filterSet.options.map((option) => ({
          label: option.label,
          value: option.key,
          description: option.description,
        })),
      })
    })

    return properties
  }, [table])

  // Convert Logs.Filters to FilterBar.FilterGroup
  const filterBarFilters = useMemo(() => {
    const conditions: FilterCondition[] = []

    // Handle date range - only add from defaultValues if no timerange filter exists
    if ((defaultFromValue || defaultToValue) && !filters.timerange) {
      conditions.push({
        propertyName: 'timerange',
        operator: '=',
        value: `${defaultFromValue || ''}|${defaultToValue || ''}`,
      })
    }

    // Convert other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'search_query') return // Skip search_query as it's handled in freeform text

      if (typeof value === 'object' && value !== null) {
        // If the filter object is empty, add a condition with no value
        if (Object.keys(value).length === 0) {
          conditions.push({
            propertyName: key,
            operator: '=',
            value: '',
          })
          return
        }

        // Handle active filters
        Object.entries(value as Record<string, boolean>).forEach(([subKey, isEnabled]) => {
          if (isEnabled) {
            conditions.push({
              propertyName: key,
              operator: '=',
              value: subKey,
            })
          }
        })
      } else if (value !== undefined && value !== null) {
        conditions.push({
          propertyName: key,
          operator: '=',
          value: String(value),
        })
      }
    })

    return {
      logicalOperator: 'AND',
      conditions,
    } as FilterGroup
  }, [filters, defaultFromValue, defaultToValue])

  const handleFilterChange = (filterGroup: FilterGroup) => {
    const newFilters: Filters = {}
    let hasTimeRange = false

    filterGroup.conditions.forEach((condition) => {
      if (!('propertyName' in condition)) return

      const propertyName = condition.propertyName
      if (!propertyName) return

      if (propertyName === 'timerange') {
        hasTimeRange = true
        if (condition.value) {
          const value = String(condition.value)
          const [from, to] = value.split('|')
          newFilters.timerange = { [value]: true }
          onSearch('datepicker-change', { from, to })
        } else {
          newFilters.timerange = {}
          onSearch('datepicker-change', { from: '', to: '' })
        }
      } else {
        if (!newFilters[propertyName]) {
          newFilters[propertyName] = {}
        }

        if (!condition.value) {
          return
        }

        ;(newFilters[propertyName] as Record<string, boolean>)[condition.value] = true
      }
    })

    // If timerange was completely removed from the filter group
    if (!hasTimeRange) {
      onSearch('datepicker-change', { from: '', to: '' })
    }

    onFiltersChange(newFilters)
  }

  return (
    <div className={cn('flex w-full flex-col gap-2', condensedLayout ? ' p-3' : '', className)}>
      <div className="flex items-center justify-between gap-x-2">
        <div className="flex-1">
          <FilterBar
            filterProperties={filterProperties}
            filters={filterBarFilters}
            onFilterChange={handleFilterChange}
            freeformText={defaultSearchValue}
            onFreeformTextChange={(value) => onSearch('search-input-change', { query: value })}
          />
        </div>

        <div className="flex items-center gap-x-2">
          <Button
            title="refresh"
            type="default"
            className="px-1.5"
            icon={
              <div className="relative">
                {newCount > 0 && (
                  <div className="absolute -top-3 right-3 flex items-center justify-center">
                    <div className="absolute z-20">
                      <p style={{ fontSize: '0.6rem' }} className="text-white">
                        {newCount > 1000 ? `${Math.floor(newCount / 100) / 10}K` : newCount}
                      </p>
                    </div>
                    <div className="h-4 w-4 animate-ping rounded-full bg-green-800 opacity-60"></div>
                    <div className="z-60 absolute top-0 right-0 h-full w-full rounded-full bg-green-900 opacity-80"></div>
                  </div>
                )}
                <RefreshCw />
              </div>
            }
            loading={isLoading}
            disabled={isLoading}
            onClick={onRefresh}
          />

          <Button
            type="default"
            onClick={() => onToggleEventChart()}
            icon={isShowingEventChart ? <Eye /> : <EyeOff />}
          >
            Chart
          </Button>

          {/* <CSVButton data={csvData} disabled={!Boolean(csvData)} title="Download data" /> */}

          {showDatabaseSelector ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild className="px-1.5" type="default" icon={<Terminal />}>
                    <Link href={queryUrl} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Open query in Logs Explorer
                </TooltipContent>
              </Tooltip>
              <DatabaseSelector
                onSelectId={onSelectedDatabaseChange}
                additionalOptions={
                  table === LogsTableName.EDGE
                    ? (loadBalancers ?? []).length > 0
                      ? [{ id: `${ref}-all`, name: 'API Load Balancer' }]
                      : []
                    : []
                }
              />
            </>
          ) : (
            <Button asChild type="default" onClick={onExploreClick}>
              <Link href={queryUrl}>Explore via query</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export { PreviewFilterPanelWithUniversal }
