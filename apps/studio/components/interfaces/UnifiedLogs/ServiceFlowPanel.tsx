import { useParams } from 'common'
import { useDataTable } from 'components/ui/DataTable/providers/DataTableProvider'
import {
  ServiceFlowType,
  useUnifiedLogInspectionQuery,
} from 'data/logs/unified-log-inspection-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useState } from 'react'
import {
  cn,
  CodeBlock,
  ResizableHandle,
  ResizablePanel,
  Skeleton,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'

import { MemoizedRequestStartedBlock } from './ServiceFlow/components/blocks/RequestStartedBlock'
import { MemoizedResponseCompletedBlock } from './ServiceFlow/components/blocks/ResponseCompletedBlock'
import {
  MemoizedEdgeFunctionBlock,
  MemoizedGoTrueBlock,
  MemoizedNetworkBlock,
  MemoizedPostgresBlock,
  MemoizedPostgRESTBlock,
  MemoizedStorageBlock,
} from './ServiceFlow/components/ServiceBlocks'
import { ServiceFlowHeader } from './ServiceFlow/components/ServiceFlowHeader'
import { ColumnSchema } from './UnifiedLogs.schema'
import { QuerySearchParamsType } from './UnifiedLogs.types'

interface ServiceFlowPanelProps {
  selectedRow: ColumnSchema
  selectedRowKey: string
  searchParameters: QuerySearchParamsType
}

export function ServiceFlowPanel({
  selectedRow,
  selectedRowKey,
  searchParameters,
}: ServiceFlowPanelProps) {
  const { table, filterFields } = useDataTable()
  const { ref: projectRef } = useParams()
  const [activeTab, setActiveTab] = useState('service-flow')

  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])

  const logType = selectedRow?.log_type
  const serviceFlowType: ServiceFlowType | undefined =
    logType === 'edge function' ? 'edge-function' : (logType as ServiceFlowType)
  const shouldShowServiceFlow = !!serviceFlowType

  // Query the logs API directly
  const {
    data: serviceFlowData,
    isPending: isLoading,
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

  const formattedJsonData =
    !logsMetadata && 'raw_log_data' in jsonData && 'metadata' in jsonData.raw_log_data
      ? {
          ...jsonData,
          raw_log_data: { ...jsonData.raw_log_data, metadata: undefined },
        }
      : jsonData

  if (selectedRowKey) {
    return (
      <>
        <ResizableHandle withHandle className="z-10" />
        <ResizablePanel
          id="log-sidepanel"
          minSize={448}
          maxSize={720}
          className={cn(
            'bg-dash-sidebar',
            'z-40',
            'border-l fixed right-0 top-0 bottom-0',
            'md:absolute md:h-auto',
            // ' md:w-3/4',
            'xl:z-[1]',
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
                          {serviceFlowType === 'postgres' ? (
                            // Postgres flows: Connection Started -> Postgres -> Response
                            <>
                              <MemoizedRequestStartedBlock data={selectedRow} />

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
                              <MemoizedRequestStartedBlock data={selectedRow} />

                              <MemoizedNetworkBlock
                                data={selectedRow}
                                enrichedData={serviceFlowData?.result?.[0]}
                                isLoading={isLoading}
                                filterFields={filterFields}
                                table={table}
                              />

                              {serviceFlowType === 'auth' ? (
                                <MemoizedGoTrueBlock
                                  data={selectedRow}
                                  enrichedData={serviceFlowData?.result?.[0]}
                                  isLoading={isLoading}
                                  filterFields={filterFields}
                                  table={table}
                                />
                              ) : serviceFlowType === 'edge-function' ? (
                                <MemoizedEdgeFunctionBlock
                                  data={selectedRow}
                                  enrichedData={serviceFlowData?.result?.[0]}
                                  isLoading={isLoading}
                                  filterFields={filterFields}
                                  table={table}
                                />
                              ) : serviceFlowType === 'storage' ? (
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
                    {JSON.stringify(formattedJsonData, null, 2)}
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
