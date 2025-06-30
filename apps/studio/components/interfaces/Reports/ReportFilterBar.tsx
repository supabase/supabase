import { ChevronDown, Database, RefreshCw } from 'lucide-react'
import { ComponentProps, useCallback, useEffect, useState, useMemo } from 'react'
import { parseAsString, useQueryStates } from 'nuqs'
import SVG from 'react-inlinesvg'
import { BASE_PATH } from 'lib/constants'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { useLoadBalancersQuery } from 'data/read-replicas/load-balancers-query'
import { Auth, Realtime, Storage } from 'icons'
import {
  cn,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { FilterBar } from 'ui-patterns'
import { DatePickerValue, LogsDatePicker } from '../Settings/Logs/Logs.DatePickers'
import { REPORTS_DATEPICKER_HELPERS } from './Reports.constants'
import type { ReportFilterItem } from './Reports.types'
import type { FilterGroup, FilterCondition } from 'ui-patterns'

interface ReportFilterBarProps {
  filters: ReportFilterItem[]
  isLoading: boolean
  onAddFilter: (filter: ReportFilterItem) => void
  onRemoveFilters: (filters: ReportFilterItem[]) => void
  onRefresh: () => void
  onDatepickerChange: ComponentProps<typeof LogsDatePicker>['onSubmit']
  datepickerTo?: string
  datepickerFrom?: string
  datepickerHelpers: typeof REPORTS_DATEPICKER_HELPERS
  selectedProduct?: string
  className?: string
}

const PRODUCT_FILTERS = [
  {
    key: 'rest',
    filterKey: 'request.path',
    filterValue: '/rest',
    label: 'REST',
    description: 'Requests made to PostgREST',
    icon: Database,
  },
  {
    key: 'auth',
    filterKey: 'request.path',
    filterValue: '/auth',
    label: 'Auth',
    description: 'Auth and authorization requests',
    icon: Auth,
  },
  {
    key: 'storage',
    filterKey: 'request.path',
    filterValue: '/storage',
    label: 'Storage',
    description: 'Storage asset requests',
    icon: Storage,
  },
  {
    key: 'realtime',
    filterKey: 'request.path',
    filterValue: '/realtime',
    label: 'Realtime',
    description: 'Realtime connection requests',
    icon: Realtime,
  },
  {
    key: 'graphql',
    filterKey: 'request.path',
    filterValue: '/graphql',
    label: 'GraphQL',
    description: 'Requests made to pg_graphql',
    icon: null,
  },
]

enum ReportFilterKeys {
  PATH = 'request.path',
  SEARCH = 'request.search',
  X_CLIENT_INFO = 'request.headers.x_client_info',
  USER_AGENT = 'request.headers.user_agent',
  STATUS_CODE = 'response.status_code',
}

export const REPORT_FILTER_PARAMS_PARSER = {
  [ReportFilterKeys.PATH]: parseAsString,
  [ReportFilterKeys.SEARCH]: parseAsString,
  [ReportFilterKeys.X_CLIENT_INFO]: parseAsString,
  [ReportFilterKeys.USER_AGENT]: parseAsString,
  [ReportFilterKeys.STATUS_CODE]: parseAsString, // Changed to string to handle operators
}

const ReportFilterBar = ({
  filters,
  isLoading = false,
  onAddFilter,
  onDatepickerChange,
  onRemoveFilters,
  onRefresh,
  datepickerHelpers,
  selectedProduct,
  className,
}: ReportFilterBarProps) => {
  const { ref } = useParams()
  const { data: loadBalancers } = useLoadBalancersQuery({ projectRef: ref })
  const [currentProductFilter, setCurrentProductFilter] = useState<
    null | (typeof PRODUCT_FILTERS)[number]
  >(null)

  // URL-safe operator mappings
  const URL_OPERATOR_MAP = {
    '=': 'eq',
    '!=': 'neq',
    '>=': 'gte',
    '<=': 'lte',
    '>': 'gt',
    '<': 'lt',
    CONTAINS: 'contains',
    'STARTS WITH': 'startswith',
    'ENDS WITH': 'endswith',
  }

  const REVERSE_URL_OPERATOR_MAP = Object.fromEntries(
    Object.entries(URL_OPERATOR_MAP).map(([k, v]) => [v, k])
  )

  // Parse encoded filter value (e.g., "gte:300" -> { operator: ">=", value: "300" })
  const parseFilterValue = useCallback((encodedValue: string | number | null) => {
    if (!encodedValue || typeof encodedValue !== 'string') {
      return { operator: '=', value: encodedValue?.toString() || '' }
    }

    const parts = encodedValue.split(':')
    if (parts.length === 2) {
      const [urlOperator, value] = parts
      const operator = REVERSE_URL_OPERATOR_MAP[urlOperator] || '='
      return { operator, value }
    }

    return { operator: '=', value: encodedValue }
  }, [])

  const encodeFilterValue = useCallback((operator: string, value: string | number) => {
    const urlOperator = URL_OPERATOR_MAP[operator as keyof typeof URL_OPERATOR_MAP] || 'eq'
    return `${urlOperator}:${value}`
  }, [])

  // Convert query filters to FilterGroup format
  const convertQueryFiltersToFilterGroup = useCallback(
    (queryState: Record<string, string | number | null>): FilterGroup => {
      const conditions: FilterCondition[] = []

      Object.entries(queryState).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (key === ReportFilterKeys.PATH && (selectedProduct || currentProductFilter)) {
            return
          }

          const { operator, value: filterValue } = parseFilterValue(value)
          conditions.push({
            propertyName: key,
            value: filterValue,
            operator: operator,
          })
        }
      })

      return {
        logicalOperator: 'AND',
        conditions,
      }
    },
    [selectedProduct, currentProductFilter]
  )

  // Convert operator from FilterBar format to ReportFilterItem format
  const getCompareOperator = useCallback(
    (operator: string): 'matches' | 'is' | '>=' | '<=' | '>' | '<' | '!=' => {
      switch (operator) {
        case '=':
          return 'is'
        case '!=':
          return '!='
        case '>=':
          return '>='
        case '<=':
          return '<='
        case '>':
          return '>'
        case '<':
          return '<'
        case 'CONTAINS':
        case 'STARTS WITH':
        case 'ENDS WITH':
          return 'matches'
        default:
          return 'matches'
      }
    },
    []
  )

  // Convert FilterGroup to ReportFilterItem format for the report system
  const convertFilterGroupToReportFilters = useCallback(
    (filterGroup: FilterGroup): ReportFilterItem[] => {
      const reportFilters: ReportFilterItem[] = []

      filterGroup.conditions.forEach((condition) => {
        if (!('logicalOperator' in condition)) {
          const filterCondition = condition as FilterCondition

          if (
            filterCondition.propertyName === ReportFilterKeys.PATH &&
            (selectedProduct || currentProductFilter)
          ) {
            return
          }

          // Only send to report system if filter has a value (empty filters are for UI only)
          if (
            filterCondition.value !== null &&
            filterCondition.value !== '' &&
            filterCondition.value !== undefined
          ) {
            reportFilters.push({
              key: filterCondition.propertyName,
              value: filterCondition.value.toString(),
              compare: getCompareOperator(filterCondition.operator),
            })
          }
        }
      })

      return reportFilters
    },
    [selectedProduct, currentProductFilter]
  )

  // Convert FilterGroup back to query filters format
  const convertFilterGroupToQueryFilters = useCallback(
    (filterGroup: FilterGroup) => {
      const queryUpdate: Record<string, string | number | null> = {}

      // Clear all existing filters first
      Object.keys(REPORT_FILTER_PARAMS_PARSER).forEach((key) => {
        queryUpdate[key] = null
      })

      // Add new filters with encoded operator+value
      filterGroup.conditions.forEach((condition) => {
        if (!('logicalOperator' in condition)) {
          // It's a FilterCondition, not a nested FilterGroup
          const filterCondition = condition as FilterCondition

          // Skip path filters if product filtering is active (handled separately)
          if (
            filterCondition.propertyName === ReportFilterKeys.PATH &&
            (selectedProduct || currentProductFilter)
          ) {
            return
          }

          if (filterCondition.propertyName in REPORT_FILTER_PARAMS_PARSER) {
            // Encode operator + value for URL safety
            const encodedValue = encodeFilterValue(
              filterCondition.operator,
              filterCondition.value as string | number
            )
            queryUpdate[filterCondition.propertyName] = encodedValue
          }
        }
      })

      return queryUpdate
    },
    [selectedProduct, currentProductFilter]
  )

  const initialFilters: FilterGroup = {
    logicalOperator: 'AND',
    conditions: [],
  }

  const [queryFilters, setQueryFilters] = useQueryStates(REPORT_FILTER_PARAMS_PARSER, {
    throttleMs: 200,
  })
  const [localFilters, setLocalFilters] = useState<FilterGroup>(initialFilters)
  const [freeformText, setFreeformText] = useState('')

  // Initialize local state from URL params (like UnifiedLogs does)
  const defaultFilterGroup = useMemo(() => {
    return convertQueryFiltersToFilterGroup(queryFilters)
  }, [queryFilters])

  // Track if we're initializing to avoid sync loops
  const [isInitialized, setIsInitialized] = useState(false)

  // Set initial local state from URL params (only once on mount)
  useEffect(() => {
    if (!isInitialized) {
      setLocalFilters(defaultFilterGroup)
      setIsInitialized(true)
    }
  }, [defaultFilterGroup, isInitialized])

  // Sync local filter changes back to URL state (only after initialization)
  useEffect(() => {
    if (!isInitialized) return // Don't sync during initialization

    const queryUpdate = convertFilterGroupToQueryFilters(localFilters)

    // Simple comparison - only update if there are meaningful differences
    const hasChanges = Object.entries(queryUpdate).some(
      ([key, value]) => queryFilters[key as keyof typeof queryFilters] !== value
    )

    if (hasChanges) {
      setQueryFilters(queryUpdate)
    }
  }, [localFilters, isInitialized])

  // Separate effect for report filter updates (only for filters with values)
  useEffect(() => {
    const reportFilters = convertFilterGroupToReportFilters(localFilters)

    // Separate product filters (managed by dropdown) from other filters (managed by FilterBar)
    const productFilters = filters.filter((f) =>
      PRODUCT_FILTERS.some((pf) => f.key === pf.filterKey && f.value === pf.filterValue)
    )
    const otherFilters = filters.filter(
      (f) => !PRODUCT_FILTERS.some((pf) => f.key === pf.filterKey && f.value === pf.filterValue)
    )

    // Only compare non-product filters (FilterBar managed filters)
    const currentFilterState = otherFilters
      .map((f) => `${f.key}:${f.value}:${f.compare}`)
      .sort()
      .join('|')
    const newFilterState = reportFilters
      .map((f) => `${f.key}:${f.value}:${f.compare}`)
      .sort()
      .join('|')

    // Only update if the FilterBar managed filters changed
    if (currentFilterState !== newFilterState) {
      // Remove only non-product filters, preserve product filters
      onRemoveFilters(otherFilters)
      reportFilters.forEach((filter) => onAddFilter(filter))
    }
  }, [localFilters, filters, onRemoveFilters, onAddFilter])

  const handleFilterChange = (newFilters: FilterGroup) => {
    setLocalFilters(newFilters)
  }

  // Get filter properties based on product type
  const getFilterProperties = () => {
    const baseProperties = [
      // {
      //   label: 'Path',
      //   name: ReportFilterKeys.PATH,
      //   type: 'string' as const,
      //   operators: ['=', '!=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH'],
      // },
      {
        label: 'Status Code',
        name: ReportFilterKeys.STATUS_CODE,
        type: 'number' as const,
        options: [
          { label: '200', value: '200' },
          { label: '300', value: '300' },
          { label: '400', value: '400' },
          { label: '500', value: '500' },
        ],
        operators: ['=', '!=', '>', '<', '>=', '<='],
      },
      {
        label: 'User Agent',
        name: ReportFilterKeys.USER_AGENT,
        type: 'string' as const,
        operators: ['=', '!=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH'],
      },
      {
        label: 'Search Params',
        name: ReportFilterKeys.SEARCH,
        type: 'string' as const,
        operators: ['=', '!=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH'],
      },
      {
        label: 'Client Info',
        name: ReportFilterKeys.X_CLIENT_INFO,
        type: 'string' as const,
        operators: ['=', '!=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH'],
      },
    ]

    // // If productFilter is set, don't show path filters (handled automatically)
    // if (selectedProduct) {
    //   return baseProperties
    // }

    // // If no productFilter but user manually selected a product, don't show path filter
    // if (currentProductFilter) {
    //   return baseProperties
    // }

    // Only show path filter when no product filtering is active
    return [
      {
        label: 'Path',
        name: ReportFilterKeys.PATH,
        type: 'string' as const,
        operators: ['=', '!=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH'],
      },
      ...baseProperties,
    ]
  }

  const filterProperties = getFilterProperties()

  const handleDatepickerChange = (vals: DatePickerValue) => {
    onDatepickerChange(vals)
    setSelectedRange(vals)
  }

  const handleProductFilterChange = async (
    nextProductFilter: null | (typeof PRODUCT_FILTERS)[number]
  ) => {
    const toRemove = PRODUCT_FILTERS.map(
      (productFilter) =>
        ({
          key: productFilter.filterKey,
          compare: 'matches',
          value: productFilter.filterValue,
        }) as ReportFilterItem
    )
    onRemoveFilters(toRemove)
    if (nextProductFilter) {
      onAddFilter({
        key: nextProductFilter.filterKey,
        compare: 'matches',
        value: nextProductFilter.filterValue,
      })
    }
    setCurrentProductFilter(nextProductFilter)
  }

  const defaultHelper = datepickerHelpers[0]
  const [selectedRange, setSelectedRange] = useState<DatePickerValue>({
    to: defaultHelper.calcTo(),
    from: defaultHelper.calcFrom(),
    isHelper: true,
    text: defaultHelper.text,
  })

  useEffect(() => {
    if (selectedProduct) {
      handleProductFilterChange(PRODUCT_FILTERS.find((p) => p.key === selectedProduct) ?? null)
    }
  }, [])

  return (
    <div className={cn('flex flex-wrap md:items-center justify-between gap-2', className)}>
      <div className="flex gap-2">
        <ButtonTooltip
          type="default"
          disabled={isLoading}
          icon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
          className="w-7"
          tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
          onClick={() => onRefresh()}
        />
        <LogsDatePicker
          onSubmit={handleDatepickerChange}
          value={selectedRange}
          helpers={datepickerHelpers}
        />
        {!selectedProduct && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                className="inline-flex flex-row gap-2"
                iconRight={<ChevronDown size={14} />}
              >
                <span>
                  {currentProductFilter === null ? 'All Requests' : currentProductFilter.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuItem onClick={() => handleProductFilterChange(null)}>
                <p>All Requests</p>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {PRODUCT_FILTERS.map((productFilterItem) => {
                const Icon = productFilterItem.icon

                return (
                  <DropdownMenuItem
                    key={productFilterItem.key}
                    className="space-x-2"
                    disabled={productFilterItem.key === currentProductFilter?.key}
                    onClick={() => handleProductFilterChange(productFilterItem)}
                  >
                    {productFilterItem.key === 'graphql' ? (
                      <SVG
                        src={`${BASE_PATH}/img/graphql.svg`}
                        className="w-[20px] h-[20px] mr-2"
                        preProcessor={(code) =>
                          code.replace(/svg/, 'svg class="m-auto text-color-inherit"')
                        }
                      />
                    ) : Icon !== null ? (
                      <Icon size={20} strokeWidth={1.5} className="mr-2" />
                    ) : null}
                    <div className="flex flex-col">
                      <p
                        className={cn(
                          productFilterItem.key === currentProductFilter?.key ? 'font-bold' : '',
                          'inline-block'
                        )}
                      >
                        {productFilterItem.label}
                      </p>
                      <p className=" text-left text-foreground-light inline-block w-[180px]">
                        {productFilterItem.description}
                      </p>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="order-last md:order-none flex-1">
        <FilterBar
          filterProperties={filterProperties}
          freeformText={freeformText}
          onFreeformTextChange={setFreeformText}
          filters={localFilters}
          onFilterChange={handleFilterChange}
        />
      </div>

      <DatabaseSelector
        additionalOptions={
          (loadBalancers ?? []).length > 0 ? [{ id: `${ref}-all`, name: 'API Load Balancer' }] : []
        }
      />
    </div>
  )
}
export default ReportFilterBar
