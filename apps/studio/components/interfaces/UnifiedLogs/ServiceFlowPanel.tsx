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
  cn,
} from 'ui'
import {
  MemoizedEdgeFunctionBlock,
  MemoizedGoTrueBlock,
  MemoizedNetworkBlock,
  MemoizedPostgRESTBlock,
  MemoizedPostgresBlock,
  MemoizedStorageBlock,
} from './ServiceFlow/components/ServiceBlocks'
import { ServiceFlowHeader } from './ServiceFlow/components/ServiceFlowHeader'
import { MemoizedRequestStartedBlock } from './ServiceFlow/components/blocks/RequestStartedBlock'
import { MemoizedResponseCompletedBlock } from './ServiceFlow/components/blocks/ResponseCompletedBlock'
import { ColumnSchema } from './UnifiedLogs.schema'
import { QuerySearchParamsType, SearchParamsType } from './UnifiedLogs.types'

interface ServiceFlowPanelProps {
  selectedRow: ColumnSchema
  selectedRowKey: string
  searchParameters: QuerySearchParamsType
  search: SearchParamsType
}

export function ServiceFlowPanel({
  selectedRow,
  selectedRowKey,
  searchParameters,
  search,
}: ServiceFlowPanelProps) {
  const { table, filterFields } = useDataTable()
  const { ref: projectRef } = useParams()
  const [activeTab, setActiveTab] = useState('service-flow')

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
  } = useUnifiedLogInspectionQuery(
    {
      projectRef: projectRef,
      logId: selectedRow?.id,
      type: serviceFlowType,
      search: searchParameters,
    },
    {
      enabled: Boolean(projectRef) && Boolean(selectedRow?.id) && Boolean(serviceFlowType),
    }
  )

  // Prepare JSON data for Raw JSON tab
  const jsonData =
    shouldShowServiceFlow && serviceFlowData?.result?.[0] ? serviceFlowData.result[0] : selectedRow

  if (selectedRowKey) {
    return (
      <>
        <ResizableHandle withHandle className="z-10" />
        <ResizablePanel
          id="log-sidepanel"
          order={2}
          defaultSize={1}
          maxSize={40}
          className={cn(
            'bg-dash-sidebar',
            'z-40',
            'border-l fixed right-0 top-0 bottom-0',
            'md:absolute md:h-auto',
            // ' md:w-3/4',
            'xl:z-[1]',
            'min-w-[28rem] max-w-[45rem]',
            'xl:relative xl:border-l-0'
          )}
        >
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
                                    filterFields={filterFields}
                                    table={table}
                                  />
                                </>
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
              </Tabs>
            </div>
          </div>
        </ResizablePanel>
      </>
    )
  }

  return null
}
