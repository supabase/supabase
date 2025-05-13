'use client'

import * as React from 'react'
import { TraceDetailTab } from './trace-detail-tab'
import { DataTableSheetDetails } from 'components/interfaces/DataTableDemo/components/data-table/data-table-sheet/data-table-sheet-details'
import {
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  cn,
} from 'ui'
import { MemoizedDataTableSheetContent } from './data-table-sheet-content'
import { Table } from '@tanstack/react-table'
import {
  DataTableFilterField,
  SheetField,
} from 'components/interfaces/DataTableDemo/components/data-table/types'

interface LogDetailsTabProps<TData, TMeta> {
  table: Table<TData>
  data?: TData
  filterFields: DataTableFilterField<TData>[]
  fields: SheetField<TData, TMeta>[]
  metadata?: TMeta & {
    totalRows: number
    filterRows: number
    totalRowsFetched: number
  }
}

export function LogDetailsTab<TData, TMeta>({
  table,
  data,
  filterFields,
  fields,
  metadata,
}: LogDetailsTabProps<TData, TMeta>) {
  return (
    <MemoizedDataTableSheetContent
      table={table}
      data={data}
      filterFields={filterFields}
      fields={fields}
      metadata={metadata}
    />
  )
}

interface TabbedDetailPanelProps<TData extends { has_trace?: boolean; id: string }, TMeta> {
  title?: string
  titleClassName?: string
  table: Table<TData>
  data?: TData
  filterFields: DataTableFilterField<TData>[]
  fields: SheetField<TData, TMeta>[]
  metadata?: TMeta & {
    totalRows: number
    filterRows: number
    totalRowsFetched: number
  }
}

export function TabbedDetailPanel<TData extends { has_trace?: boolean; id: string }, TMeta>({
  title,
  titleClassName,
  table,
  data,
  filterFields,
  fields,
  metadata,
}: TabbedDetailPanelProps<TData, TMeta>) {
  // Check if the data has a trace
  const hasTrace = data?.has_trace

  return (
    <DataTableSheetDetails title={title} titleClassName={titleClassName}>
      <Tabs defaultValue="details" className="w-full h-full flex flex-col">
        <TabsList className="mb-2">
          <TabsTrigger value="details">Log Details</TabsTrigger>
          {hasTrace && <TabsTrigger value="trace">Trace</TabsTrigger>}
        </TabsList>

        <TabsContent
          value="details"
          className="flex-grow overflow-auto data-[state=active]:flex-grow"
        >
          <LogDetailsTab
            table={table}
            data={data}
            filterFields={filterFields}
            fields={fields}
            metadata={metadata}
          />
        </TabsContent>

        {hasTrace && (
          <TabsContent
            value="trace"
            className="flex-grow overflow-auto data-[state=active]:flex-grow h-full mt-0"
          >
            <TraceDetailTab id={data?.id} />
          </TabsContent>
        )}
      </Tabs>
    </DataTableSheetDetails>
  )
}
