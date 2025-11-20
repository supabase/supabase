import { useEffect, useMemo, useState } from 'react'

import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import {
  FILTER_OPTIONS,
  LOGS_SOURCE_DESCRIPTION,
  SQL_FILTER_TEMPLATES,
  LogsTableName,
} from './Logs.constants'
import { genDefaultQuery } from './Logs.utils'
import type { Filters } from './Logs.types'
import LogsFilterPopover from './LogsFilterPopover'
import { DatePickerValue, LogsDatePicker } from './Logs.DatePickers'
import { EXPLORER_DATEPICKER_HELPERS } from './Logs.constants'
import {
  Button,
  Input,
  Select_Shadcn_ as Select,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
} from 'ui'
import { Plus, Trash2 } from 'lucide-react'

export interface LogsQueryBuilderProps {
  value?: string
  onChange: (sql: string) => void
  onRun: (sql: string) => void
  defaultSource?: LogsTableName
  defaultFrom: string
  defaultTo: string
  onDateChange: (value: DatePickerValue) => void
}

export const LogsQueryBuilder = ({
  value,
  onChange,
  onRun,
  defaultSource = LogsTableName.EDGE,
  defaultFrom,
  defaultTo,
  onDateChange,
}: LogsQueryBuilderProps) => {
  const { projectAuthAll, projectStorageAll, projectEdgeFunctionAll } = useIsFeatureEnabled([
    'project_auth:all',
    'project_storage:all',
    'project_edge_function:all',
  ])

  const availableSources = useMemo(() => {
    const entries = Object.entries(LogsTableName).filter(([key]) => {
      if (key === 'AUTH') return projectAuthAll
      if (key === 'STORAGE') return projectStorageAll
      if (key === 'FN_EDGE') return projectEdgeFunctionAll
      if (key === 'PG_CRON') return false
      return true
    })
    return entries.map(([, v]) => v)
  }, [projectAuthAll, projectStorageAll, projectEdgeFunctionAll])

  const [source, setSource] = useState<LogsTableName>(
    availableSources.includes(defaultSource) ? defaultSource : availableSources[0]
  )
  const [search, setSearch] = useState<string>('')
  const [limit, setLimit] = useState<number>(100)
  const [filters, setFilters] = useState<Filters>({})
  const [rows, setRows] = useState<{ id: string; prop: string; val?: string | boolean }[]>([])

  function getDefaultDatePickerValue() {
    if (defaultFrom && defaultTo) {
      return {
        to: defaultTo,
        from: defaultFrom,
        text: '',
        isHelper: false,
      }
    }
    return {
      to: EXPLORER_DATEPICKER_HELPERS[0].calcTo(),
      from: EXPLORER_DATEPICKER_HELPERS[0].calcFrom(),
      text: EXPLORER_DATEPICKER_HELPERS[0].text,
      isHelper: true,
    }
  }
  const [selectedDatePickerValue, setSelectedDatePickerValue] = useState<DatePickerValue>(
    getDefaultDatePickerValue()
  )

  const handleFiltersChange = (next: Filters) => {
    setFilters((prev) => ({ ...prev, ...next }))
  }

  const filtersWithSearch = useMemo(() => {
    return {
      ...filters,
      search_query: search,
    }
  }, [filters, search])

  useEffect(() => {
    // derive filters object from rows and search
    const derived: Filters = {}
    if (search && search.length > 0) {
      ;(derived as any).search_query = search
    }
    rows.forEach((r) => {
      if (!r.prop) return
      const parts = r.prop.split('.')
      const root = parts[0]
      if (parts.length === 1) {
        ;(derived as any)[root] = r.val
      } else {
        ;(derived as any)[root] = { ...(derived as any)[root] }
        ;(derived as any)[root][parts.slice(1).join('.')] = r.val === undefined ? true : r.val
      }
    })
    const sql = genDefaultQuery(
      source,
      { ...(filtersWithSearch as any), ...(derived as any) },
      limit
    )
    onChange(sql)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, filtersWithSearch, limit, rows, search])

  const run = () => {
    const sql = genDefaultQuery(source, filtersWithSearch, limit)
    onRun(sql)
  }

  const sourceFilters = FILTER_OPTIONS[source]
  const templateKeys = useMemo(
    () => Object.keys(SQL_FILTER_TEMPLATES[source] ?? {}).filter((k) => k !== 'search_query'),
    [source]
  )

  return (
    <div className="w-full border-b bg-surface-100">
      <div className="px-4 md:px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-foreground-lighter min-w-24">FROM</span>
          <Select value={source} onValueChange={(v) => setSource(v as LogsTableName)}>
            <SelectTrigger size="tiny" className="w-72">
              {source ? source : 'Pick a source'}
            </SelectTrigger>
            <SelectContent>
              {availableSources
                .sort((a, b) => a.localeCompare(b))
                .map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex flex-col">
                      <span className="font-mono">{s}</span>
                      <span className="text-foreground-lighter text-[11px]">
                        {LOGS_SOURCE_DESCRIPTION[s]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-lighter min-w-24">WHERE</span>
            <span className="text-xs font-mono">event_message</span>
            <span className="text-xs text-foreground-lighter">includes</span>
            <Input
              size="tiny"
              className="w-96"
              placeholder="value"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            {rows.map((row, idx) => {
              const template = (SQL_FILTER_TEMPLATES as any)[source]?.[row.prop]
              const needsValue = typeof template === 'function' || row.prop.split('.').length === 1
              return (
                <div key={row.id} className="flex items-center gap-2 mt-2">
                  <div className="min-w-24"></div>
                  <Select
                    value={row.prop}
                    onValueChange={(v) =>
                      setRows((prev) => {
                        const next = [...prev]
                        next[idx] = { ...next[idx], prop: v }
                        return next
                      })
                    }
                  >
                    <SelectTrigger size="tiny" className="w-72">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {templateKeys.map((k) => (
                        <SelectItem key={k} value={k}>
                          <span className="font-mono">{k}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {needsValue && (
                    <Input
                      size="tiny"
                      className="w-96"
                      placeholder="Value"
                      value={String(row.val ?? '')}
                      onChange={(e) =>
                        setRows((prev) => {
                          const next = [...prev]
                          next[idx] = { ...next[idx], val: e.target.value }
                          return next
                        })
                      }
                    />
                  )}
                  <Button
                    type="text"
                    className="px-1"
                    icon={<Trash2 size={14} />}
                    onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="min-w-24"></div>
          <Button
            size="tiny"
            type="default"
            icon={<Plus size={14} />}
            onClick={() =>
              setRows((prev) => [...prev, { id: Math.random().toString(36).slice(2), prop: '' }])
            }
          >
            Add filter
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-8">
          <span className="text-xs font-mono min-w-24 text-foreground-lighter">TIME RANGE</span>
          <LogsDatePicker
            align="start"
            value={selectedDatePickerValue}
            onSubmit={(value) => {
              setSelectedDatePickerValue(value)
              onDateChange(value)
            }}
            helpers={EXPLORER_DATEPICKER_HELPERS}
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-mono min-w-24 text-foreground-lighter">LIMIT</span>
          <Input
            size="tiny"
            type="number"
            className="w-24"
            min={1}
            value={limit}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isNaN(n)) return
              setLimit(n < 1 ? 1 : n)
            }}
          />
        </div>
      </div>
    </div>
  )
}
