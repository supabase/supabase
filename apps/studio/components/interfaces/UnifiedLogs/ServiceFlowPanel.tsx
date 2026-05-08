import { useParams } from 'common'
import { Check, Clock, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  Button,
  copyToClipboard,
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
import {
  MemoizedEdgeFunctionBlock,
  MemoizedGoTrueBlock,
  MemoizedNetworkBlock,
  MemoizedPostgresBlock,
  MemoizedPostgRESTBlock,
  MemoizedStorageBlock,
} from './ServiceFlow/components/ServiceBlocks'
import { ServiceFlowPanelControls } from './ServiceFlow/components/ServiceFlowPanelControls'
import { DetailSectionHeader } from './ServiceFlow/components/shared/DetailSection'
import { ColumnSchema } from './UnifiedLogs.schema'
import { QuerySearchParamsType } from './UnifiedLogs.types'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import {
  ServiceFlowType,
  useUnifiedLogInspectionQuery,
} from '@/data/logs/unified-log-inspection-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

interface ServiceFlowPanelProps {
  selectedRow?: ColumnSchema
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
  const [jsonCopied, setJsonCopied] = useState(false)
  const overviewScrollRef = useRef<HTMLDivElement>(null)
  const jsonScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    overviewScrollRef.current?.scrollTo({ top: 0 })
    jsonScrollRef.current?.scrollTo({ top: 0 })
  }, [selectedRowKey])

  const logType = selectedRow?.log_type
  const serviceFlowType: ServiceFlowType | undefined =
    logType === 'edge function' ? 'edge-function' : (logType as ServiceFlowType)
  const shouldShowServiceFlow = !!serviceFlowType

  useEffect(() => {
    if (!shouldShowServiceFlow && activeTab === 'overview') {
      setActiveTab('raw-json')
    }
  }, [shouldShowServiceFlow, activeTab])

  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])

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

  if (!selectedRowKey || !selectedRow) return null

  const timestampMs = selectedRow.timestamp
    ? selectedRow.timestamp / 1000
    : selectedRow.date
      ? selectedRow.date.getTime()
      : null
  const formattedTime = timestampMs ? new Date(timestampMs).toLocaleString() : null

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

  return (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel
        id="log-sidepanel"
        defaultSize={400}
        minSize={300}
        className="bg-dash-sidebar"
      >
        <div className="flex h-full flex-col overflow-hidden">
          <Tabs
            defaultValue={shouldShowServiceFlow ? 'overview' : 'raw-json'}
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full w-full flex-col"
          >
            <div className="flex items-center justify-between px-4 border-b border-border">
              <TabsList className="flex h-auto gap-x-4 rounded-none border-none!">
                {shouldShowServiceFlow && (
                  <TabsTrigger
                    value="overview"
                    className="border-b py-3 font-mono text-xs uppercase"
                  >
                    Overview
                  </TabsTrigger>
                )}
                <TabsTrigger value="raw-json" className="border-b py-3 font-mono text-xs uppercase">
                  Raw JSON
                </TabsTrigger>
              </TabsList>
              <ServiceFlowPanelControls />
            </div>

            {shouldShowServiceFlow && (
              <TabsContent
                ref={overviewScrollRef}
                value="overview"
                className="mt-0 grow overflow-auto py-2"
              >
                {error ? (
                  <div className="py-8 text-center text-destructive">Error: {error.toString()}</div>
                ) : serviceFlowType === 'postgres' ? (
                  <PostgresFlowDetail
                    data={selectedRow}
                    enrichedData={serviceFlowData?.result?.[0]}
                    isLoading={isLoading}
                    filterFields={filterFields}
                    table={table}
                  />
                ) : (
                  <div className="[&>*:nth-child(even)]:bg-surface-100/50">
                    <DetailSectionHeader
                      title="Request started"
                      icon={Clock}
                      summary={formattedTime ?? undefined}
                    />

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
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent
              ref={jsonScrollRef}
              value="raw-json"
              className="mt-0 grow overflow-auto bg-surface-100/50"
            >
              {isLoading && shouldShowServiceFlow && (
                <div className="flex items-center gap-3 border-b border-border bg-surface-100 p-3 text-foreground-light">
                  <Skeleton className="h-4 w-4 animate-pulse rounded-full" />
                  <span className="text-sm">Enriching log...</span>
                </div>
              )}
              <div className="sticky top-2 z-10 flex justify-end px-2 -mb-9 pointer-events-none">
                <Button
                  size="tiny"
                  type="default"
                  className="pointer-events-auto px-1.5"
                  icon={jsonCopied ? <Check size={12} /> : <Copy size={12} />}
                  onClick={() => {
                    copyToClipboard(JSON.stringify(formattedJsonData, null, 2))
                    setJsonCopied(true)
                    setTimeout(() => setJsonCopied(false), 1000)
                  }}
                >
                  {jsonCopied ? 'Copied' : ''}
                </Button>
              </div>
              <CodeBlock
                language="json"
                hideCopy
                wrapperClassName="!overflow-visible bg-surface-100/50 [&_pre]:!bg-surface-100/50"
                className="rounded-none border-none [&_code]:!leading-tight [&_pre]:!leading-tight"
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
