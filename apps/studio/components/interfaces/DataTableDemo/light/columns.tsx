'use client'

import { DataTableColumnLatency } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-latency'
import { DataTableColumnLevelIndicator } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-level-indicator'
import { DataTableColumnRegion } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-region'
import { DataTableColumnStatusCode } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-status-code'
import { DataTableColumnTimestamp } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-timestamp'
import { LEVELS } from 'components/interfaces/DataTableDemo/constants/levels'
import { VERCEL_EDGE_REGIONS } from 'components/interfaces/DataTableDemo/constants/region'
import type { ColumnDef } from '@tanstack/react-table'

export type ColumnType = {
  level: (typeof LEVELS)[number]
  url: string
  method: string
  status: number
  latency: number
  region: (typeof VERCEL_EDGE_REGIONS)[number]
  timestamp: number
  headers: string
  body: string
}

export const columns: ColumnDef<ColumnType>[] = [
  {
    accessorKey: 'level',
    header: '',
    cell: ({ row }) => {
      const level = row.getValue<ColumnType['level']>('level')
      return <DataTableColumnLevelIndicator value={level} />
    },
    enableHiding: false,
    enableResizing: false,
    filterFn: 'arrSome',
    size: 27,
    minSize: 27,
    maxSize: 27,
    meta: {
      headerClassName:
        'w-[--header-level-size] max-w-[--header-level-size] min-w-[--header-level-size]',
      cellClassName: 'w-[--col-level-size] max-w-[--col-level-size] min-w-[--col-level-size]',
    },
  },
  {
    accessorKey: 'timestamp',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue<ColumnType['timestamp']>('timestamp'))
      return <DataTableColumnTimestamp date={date} />
    },
    enableResizing: false,
    filterFn: 'inDateRange',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue<ColumnType['status']>('status')
      return <DataTableColumnStatusCode value={status} />
    },
    enableResizing: false,
    filterFn: 'arrSome',
  },
  {
    accessorKey: 'method',
    header: 'Method',
    enableResizing: false,
    filterFn: 'arrIncludesSome',
  },
  {
    accessorKey: 'url',
    header: 'URL',
    enableResizing: false,
    // meta: {
    //   cellClassName: "truncate max-w-[250px]",
    // },
  },
  {
    accessorKey: 'latency',
    header: 'Latency',
    cell: ({ row }) => {
      const latency = row.getValue<ColumnType['latency']>('latency')
      return <DataTableColumnLatency value={latency} />
    },
    enableResizing: false,
    filterFn: 'inNumberRange',
  },
  {
    accessorKey: 'region',
    header: 'Region',
    cell: ({ row }) => {
      const region = row.getValue<ColumnType['region']>('region')
      return <DataTableColumnRegion value={region} />
    },
    enableResizing: false,
    filterFn: 'arrIncludesSome',
  },
]
