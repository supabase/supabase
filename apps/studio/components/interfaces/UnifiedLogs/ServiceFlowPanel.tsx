import { useParams } from 'common'
import { useState } from 'react'
import {
  cn,
  ResizableHandle,
  ResizablePanel,
  Skeleton,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { PostgresFlowDetail } from './ServiceFlow/components/blocks/PostgresFlowDetail'
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
import { ServiceFlowPanelControls } from './ServiceFlow/components/ServiceFlowPanelControls'
import { ColumnSchema } from './UnifiedLogs.schema'
import { QuerySearchParamsType } from './UnifiedLogs.types'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import {
  ServiceFlowType,
  useUnifiedLogInspectionQuery,
} from '@/data/logs/unified-log-inspection-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

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
  const [activeTab, setActiveTab] = useState('overview')

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
          defaultSize={45}
          minSize={400}
          maxSize={400}
          className={cn('bg-dash-sidebar border-t')}
        >
          <div className="flex h-full flex-col overflow-hidden">
            <Tabs
              defaultValue={shouldShowServiceFlow ? 'overview' : 'raw-json'}
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex h-full w-full flex-col"
            >
              <div className="flex items-center justify-between px-4">
                <TabsList className="flex h-auto gap-x-4 rounded-none !border-none">
                  {shouldShowServiceFlow && (
                    <TabsTrigger
                      value="overview"
                      className="border-b-[1px] py-3 font-mono text-xs uppercase"
                    >
                      Overview
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="raw-json"
                    className="border-b-[1px] py-3 font-mono text-xs uppercase"
                  >
                    Raw JSON
                  </TabsTrigger>
                </TabsList>
                <ServiceFlowPanelControls />
              </div>

              {shouldShowServiceFlow && (
                <TabsContent value="overview" className="mt-0 grow overflow-auto">
                  {error ? (
                    <div className="py-8 text-center text-destructive">
                      Error: {error.toString()}
                    </div>
                  ) : serviceFlowType === 'postgres' ? (
                    <PostgresFlowDetail
                      data={selectedRow}
                      enrichedData={serviceFlowData?.result?.[0]}
                      isLoading={isLoading}
                      filterFields={filterFields}
                      table={table}
                    />
                  ) : (
                    <div className="p-4">
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
                    </div>
                  )}
                </TabsContent>
              )}

              <TabsContent value="raw-json" className="mt-0 grow overflow-auto">
                {isLoading && shouldShowServiceFlow && (
                  <div className="flex items-center gap-3 border-b border-border bg-surface-100 p-3 text-foreground-light">
                    <Skeleton className="h-4 w-4 animate-pulse rounded-full" />
                    <span className="text-sm">Enriching log...</span>
                  </div>
                )}
                <CodeBlock
                  language="json"
                  className="max-h-[800px] overflow-auto rounded-none border-none [&_code]:!leading-tight [&_pre]:!leading-tight"
                >
                  {JSON.stringify(formattedJsonData, null, 2)}
                </CodeBlock>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </>
    )
  }

  return null
}
