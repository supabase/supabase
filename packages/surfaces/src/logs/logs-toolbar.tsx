import {
  LOG_SOURCE_LABELS,
  logLevelSchema,
  logMinutesSchema,
  logSourceSchema,
  type LogSettings,
} from '@supabase/mcp-server-supabase/apps'
import { RefreshCwIcon, SearchIcon, XIcon } from 'lucide-react'
import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'

import type { LogLevelFilter, LogSourceFilter } from './logs-model'

const LEVEL_OPTIONS: { value: LogLevelFilter; label: string }[] = [
  { value: 'all', label: 'All levels' },
  { value: 'error', label: 'Errors' },
  { value: 'warning', label: 'Warnings' },
  { value: 'info', label: 'Info' },
]

const SOURCE_OPTIONS: { value: LogSourceFilter; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'edge_functions', label: 'Edge Functions' },
  ...Object.entries(LOG_SOURCE_LABELS).map(([value, label]) => ({
    value: logSourceSchema.parse(value),
    label,
  })),
]

const MINUTE_OPTIONS: { value: string; label: string }[] = [
  { value: '60', label: 'Last hour' },
  { value: '360', label: 'Last 6 hours' },
  { value: '1440', label: 'Last 24 hours' },
]

interface LogsToolbarProps {
  search: string
  level: LogLevelFilter
  source: LogSourceFilter
  minutes: LogSettings['minutes']
  isLoading: boolean
  onSearchChange: (search: string) => void
  onLevelChange: (level: LogLevelFilter) => void
  onSourceChange: (source: LogSourceFilter) => void
  onMinutesChange: (minutes: LogSettings['minutes']) => void
  onRefresh?: () => void
}

export function LogsToolbar({
  search,
  level,
  source,
  minutes,
  isLoading,
  onSearchChange,
  onLevelChange,
  onSourceChange,
  onMinutesChange,
  onRefresh,
}: LogsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
      <InputGroup className="h-[26px] min-w-40 flex-1">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Search logs"
          placeholder="Search logs…"
          className="text-xs"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && search) {
              event.preventDefault()
              onSearchChange('')
            }
          }}
        />
        {search && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton aria-label="Clear log search" onClick={() => onSearchChange('')}>
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      {[
        {
          label: 'Log level',
          value: level,
          options: LEVEL_OPTIONS,
          onChange: (value: string) => onLevelChange(logLevelSchema.parse(value)),
        },
        {
          label: 'Log source',
          value: source,
          options: SOURCE_OPTIONS,
          onChange: (value: string) => onSourceChange(logSourceSchema.parse(value)),
        },
        {
          label: 'Log time range',
          value: String(minutes),
          options: MINUTE_OPTIONS,
          onChange: (value: string) => onMinutesChange(logMinutesSchema.parse(Number(value))),
        },
      ].map((filter) => (
        <Select key={filter.label} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger size="tiny" aria-label={filter.label} className="w-auto gap-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {onRefresh && (
        <Button
          variant="text"
          size="tiny"
          aria-label="Refresh logs"
          disabled={isLoading}
          icon={<RefreshCwIcon />}
          onClick={onRefresh}
        />
      )}
    </div>
  )
}
