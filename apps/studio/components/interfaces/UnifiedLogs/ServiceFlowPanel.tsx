import { Table } from '@tanstack/react-table'
import { useState } from 'react'

import { useParams } from 'common'
import { useDataTable } from 'components/ui/DataTable/providers/DataTableProvider'
import { ServiceFlowType, useUnifiedLogInspectionQuery } from 'data/logs'
import {
  CodeBlock,
  ResizableHandle,
  ResizablePanel,
  Skeleton,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { MemoizedDataTableSheetContent } from './components/DataTableSheetContent'
import { ServiceFlowHeader } from './ServiceFlow/components/ServiceFlowHeader'
import {
  MemoizedEdgeFunctionBlock,
  MemoizedGoTrueBlock,
  MemoizedNetworkBlock,
  MemoizedPostgRESTBlock,
  MemoizedPostgresBlock,
  MemoizedRequestStartedBlock,
  MemoizedResponseCompletedBlock,
  MemoizedStorageBlock,
} from './ServiceFlow/ServiceFlowBlocks'
import { sheetFields } from './UnifiedLogs.fields'
import { ColumnSchema } from './UnifiedLogs.schema'
import { LogsMeta } from './UnifiedLogs.types'

// Debug flag for console logs - set to true for debugging
const DEBUG_SERVICE_FLOW = false

interface ServiceFlowPanelProps {
  selectedRow: any
  selectedRowKey: string
  searchParameters: any
  search: any // Raw search object to get logId
}

export function ServiceFlowPanel({
  selectedRow,
  selectedRowKey,
  searchParameters,
  search,
}: ServiceFlowPanelProps) {
  const { table, filterFields, totalRows } = useDataTable()
  const { ref: projectRef } = useParams()
  const [activeTab, setActiveTab] = useState('service-flow')

  // Get all metadata values from the table/provider
  const totalDBRowCount = totalRows ?? 0
  const filterDBRowCount = table.getCoreRowModel().flatRows.length
  const totalFetched = table.getCoreRowModel().flatRows.length
  const currentPercentiles = { 50: 0, 75: 0, 90: 0, 95: 0, 99: 0 } // Empty percentiles since not used in UI

  // WORKAROUND: Use the real database logId from search params instead of fabricated selectedRow.id
  // This is needed because we create fake UUIDs to handle repeated logs issue
  // TODO: Remove once repeated logs issue is fixed - should use selectedRow.id directly
  const realLogId = selectedRow?.id

  if (DEBUG_SERVICE_FLOW) {
    console.log('🔍 Log ID extraction debug:', {
      'selectedRow.uuid_id': selectedRow?.uuid_id,
      'selectedRow.id': selectedRow?.id,
      'final realLogId': realLogId,
      'full search object': search,
      'full searchParameters object': searchParameters,
    })
  }

  // Helper function to map log_type to service flow type
  const getServiceFlowType = (logType: string): ServiceFlowType | undefined => {
    switch (logType) {
      case 'auth':
        return 'auth'
      case 'edge function':
        return 'edge-function'
      case 'storage':
        return 'storage'
      case 'postgrest':
        return 'postgrest'
      case 'postgres':
        return 'postgres'
      default:
        return undefined
    }
  }

  // Determine service flow type based on log_type
  const logType = selectedRow?.log_type
  const serviceFlowType = getServiceFlowType(logType)
  const shouldShowServiceFlow = serviceFlowType !== undefined

  // Individual flow type checks for conditional rendering
  const isPostgrestFlow = serviceFlowType === 'postgrest'
  const isAuthFlow = serviceFlowType === 'auth'
  const isEdgeFunctionFlow = serviceFlowType === 'edge-function'
  const isStorageFlow = serviceFlowType === 'storage'
  const isPostgresFlow = serviceFlowType === 'postgres'

  // Query the logs API directly
  const {
    data: serviceFlowData,
    isLoading,
    error,
  } = useUnifiedLogInspectionQuery({
    projectRef: projectRef,
    logId: realLogId,
    type: serviceFlowType,
    search: searchParameters,
  })

  if (DEBUG_SERVICE_FLOW) {
    console.log('🔍 Service Flow Panel:', {
      selectedRow,
      selectedRowKey,
      selectedRowId: selectedRow?.id,
      logId: searchParameters?.logId,
      originalLogId: selectedRow?.original_log_id,
      selectedRowPathname: selectedRow?.pathname,
      selectedRowFullObject: selectedRow,
      shouldShowServiceFlow,
      isPostgrestFlow,
      isAuthFlow,
      isEdgeFunctionFlow,
      isStorageFlow,
      isPostgresFlow,
      serviceFlowType,
      serviceFlowData,
      isLoading,
      error,
    })
  }

  // Log the enriched service flow data
  if (DEBUG_SERVICE_FLOW) {
    if (serviceFlowData?.result?.[0]) {
      console.log('📋 Service Flow Enriched Data:', serviceFlowData.result[0])
      console.log('🔍 raw_log_data exists?', !!serviceFlowData.result[0].raw_log_data)
      console.log('🔍 raw_log_data value:', serviceFlowData.result[0].raw_log_data)
    }

    // Log the raw log data if available
    if (serviceFlowData?.result?.[0]?.raw_log_data) {
      console.log('🗂️ Complete Raw Log Data:', serviceFlowData.result[0].raw_log_data)
    }
  }

  // Prepare JSON data for Raw JSON tab
  const jsonData =
    shouldShowServiceFlow && serviceFlowData?.result?.[0] ? serviceFlowData.result[0] : selectedRow

  if (selectedRowKey) {
    return (
      <>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={45} minSize={45}>
          <div className="h-full overflow-auto">
            {/* Service Flow Header with navigation */}
            <ServiceFlowHeader
              selectedRow={selectedRow}
              enrichedData={serviceFlowData?.result?.[0]}
            />

            <div className="relative">
              <Tabs
                defaultValue="service-flow"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full h-full flex flex-col pt-2"
              >
                <TabsList className="flex gap-3 px-5">
                  {shouldShowServiceFlow && (
                    <TabsTrigger value="service-flow">Overview</TabsTrigger>
                  )}
                  <TabsTrigger value="raw-json">Raw JSON</TabsTrigger>
                  <TabsTrigger value="log-details">Log Details</TabsTrigger>
                </TabsList>

                {shouldShowServiceFlow && (
                  <TabsContent value="service-flow">
                    <div className="p-4">
                      {error ? (
                        <div className="text-center py-8 text-destructive">
                          Error: {error.toString()}
                        </div>
                      ) : (
                        <>
                          {isPostgresFlow ? (
                            // Postgres flows: Connection Started -> Postgres -> Response
                            <>
                              <MemoizedRequestStartedBlock
                                data={selectedRow}
                                enrichedData={serviceFlowData?.result?.[0]}
                              />

                              <MemoizedPostgresBlock
                                data={selectedRow}
                                enrichedData={serviceFlowData?.result?.[0]}
                                isLoading={isLoading}
                                isLast={false}
                                filterFields={filterFields}
                                table={table}
                              />

                              <MemoizedResponseCompletedBlock
                                data={selectedRow}
                                enrichedData={serviceFlowData?.result?.[0]}
                              />
                            </>
                          ) : (
                            // HTTP-based flows: Request Started -> Network -> Service -> Response
                            <>
                              <MemoizedRequestStartedBlock
                                data={selectedRow}
                                enrichedData={serviceFlowData?.result?.[0]}
                              />

                              <MemoizedNetworkBlock
                                data={selectedRow}
                                enrichedData={serviceFlowData?.result?.[0]}
                                isLoading={isLoading}
                                filterFields={filterFields}
                                table={table}
                              />

                              {isAuthFlow ? (
                                <MemoizedGoTrueBlock
                                  data={selectedRow}
                                  enrichedData={serviceFlowData?.result?.[0]}
                                  isLoading={isLoading}
                                  filterFields={filterFields}
                                  table={table}
                                />
                              ) : isEdgeFunctionFlow ? (
                                <MemoizedEdgeFunctionBlock
                                  data={selectedRow}
                                  enrichedData={serviceFlowData?.result?.[0]}
                                  isLoading={isLoading}
                                  filterFields={filterFields}
                                  table={table}
                                />
                              ) : isStorageFlow ? (
                                <MemoizedStorageBlock
                                  data={selectedRow}
                                  enrichedData={serviceFlowData?.result?.[0]}
                                  isLoading={isLoading}
                                  filterFields={filterFields}
                                  table={table}
                                />
                              ) : (
                                <MemoizedPostgRESTBlock
                                  data={selectedRow}
                                  enrichedData={serviceFlowData?.result?.[0]}
                                  isLoading={isLoading}
                                  filterFields={filterFields}
                                  table={table}
                                />
                              )}

                              <MemoizedResponseCompletedBlock
                                data={selectedRow}
                                enrichedData={serviceFlowData?.result?.[0]}
                              />
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="raw-json" className="flex-grow overflow-auto">
                  {isLoading && shouldShowServiceFlow && (
                    <div className="flex items-center gap-3 text-foreground-light p-3 bg-surface-100 border-b border-border">
                      <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
                      <span className="text-sm">Enriching log...</span>
                    </div>
                  )}
                  <CodeBlock
                    language="json"
                    className="max-h-[800px] overflow-auto border-none rounded-none [&_pre]:!leading-tight [&_code]:!leading-tight"
                  >
                    {JSON.stringify(jsonData, null, 2)}
                  </CodeBlock>
                </TabsContent>

                <TabsContent value="log-details" className="flex-grow overflow-auto px-5">
                  <MemoizedDataTableSheetContent<ColumnSchema, LogsMeta>
                    table={table as Table<ColumnSchema>}
                    data={selectedRow}
                    filterFields={filterFields}
                    fields={sheetFields}
                    metadata={{
                      totalRows: totalDBRowCount,
                      filterRows: filterDBRowCount,
                      totalRowsFetched: totalFetched,
                      currentPercentiles: currentPercentiles,
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ResizablePanel>
      </>
    )
  }

  return null
}
