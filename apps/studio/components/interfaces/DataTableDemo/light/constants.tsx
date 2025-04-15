'use client'

import { CopyToClipboardContainer } from 'components/interfaces/DataTableDemo/components/custom/copy-to-clipboard-container'
import { KVTabs } from 'components/interfaces/DataTableDemo/components/custom/kv-tabs'
import { DataTableColumnLatency } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-latency'
import { DataTableColumnLevelIndicator } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-level-indicator'
import { DataTableColumnRegion } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-region'
import { DataTableColumnStatusCode } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-status-code'
import type {
  DataTableFilterField,
  Option,
  SheetField,
} from 'components/interfaces/DataTableDemo/components/data-table/types'
import { _LEVELS, LEVELS } from 'components/interfaces/DataTableDemo/constants/levels'
import { METHODS } from 'components/interfaces/DataTableDemo/constants/method'
import { VERCEL_EDGE_REGIONS } from 'components/interfaces/DataTableDemo/constants/region'
import { isJSON } from 'components/interfaces/DataTableDemo/lib/is-json'
import { getLevelLabel } from 'components/interfaces/DataTableDemo/lib/request/level'
import { format } from 'date-fns'
import type { ColumnType } from './columns'

export const filterFields = [
  {
    label: 'Time Range',
    value: 'timestamp',
    type: 'timerange',
    defaultOpen: true,
    commandDisabled: true,
  },
  {
    label: 'Level',
    value: 'level',
    type: 'checkbox',
    defaultOpen: true,
    options: LEVELS.map((level) => ({ value: level, label: level })),
    component: (props: Option) => (
      <div className="flex items-center justify-between gap-2 font-mono md:w-[106px]">
        <div className="flex items-center gap-1">
          <DataTableColumnLevelIndicator value={props.value as (typeof _LEVELS)[number]} />
          <div className="capitalize text-foreground/70">{props.value}</div>
        </div>
        <div className="text-xs text-muted-foreground/70">
          {getLevelLabel(props.value as (typeof _LEVELS)[number])}
        </div>
      </div>
    ),
  },
  {
    label: 'URL',
    value: 'url',
    type: 'input',
  },
  {
    label: 'Status Code',
    value: 'status',
    type: 'checkbox',
    // REMINDER: will be injected by the client.tsx
    options: [
      { label: '200', value: 200 },
      { label: '400', value: 400 },
      { label: '500', value: 500 },
    ],
    component: (props: Option) => <DataTableColumnStatusCode value={props.value as number} />,
  },
  {
    label: 'Method',
    value: 'method',
    type: 'checkbox',
    // REMINDER: will be injected by the client.tsx
    options: METHODS.map((region) => ({ label: region, value: region })),
  },
  {
    label: 'Region',
    value: 'region',
    type: 'checkbox',
    options: VERCEL_EDGE_REGIONS.map((region) => ({
      label: region,
      value: region,
    })),
  },
  {
    label: 'Latency',
    value: 'latency',
    type: 'slider',
    min: 0,
    max: 5000,
    // REMINDER: will be injected by the client.tsx
    options: [{ label: '0', value: 0 }],
  },
] satisfies DataTableFilterField<ColumnType>[]

export const sheetFields = [
  {
    id: 'level',
    label: 'Level',
    type: 'checkbox',
    component: (props) => (
      <div className="flex items-center justify-end gap-1.5">
        <span className="capitalize">{props.level}</span>
        <DataTableColumnLevelIndicator value={props.level} />
      </div>
    ),
    skeletonClassName: 'w-2.5',
  },
  {
    id: 'timestamp',
    label: 'Timestamp',
    type: 'timerange',
    component: (props) => format(new Date(props.timestamp), 'LLL dd, y HH:mm:ss'),
    skeletonClassName: 'w-36',
  },
  {
    id: 'status',
    label: 'Status',
    type: 'checkbox',
    component: (props) => <DataTableColumnStatusCode value={props.status} />,
    skeletonClassName: 'w-12',
  },
  {
    id: 'method',
    label: 'Method',
    type: 'checkbox',
    skeletonClassName: 'w-10',
  },
  {
    id: 'url',
    label: 'URL',
    type: 'input',
    skeletonClassName: 'w-24',
  },
  {
    id: 'region',
    label: 'Region',
    type: 'checkbox',
    component: (props) => <DataTableColumnRegion value={props.region} reverse showFlag />,
    skeletonClassName: 'w-12',
  },
  {
    id: 'latency',
    label: 'Latency',
    type: 'slider',
    component: (props) => <DataTableColumnLatency value={props.latency} />,
    skeletonClassName: 'w-16',
  },
  {
    id: 'headers',
    label: 'Headers',
    type: 'readonly',
    condition: (props) => props.headers && JSON.parse(props.headers),
    component: (props) => (
      // REMINDER: negative margin to make it look like the header is on the same level of the tab triggers
      <KVTabs data={JSON.parse(props.headers)} className="-mt-[22px]" />
    ),
    className: 'flex-col items-start w-full gap-1',
  },
  {
    id: 'body',
    label: 'Body',
    type: 'readonly',
    condition: (props) => props.body !== undefined,
    component: (props) => (
      <CopyToClipboardContainer key={props.body} variant="default" maxHeight={200}>
        {isJSON(props.body) ? JSON.stringify(props.body, null, 2) : props.body}
      </CopyToClipboardContainer>
    ),
    className: 'flex-col items-start w-full gap-1',
  },
] satisfies SheetField<ColumnType, unknown>[]
