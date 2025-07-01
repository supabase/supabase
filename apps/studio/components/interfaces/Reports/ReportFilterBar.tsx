import { ChevronDown, Database, RefreshCw } from 'lucide-react'
import { ComponentProps, useCallback, useEffect, useState, useMemo, useRef } from 'react'
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
import { DatePickerValue, LogsDatePicker } from '../Settings/Logs/Logs.DatePickers'
import { REPORTS_DATEPICKER_HELPERS } from './Reports.constants'
import type { ReportFilterItem } from './Reports.types'
import {
  ReportFilterPopover,
  type ReportFilter,
  type ReportFilterProperty,
} from './ReportFilterPopover'

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
  [ReportFilterKeys.STATUS_CODE]: parseAsString,
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

  const encodeFilterValue = useCallback((operator: string | number, value: string | number) => {
    const urlOperator = URL_OPERATOR_MAP[operator as keyof typeof URL_OPERATOR_MAP] || 'eq'
    return `${urlOperator}:${value}`
  }, [])

  // Convert query filters to ReportFilter format
  const convertQueryFiltersToReportFilters = useCallback(
    (queryState: Record<string, string | number | null>): ReportFilter[] => {
      const filters: ReportFilter[] = []

      Object.entries(queryState).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          const { operator, value: filterValue } = parseFilterValue(value)
          filters.push({
            propertyName: key,
            value: filterValue,
            operator: operator,
          })
        }
      })

      return filters
    },
    [selectedProduct, currentProductFilter, parseFilterValue]
  )

  // Convert operator from FilterBar format to ReportFilterItem format
  const getCompareOperator = useCallback(
    (operator: string | number): 'matches' | 'is' | '>=' | '<=' | '>' | '<' | '!=' => {
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

  const convertReportFiltersToReportFilterItems = useMemo(
    () =>
      (reportFilters: ReportFilter[]): ReportFilterItem[] => {
        const reportFilterItems: ReportFilterItem[] = []

        reportFilters.forEach((filter) => {
          if (filter.value !== null && filter.value !== '' && filter.value !== undefined) {
            reportFilterItems.push({
              key: filter.propertyName.toString(),
              value: filter.value.toString(),
              compare: getCompareOperator(filter.operator),
            })
          }
        })

        return reportFilterItems
      },
    [getCompareOperator]
  )

  // Convert ReportFilter back to query filters format
  const convertReportFiltersToQueryFilters = useMemo(
    () => (reportFilters: ReportFilter[]) => {
      const queryUpdate: Record<string, string | number | null> = {}

      // Clear all existing filters first
      Object.keys(REPORT_FILTER_PARAMS_PARSER).forEach((key) => {
        queryUpdate[key] = null
      })

      reportFilters.forEach((filter) => {
        if (filter.propertyName in REPORT_FILTER_PARAMS_PARSER) {
          const encodedValue = encodeFilterValue(filter.operator, filter.value as string | number)
          queryUpdate[filter.propertyName] = encodedValue
        }
      })

      return queryUpdate
    },
    [encodeFilterValue]
  )

  const [queryFilters, setQueryFilters] = useQueryStates(REPORT_FILTER_PARAMS_PARSER)
  const [localFilters, setLocalFilters] = useState<ReportFilter[]>([])

  const [isInitialized, setIsInitialized] = useState(false)

  // Track the last applied filter state to prevent circular dependencies
  const lastAppliedFilterState = useRef<string>('')

  // Track the last URL state that we set to prevent feedback loops
  const lastSetUrlState = useRef<string>('')

  // Initialize local state from URL params (only once on mount)
  useEffect(() => {
    if (!isInitialized) {
      const initialFilters = convertQueryFiltersToReportFilters(queryFilters)
      setLocalFilters(initialFilters)
      setIsInitialized(true)

      // Initialize the URL state tracking with current URL state
      const currentUrlState = Object.entries(queryFilters)
        .filter(([, value]) => value !== null)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
      lastSetUrlState.current = currentUrlState
    }
  }, [isInitialized])

  // Sync local filter changes back to URL state (only after initialization)
  useEffect(() => {
    if (!isInitialized) return // Don't sync during initialization

    const queryUpdate = convertReportFiltersToQueryFilters(localFilters)

    // Create a string representation for comparison
    const newUrlState = Object.entries(queryUpdate)
      .filter(([, value]) => value !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    if (lastSetUrlState.current !== newUrlState) {
      console.log('Updating URL state from:', lastSetUrlState.current, 'to:', newUrlState)
      lastSetUrlState.current = newUrlState
      setQueryFilters(queryUpdate)
    }
  }, [localFilters, isInitialized, setQueryFilters])

  useEffect(() => {
    if (!isInitialized) return

    const reportFilterItems = convertReportFiltersToReportFilterItems(localFilters)

    // Create a state string for comparison (only for the filters we manage)
    const newFilterState = reportFilterItems
      .map((filter) => `${filter.key}:${filter.value}:${filter.compare}`)
      .sort()
      .join('|')

    if (lastAppliedFilterState.current !== newFilterState) {
      lastAppliedFilterState.current = newFilterState

      // Separate product filters (managed by dropdown) from other filters (managed by ReportFilterPopover)
      const productFilters = filters.filter((f) =>
        PRODUCT_FILTERS.some((pf) => f.key === pf.filterKey && f.value === pf.filterValue)
      )
      const otherFilters = filters.filter(
        (f) => !PRODUCT_FILTERS.some((pf) => f.key === pf.filterKey && f.value === pf.filterValue)
      )

      console.log('Filter Update:', {
        localFilters,
        reportFilterItems,
        productFilters,
        otherFilters,
        newFilterState,
      })

      // Remove only the non-product filters that we manage
      if (otherFilters.length > 0) {
        onRemoveFilters(otherFilters)
      }

      reportFilterItems.forEach((filter) => onAddFilter(filter))
    }
  }, [localFilters, isInitialized])

  const handleFilterChange = (newFilters: ReportFilter[]) => {
    console.log('handleFilterChange called with:', newFilters)
    setLocalFilters(newFilters)
  }

  const getFilterProperties = (): ReportFilterProperty[] => {
    const baseProperties: ReportFilterProperty[] = [
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
        placeholder: '200',
      },
      {
        label: 'User Agent',
        name: ReportFilterKeys.USER_AGENT,
        type: 'string' as const,
        operators: ['=', '!=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH'],
        placeholder:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      },
      {
        label: 'Search Params',
        name: ReportFilterKeys.SEARCH,
        type: 'string' as const,
        operators: ['=', '!=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH'],
        placeholder: '?foo=bar',
      },
      {
        label: 'Client Info',
        name: ReportFilterKeys.X_CLIENT_INFO,
        type: 'string' as const,
        operators: ['=', '!=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH'],
        placeholder: 'supabase-js/1.0.0',
      },
    ]

    return [
      {
        label: 'Path',
        name: ReportFilterKeys.PATH,
        type: 'string' as const,
        operators: ['=', '!=', 'CONTAINS', 'STARTS WITH', 'ENDS WITH'],
        placeholder: '/rest/v1/tablename',
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
        <ReportFilterPopover
          filterProperties={filterProperties}
          filters={localFilters}
          onFiltersChange={handleFilterChange}
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
