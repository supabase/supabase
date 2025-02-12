import { createParser, useQueryState } from 'nuqs'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import { Filters } from 'components/interfaces/Settings/Logs/Logs.types'

interface LogsUrlState {
  search: string
  timestampStart: string
  timestampEnd: string
  selectedLogId: string | null
  filters: Filters
}

const defaultState: LogsUrlState = {
  search: '',
  timestampStart: '',
  timestampEnd: '',
  selectedLogId: null,
  filters: {},
}

const stringWithDefault = (defaultValue: string) =>
  createParser({
    parse: (v) => v ?? defaultValue,
    serialize: (v) => v || '',
  })

const jsonWithDefault = <T>(defaultValue: T) =>
  createParser({
    parse: (v) => {
      if (!v) return defaultValue
      try {
        return JSON.parse(v) as T
      } catch (e) {
        return defaultValue
      }
    },
    serialize: (v) => {
      if (!v) return ''
      try {
        return JSON.stringify(v)
      } catch (e) {
        return ''
      }
    },
  })

export function useLogsUrlState() {
  const [searchValue, setSearchValue] = useQueryState('s', stringWithDefault(defaultState.search))
  const [timestampStartValue, setTimestampStartValue] = useQueryState(
    'its',
    stringWithDefault(defaultState.timestampStart)
  )
  const [timestampEndValue, setTimestampEndValue] = useQueryState(
    'ite',
    stringWithDefault(defaultState.timestampEnd)
  )
  const [selectedLogIdValue, setSelectedLogIdValue] = useQueryState('log', stringWithDefault(''))
  const [filtersValue, setFiltersValue] = useQueryState(
    'f',
    jsonWithDefault<Filters>(defaultState.filters)
  )

  // Ensure we never return null values
  const search = searchValue || defaultState.search
  const timestampStart = timestampStartValue || defaultState.timestampStart
  const timestampEnd = timestampEndValue || defaultState.timestampEnd
  const selectedLogId = selectedLogIdValue || null
  const filters = filtersValue || defaultState.filters

  const setSearch = (value: string) => {
    setSearchValue(value || defaultState.search)
  }

  const setTimeRange = (start: string, end: string) => {
    setTimestampStartValue(start || defaultState.timestampStart)
    setTimestampEndValue(end || defaultState.timestampEnd)
  }

  const setSelectedLogId = (value: string | null) => {
    setSelectedLogIdValue(value || '')
  }

  const setFilters = (value: Filters) => {
    setFiltersValue(value || defaultState.filters)
  }

  const updateFilter = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value })
  }

  const reset = () => {
    setSearch(defaultState.search)
    setTimestampStartValue(defaultState.timestampStart)
    setTimestampEndValue(defaultState.timestampEnd)
    setSelectedLogIdValue('')
    setFiltersValue(defaultState.filters)
  }

  return {
    // State
    search,
    timestampStart,
    timestampEnd,
    selectedLogId,
    filters,

    // Setters
    setSearch,
    setTimeRange,
    setSelectedLogId,
    setFilters,
    updateFilter,
    reset,
  }
}
