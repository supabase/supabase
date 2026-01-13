import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { parseAsString, useQueryStates } from 'nuqs'
import type { ReportFilter, ReportFilterItem, ReportFilterProperty } from './Reports.types'

export enum ReportFilterKeys {
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

interface UseReportFiltersProps {
  onAddFilter: (filter: ReportFilterItem) => void
  onRemoveFilters: (filters: ReportFilterItem[]) => void
  filters: ReportFilterItem[]
}

export const useReportFilters = ({
  onAddFilter,
  onRemoveFilters,
  filters,
}: UseReportFiltersProps) => {
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
    [parseFilterValue]
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

  // Convert ReportFilter to ReportFilterItem format for the report system
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

      // Add new filters with encoded operator+value
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
  const lastAppliedFilterState = useRef<string>('')
  const preventUrlSync = useRef(false)

  // Initialize local state from URL params (only once on mount)
  useEffect(() => {
    if (!isInitialized) {
      const initialFilters = convertQueryFiltersToReportFilters(queryFilters)
      setLocalFilters(initialFilters)
      setIsInitialized(true)
    }
  }, [isInitialized, convertQueryFiltersToReportFilters, queryFilters])

  // Sync URL changes back to local state (when URL changes externally)
  useEffect(() => {
    if (!isInitialized || preventUrlSync.current) return

    const filtersFromUrl = convertQueryFiltersToReportFilters(queryFilters)
    const currentFilterJson = JSON.stringify(localFilters)
    const urlFilterJson = JSON.stringify(filtersFromUrl)

    if (currentFilterJson !== urlFilterJson) {
      console.log('Syncing local filters from URL change:', { filtersFromUrl, localFilters })
      setLocalFilters(filtersFromUrl)
    }
  }, [queryFilters, isInitialized, convertQueryFiltersToReportFilters])

  // Sync local filter changes back to URL state (only after initialization)
  useEffect(() => {
    if (!isInitialized) return

    const queryUpdate = convertReportFiltersToQueryFilters(localFilters)

    // Prevent feedback loop during URL updates
    preventUrlSync.current = true
    setQueryFilters(queryUpdate).finally(() => {
      preventUrlSync.current = false
    })
  }, [localFilters, isInitialized, setQueryFilters, convertReportFiltersToQueryFilters])

  // Separate effect for report filter updates (only for filters with values)
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
      const PRODUCT_FILTER_KEYS = ['request.path']
      const PRODUCT_FILTER_VALUES = ['/rest', '/auth', '/storage', '/realtime', '/graphql']

      const productFilters = filters.filter(
        (f) =>
          PRODUCT_FILTER_KEYS.includes(f.key) && PRODUCT_FILTER_VALUES.includes(f.value.toString())
      )
      const otherFilters = filters.filter(
        (f) =>
          !(
            PRODUCT_FILTER_KEYS.includes(f.key) &&
            PRODUCT_FILTER_VALUES.includes(f.value.toString())
          )
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

      // Add all the new filters from the popover
      reportFilterItems.forEach((filter) => onAddFilter(filter))
    }
  }, [localFilters, isInitialized])

  const handleFilterChange = (newFilters: ReportFilter[]) => {
    console.log('handleFilterChange called with:', newFilters)
    setLocalFilters(newFilters)
  }

  // Get filter properties based on product type
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
          { label: '401', value: '401' },
          { label: '403', value: '403' },
          { label: '404', value: '404' },
          { label: '409', value: '409' },
          { label: '411', value: '411' },
          { label: '413', value: '413' },
          { label: '416', value: '416' },
          { label: '423', value: '423' },
          { label: '500', value: '500' },
          { label: '503', value: '503' },
          { label: '504', value: '504' },
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

  return {
    localFilters,
    filterProperties: getFilterProperties(),
    handleFilterChange,
    ReportFilterKeys,
  }
}
