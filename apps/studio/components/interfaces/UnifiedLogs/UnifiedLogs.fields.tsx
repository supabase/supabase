import { format } from 'date-fns'
import { User } from 'lucide-react'

import { LEVELS } from 'components/ui/DataTable/DataTable.constants'
import { DataTableFilterField, Option } from 'components/ui/DataTable/DataTable.types'
import { getLevelColor } from 'components/ui/DataTable/DataTable.utils'
import { cn } from 'ui'
import { LOG_TYPES, METHODS, STATUS_CODE_LABELS } from './UnifiedLogs.constants'
import { ColumnSchema } from './UnifiedLogs.schema'
import { LogsMeta, SheetField } from './UnifiedLogs.types'
import { getLevelLabel } from './UnifiedLogs.utils'

// instead of filterFields, maybe just 'fields' with a filterDisabled prop?
// that way, we could have 'message' or 'headers' field with label and value as well as type!
export const filterFields = [
  {
    label: 'Time Range',
    value: 'date',
    type: 'timerange',
    defaultOpen: true,
    commandDisabled: true,
  },
  {
    label: 'Log Type',
    value: 'log_type',
    type: 'checkbox',
    defaultOpen: true,
    options: LOG_TYPES.map((type) => ({ label: type, value: type })),
    component: (props: Option) => {
      return (
        <div className="flex w-full items-center justify-between gap-2">
          <span className="capitalize text-foreground/70 group-hover:text-accent-foreground text-xs">
            {props.label.replace('_', ' ')}
          </span>
        </div>
      )
    },
  },
  {
    label: 'Status',
    value: 'status',
    type: 'checkbox',
    defaultOpen: true,
    options: [],
    hasDynamicOptions: true,
    component: (props: Option) => {
      if (typeof props.value === 'boolean') return null
      if (typeof props.value === 'undefined') return null

      const statusValue = String(props.value)
      const statusLabel = STATUS_CODE_LABELS[statusValue as keyof typeof STATUS_CODE_LABELS]

      return (
        <div className="flex items-center gap-2 w-full min-w-0">
          <span className="flex-shrink-0 text-foreground">{statusValue}</span>
          {statusLabel && (
            <span className="text-[0.7rem] text-foreground-lighter truncate" title={statusLabel}>
              {statusLabel}
            </span>
          )}
        </div>
      )
    },
  },
  {
    label: 'Level',
    value: 'level',
    type: 'checkbox',
    defaultOpen: true,
    options: LEVELS.map((level) => ({ label: level, value: level })),
    component: (props: Option) => {
      // TODO: type `Option` with `options` values via Generics
      const value = props.value as (typeof LEVELS)[number]
      return (
        <div className="flex w-full max-w-28 items-center justify-between gap-2">
          <span className="capitalize text-foreground/70 group-hover:text-accent-foreground text-xs">
            {props.label}
          </span>
          <div className="flex items-center gap-2">
            <div className={cn('h-2.5 w-2.5 rounded-[2px]', getLevelColor(value).bg)} />
            <span className="text-xs text-muted-foreground/70">{getLevelLabel(value)}</span>
          </div>
        </div>
      )
    },
  },
  {
    label: 'Method',
    value: 'method',
    type: 'checkbox',
    defaultOpen: true,
    options: METHODS.map((method) => ({ label: method, value: method })),
    component: (props: Option) => {
      return (
        <span className="truncate block text-[0.75rem]" title={props.value as string}>
          {props.value}
        </span>
      )
    },
  },
  {
    label: 'Pathname',
    value: 'pathname',
    type: 'checkbox',
    defaultOpen: false,
    options: [],
    hasDynamicOptions: true,
    hasAsyncSearch: false,
    component: (props: Option) => {
      return (
        <span className="truncate block w-full text-[0.75rem]" title={props.value as string}>
          {props.value}
        </span>
      )
    },
  },
] satisfies DataTableFilterField<ColumnSchema>[]

export const sheetFields = [
  {
    id: 'id',
    label: 'Request ID',
    type: 'readonly',
    skeletonClassName: 'w-64',
  },
  {
    id: 'date',
    label: 'Date',
    type: 'timerange',
    component: (props) => {
      const date = new Date(props.date)
      const month = format(date, 'LLL')
      const day = format(date, 'dd')
      const year = format(date, 'y')
      const time = format(date, 'HH:mm:ss')

      return (
        <div className="font-mono whitespace-nowrap flex items-center gap-1 justify-end">
          <span>{month}</span>
          <span className="text-foreground/50">·</span>
          <span>{day}</span>
          <span className="text-foreground/50">·</span>
          <span>{year}</span>
          <span className="text-foreground/50">·</span>
          <span>{time}</span>
        </div>
      )
    },
    skeletonClassName: 'w-36',
  },
  {
    id: 'auth_user',
    label: 'Auth User',
    type: 'readonly',
    condition: (props) => Boolean(props.auth_user),
    component: (props) => (
      <div className="flex items-center gap-2">
        <User size={14} className="text-foreground-lighter" />
        <span className="font-mono">{props.auth_user}</span>
      </div>
    ),
    skeletonClassName: 'w-56',
  },
  {
    id: 'pathname',
    label: 'Pathname',
    type: 'input',
    skeletonClassName: 'w-56',
  },
] satisfies SheetField<ColumnSchema, LogsMeta>[]
