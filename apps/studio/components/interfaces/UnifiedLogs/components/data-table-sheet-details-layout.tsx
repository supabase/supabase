'use client'

import * as React from 'react'
import { DataTableSheetDetails } from 'components/interfaces/DataTableDemo/components/data-table/data-table-sheet/data-table-sheet-details'
import {
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui/src/components/shadcn/ui/tabs'
import { TraceDetailTab } from './trace-detail-tab'

interface DataTableSheetDetailsLayoutProps {
  title?: string
  titleClassName?: string
  hasTrace?: boolean
  traceId?: string
  children: React.ReactNode
}

export function DataTableSheetDetailsLayout({
  title,
  titleClassName,
  hasTrace,
  traceId,
  children,
}: DataTableSheetDetailsLayoutProps) {
  return (
    <DataTableSheetDetails title={title} titleClassName={titleClassName}>
      {hasTrace ? (
        <Tabs defaultValue="details" className="w-full h-full flex flex-col">
          <TabsList className="mb-2">
            <TabsTrigger value="details">Log Details</TabsTrigger>
            <TabsTrigger value="trace">Trace</TabsTrigger>
          </TabsList>

          <TabsContent
            value="details"
            className="flex-grow overflow-auto data-[state=active]:flex-grow"
          >
            {children}
          </TabsContent>

          <TabsContent
            value="trace"
            className="flex-grow overflow-auto data-[state=active]:flex-grow h-full mt-0"
          >
            <TraceDetailTab id={traceId} />
          </TabsContent>
        </Tabs>
      ) : (
        children
      )}
    </DataTableSheetDetails>
  )
}
