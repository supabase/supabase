import { format } from 'date-fns'
import { User } from 'lucide-react'

import type {
  DataTableFilterField,
  Option,
  SheetField,
} from 'components/interfaces/DataTableDemo/components/data-table/types'
import { LEVELS } from 'components/interfaces/DataTableDemo/constants/levels'
import { METHODS } from 'components/interfaces/DataTableDemo/constants/method'
import { getLevelColor, getLevelLabel } from 'components/interfaces/DataTableDemo/lib/request/level'
import { getStatusColor } from 'components/interfaces/DataTableDemo/lib/request/status-code'
import { cn } from 'ui'

// custom imports
import { TraceButton } from './components/trace-button'
import type { LogsMeta } from './query-options'
import { type ColumnSchema, LOG_TYPES } from './UnifiedLogs.schema'

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
    label: 'Level',
    value: 'level',
    type: 'checkbox',
    defaultOpen: true,
    options: LEVELS.map((level) => ({ label: level, value: level })),
    component: (props: Option) => {
      // TODO: type `Option` with `options` values via Generics
      const value = props.value as (typeof LEVELS)[number]
      return (
        <div className="flex w-full max-w-28 items-center justify-between gap-2 font-mono">
          <span className="capitalize text-foreground/70 group-hover:text-accent-foreground">
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
    label: 'Log Type',
    value: 'log_type',
    type: 'checkbox',
    defaultOpen: true,
    options: LOG_TYPES.map((type) => ({ label: type, value: type })),
    component: (props: Option) => {
      return (
        <div className="flex w-full items-center justify-between gap-2 font-mono">
          <span className="capitalize text-foreground/70 group-hover:text-accent-foreground">
            {props.label}
          </span>
          <span className="text-xs text-muted-foreground/70">{props.value}</span>
        </div>
      )
    },
  },
  {
    label: 'Host',
    value: 'host',
    type: 'input',
  },
  {
    label: 'Pathname',
    value: 'pathname',
    type: 'input',
  },
  {
    label: 'Auth User',
    value: 'auth_user',
    type: 'input',
  },
  {
    label: 'Status Code',
    value: 'status',
    type: 'checkbox',
    options: [
      { label: '200', value: 200 },
      { label: '400', value: 400 },
      { label: '404', value: 404 },
      { label: '500', value: 500 },
    ], // REMINDER: this is a placeholder to set the type in the client.tsx
    component: (props: Option) => {
      if (typeof props.value === 'boolean') return null
      if (typeof props.value === 'undefined') return null
      if (typeof props.value === 'string') return null
      return (
        <span className={cn('font-mono', getStatusColor(props.value).text)}>{props.value}</span>
      )
    },
  },
  {
    label: 'Method',
    value: 'method',
    type: 'checkbox',
    options: METHODS.map((region) => ({ label: region, value: region })),
    component: (props: Option) => {
      return <span className="font-mono">{props.value}</span>
    },
  },
  // {
  //   label: 'Regions',
  //   value: 'regions',
  //   type: 'checkbox',
  //   options: REGIONS.map((region) => ({ label: region, value: region })),
  //   component: (props: Option) => {
  //     return <span className="font-mono">{props.value}</span>
  //   },
  // },
  // Commenting out latency field as it's not in the schema
  // {
  //   label: 'Latency',
  //   value: 'latency',
  //   type: 'slider',
  //   min: 0,
  //   max: 5000,
  // },
] satisfies DataTableFilterField<ColumnSchema>[]

export const sheetFields = [
  {
    id: 'uuid',
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
        <div className="font-mono whitespace-nowrap flex items-center gap-1">
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
    id: 'has_trace',
    label: 'Trace',
    type: 'readonly',
    condition: (props) => Boolean(props.has_trace),
    component: (props) => <TraceButton has_trace={Boolean(props.has_trace)} id={props.id} />,
    className: 'flex-row items-end justify-end w-full',
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
  // {
  //   id: 'logs',
  //   label: 'Logs',
  //   type: 'readonly',
  //   component: (props) => <pre className="text-xs p-2">{JSON.stringify(props.logs, null, 2)}</pre>,
  //   skeletonClassName: 'w-full',
  // },
  {
    id: 'status',
    label: 'Status',
    type: 'checkbox',
    component: (props) => {
      return (
        <span className={cn('font-mono', getStatusColor(props.status).text)}>{props.status}</span>
      )
    },
    skeletonClassName: 'w-12',
  },
  {
    id: 'method',
    label: 'Method',
    type: 'checkbox',
    component: (props) => {
      return <span className="font-mono">{props.method}</span>
    },
    skeletonClassName: 'w-10',
  },
  {
    id: 'host',
    label: 'Host',
    type: 'input',
    skeletonClassName: 'w-24',
  },
  {
    id: 'pathname',
    label: 'Pathname',
    type: 'input',
    skeletonClassName: 'w-56',
  },
  // {
  //   id: 'regions',
  //   label: 'Regions',
  //   type: 'checkbox',
  //   skeletonClassName: 'w-12',
  //   component: (props) => <DataTableColumnRegion value={props.regions[0]} reverse showFlag />,
  // },
  // Commenting out latency field as it's not in the schema
  // {
  //   id: 'latency',
  //   label: 'Latency',
  //   type: 'slider',
  //   component: (props) => (
  //     <>
  //       {formatMilliseconds(props.latency)}
  //       <span className="text-muted-foreground">ms</span>
  //     </>
  //   ),
  //   skeletonClassName: 'w-16',
  // },
  // Commenting out headers field as it's not in the schema
  // {
  //   id: 'headers',
  //   label: 'Headers',
  //   type: 'readonly',
  //   component: (props) => (
  //     // REMINDER: negative margin to make it look like the header is on the same level of the tab triggers
  //     <KVTabs data={props.headers} className="-mt-[22px]" />
  //   ),
  //   className: 'flex-col items-start w-full gap-1',
  // },
  // Commenting out message field as it's not in the schema
  // {
  //   id: 'message',
  //   label: 'Message',
  //   type: 'readonly',
  //   condition: (props) => props.message !== undefined,
  //   component: (props) => (
  //     <CopyToClipboardContainer variant="destructive">
  //       {JSON.stringify(props.message, null, 2)}
  //     </CopyToClipboardContainer>
  //   ),
  //   className: 'flex-col items-start w-full gap-1',
  // },
] satisfies SheetField<ColumnSchema, LogsMeta>[]
