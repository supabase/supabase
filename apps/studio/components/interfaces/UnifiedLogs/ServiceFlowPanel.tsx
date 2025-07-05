import { useState } from 'react'

import { Table } from '@tanstack/react-table'

// Debug flag for console logs - set to true for debugging
const DEBUG_SERVICE_FLOW = false
import { useParams } from 'common'
import { DataTableSheetDetails } from 'components/ui/DataTable/DataTableSheetDetails'
import { useDataTable } from 'components/ui/DataTable/providers/DataTableProvider'
import { useUnifiedLogInspectionQuery, ServiceFlowType } from 'data/logs'
import {
  ResizableHandle,
  ResizablePanel,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
  Button,
} from 'ui'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { MonacoEditor } from 'components/grid/components/common/MonacoEditor'
import { MemoizedDataTableSheetContent } from './components/DataTableSheetContent'
import { sheetFields } from './UnifiedLogs.fields'
import { ColumnSchema } from './UnifiedLogs.schema'
import { LogsMeta } from './UnifiedLogs.types'
import {
  MemoizedRequestStartedBlock,
  MemoizedNetworkBlock,
  MemoizedPostgRESTBlock,
  MemoizedGoTrueBlock,
  MemoizedEdgeFunctionBlock,
  MemoizedStorageBlock,
  MemoizedPostgresBlock,
  MemoizedResponseCompletedBlock,
} from './ServiceFlow/ServiceFlowBlocks'
// import { useServiceFlowData, shouldShowServiceFlow } from './ServiceFlow.queries'
// import { ServiceFlowPanel as EnhancedServiceFlowPanel } from './ServiceFlow/components/ServiceFlowPanel'

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
  const [activeTab, setActiveTab] = useState('details')

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

    console.log('🔍 Raw selectedRow fields:', Object.keys(selectedRow || {}))
    console.log('🔍 selectedRow.id value:', selectedRow?.id, 'type:', typeof selectedRow?.id)
    console.log('🔍 realLogId value:', selectedRow?.log_id, 'type:', typeof selectedRow?.log_id)
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

  if (selectedRowKey) {
    return (
      <>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={45} minSize={45}>
          <div className="h-full overflow-auto">
            <DataTableSheetDetails
              title={selectedRow?.original?.pathname}
              titleClassName="font-mono text-sm"
            >
              <Tabs
                defaultValue="details"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full h-full flex flex-col pt-2"
              >
                <TabsList className="flex gap-3 px-5">
                  <TabsTrigger value="details">Log Details</TabsTrigger>
                  {shouldShowServiceFlow && (
                    <TabsTrigger value="service-flow">Service Flow</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent
                  value="details"
                  className="flex-grow overflow-auto data-[state=active]:flex-grow px-5"
                >
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

                  {/* JSON Viewer Section */}
                  <div className="mt-6 border-t border-border pt-4">
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button
                          type="text"
                          size="tiny"
                          className="w-full justify-start p-0 h-auto text-sm font-medium text-foreground-light hover:text-foreground mb-3 group"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                            <span>View Full Log Data (JSON)</span>
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                        <div className="space-y-4">
                          {/* ALWAYS show enriched data sections for ALL log types */}

                          {/* Complete Enriched Data - Show service flow data if available, otherwise show selected row */}
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">
                              Complete Enriched Data
                            </h4>
                            <div className="border border-border rounded-lg overflow-hidden">
                              <MonacoEditor
                                readOnly
                                language="json"
                                value={JSON.stringify(
                                  shouldShowServiceFlow && serviceFlowData?.result?.[0]
                                    ? serviceFlowData.result[0]
                                    : selectedRow,
                                  null,
                                  2
                                )}
                                height="500px"
                                onChange={() => {}}
                              />
                            </div>
                          </div>

                          {/* Raw Log Data Field - Show if service flow has it, otherwise show event_message */}
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">
                              Raw Log Data Field
                            </h4>
                            <div className="border border-border rounded-lg overflow-hidden">
                              <MonacoEditor
                                readOnly
                                language="json"
                                value={
                                  shouldShowServiceFlow &&
                                  serviceFlowData?.result?.[0]?.raw_log_data
                                    ? JSON.stringify(
                                        serviceFlowData.result[0].raw_log_data,
                                        null,
                                        2
                                      )
                                    : selectedRow?.event_message
                                      ? typeof selectedRow.event_message === 'string'
                                        ? selectedRow.event_message
                                        : JSON.stringify(selectedRow.event_message, null, 2)
                                      : JSON.stringify(
                                          { message: 'No raw log data or event message available' },
                                          null,
                                          2
                                        )
                                }
                                height="500px"
                                onChange={() => {}}
                              />
                            </div>
                          </div>

                          {/* Original Selected Row - ALWAYS show */}
                          <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">
                              Original Selected Row
                            </h4>
                            <div className="border border-border rounded-lg overflow-hidden">
                              <MonacoEditor
                                readOnly
                                language="json"
                                value={JSON.stringify(selectedRow, null, 2)}
                                height="500px"
                                onChange={() => {}}
                              />
                            </div>
                          </div>

                          {/* Debug Info - Service Flow Query Results */}
                          {shouldShowServiceFlow && (
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">
                                Service Flow Query Debug ({serviceFlowType})
                              </h4>
                              <div className="border border-border rounded-lg overflow-hidden">
                                <MonacoEditor
                                  readOnly
                                  language="json"
                                  value={JSON.stringify(
                                    {
                                      isLoading,
                                      error: error?.toString(),
                                      hasResults: !!serviceFlowData?.result?.[0],
                                      resultCount: serviceFlowData?.result?.length || 0,
                                      queryType: serviceFlowType,
                                      logId: realLogId,
                                      rawResponse: serviceFlowData,
                                    },
                                    null,
                                    2
                                  )}
                                  height="300px"
                                  onChange={() => {}}
                                />
                              </div>
                            </div>
                          )}

                          {/* Metadata - Show if available */}
                          {selectedRow?.metadata && (
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">Metadata</h4>
                              <div className="border border-border rounded-lg overflow-hidden">
                                <MonacoEditor
                                  readOnly
                                  language="json"
                                  value={JSON.stringify(selectedRow.metadata, null, 2)}
                                  height="300px"
                                  onChange={() => {}}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </TabsContent>

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
                            // Postgres flows: Connection Started -> Postgres -> Operation Completed
                            <>
                              <MemoizedRequestStartedBlock
                                data={selectedRow}
                                enrichedData={serviceFlowData?.result?.[0]}
                              />

                              <MemoizedPostgresBlock
                                data={selectedRow}
                                enrichedData={serviceFlowData?.result?.[0]}
                                isLoading={isLoading}
                                isLast={true}
                                filterFields={filterFields}
                                table={table}
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
                                <>
                                  <MemoizedPostgRESTBlock
                                    data={selectedRow}
                                    enrichedData={serviceFlowData?.result?.[0]}
                                    isLoading={isLoading}
                                    filterFields={filterFields}
                                    table={table}
                                  />

                                  <MemoizedPostgresBlock
                                    data={selectedRow}
                                    enrichedData={serviceFlowData?.result?.[0]}
                                    isLoading={isLoading}
                                    isLast={false}
                                    filterFields={filterFields}
                                    table={table}
                                  />
                                </>
                              )}

                              <MemoizedResponseCompletedBlock data={selectedRow} />
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </DataTableSheetDetails>
          </div>
        </ResizablePanel>
      </>
    )
  }
}
