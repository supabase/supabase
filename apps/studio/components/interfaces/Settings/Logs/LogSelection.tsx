import { MousePointerClick, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { Loading } from 'components/ui/Loading'
import { useWarehouseQueryQuery } from 'data/analytics/warehouse-query'
import useSingleLog from 'hooks/analytics/useSingleLog'
import {
  Button,
  CodeBlock,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import AuthSelectionRenderer from './LogSelectionRenderers/AuthSelectionRenderer'
import DatabaseApiSelectionRender from './LogSelectionRenderers/DatabaseApiSelectionRender'
import DatabasePostgresSelectionRender from './LogSelectionRenderers/DatabasePostgresSelectionRender'
import DefaultExplorerSelectionRenderer from './LogSelectionRenderers/DefaultExplorerSelectionRenderer'
import DefaultPreviewSelectionRenderer from './LogSelectionRenderers/DefaultPreviewSelectionRenderer'
import FunctionInvocationSelectionRender from './LogSelectionRenderers/FunctionInvocationSelectionRender'
import FunctionLogsSelectionRender from './LogSelectionRenderers/FunctionLogsSelectionRender'
import type { LogData, LogsEndpointParams, QueryType } from './Logs.types'
import { isDefaultLogPreviewFormat, isUnixMicro, unixMicroToIsoTimestamp } from './Logs.utils'

export interface LogSelectionProps {
  log: LogData | null
  onClose: () => void
  queryType?: QueryType
  projectRef: string
  params: Partial<LogsEndpointParams>
  collectionName?: string
}

const LogSelection = ({
  projectRef,
  log: partialLog,
  onClose,
  queryType,
  params = {},
  collectionName,
}: LogSelectionProps) => {
  const { logData: fullLog, isLoading } = useSingleLog(
    projectRef,
    queryType,
    params,
    partialLog?.id
  )
  const [sql, setSql] = useState('')

  const {
    refetch: refetchWarehouseData,
    data: warehouseQueryData,
    isFetching: warehouseQueryFetching,
  } = useWarehouseQueryQuery(
    {
      ref: projectRef,
      sql,
    },
    {
      enabled: queryType === 'warehouse',
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  useEffect(() => {
    const newSql = `select id, timestamp, event_message, metadata from \`${collectionName}\`
    where id = '${partialLog?.id}' and timestamp > '2024-01-01' limit 1`

    setSql(newSql)
  }, [collectionName, partialLog?.id])

  useEffect(() => {
    if (queryType === 'warehouse') {
      refetchWarehouseData()
    }
  }, [
    warehouseQueryData,
    collectionName,
    projectRef,
    partialLog?.id,
    refetchWarehouseData,
    queryType,
  ])

  const Formatter = () => {
    switch (queryType) {
      case 'warehouse':
        if (!warehouseQueryData) return null
        return <DefaultPreviewSelectionRenderer log={warehouseQueryData.result[0]} />
      case 'api':
        if (!fullLog) return null
        if (!fullLog.metadata) return <DefaultPreviewSelectionRenderer log={fullLog} />
        return <DatabaseApiSelectionRender log={fullLog} />

      case 'database':
        if (!fullLog) return null
        if (!fullLog.metadata) return <DefaultPreviewSelectionRenderer log={fullLog} />
        return <DatabasePostgresSelectionRender log={fullLog} />

      case 'fn_edge':
        if (!fullLog) return null
        if (!fullLog.metadata) return <DefaultPreviewSelectionRenderer log={fullLog} />
        return <FunctionInvocationSelectionRender log={fullLog} />

      case 'functions':
        if (!fullLog) return null
        if (!fullLog.metadata) return <DefaultPreviewSelectionRenderer log={fullLog} />
        return <FunctionLogsSelectionRender log={fullLog} />

      case 'auth':
        if (!fullLog) return null
        if (!fullLog.metadata) return <DefaultPreviewSelectionRenderer log={fullLog} />
        return <AuthSelectionRenderer log={fullLog} />

      default:
        if (queryType && fullLog && isDefaultLogPreviewFormat(fullLog)) {
          return <DefaultPreviewSelectionRenderer log={fullLog} />
        }
        if (queryType && !fullLog) {
          return null
        }
        if (!partialLog) return null
        return <DefaultExplorerSelectionRenderer log={partialLog} />
    }
  }

  const selectionText = useMemo(() => {
    if (fullLog && queryType) {
      return `Log ID
  ${fullLog.id}\n
  Log Timestamp (UTC)
  ${isUnixMicro(fullLog.timestamp) ? unixMicroToIsoTimestamp(fullLog.timestamp) : fullLog.timestamp}\n
  Log Event Message
  ${fullLog.event_message}\n
  Log Metadata
  ${JSON.stringify(fullLog.metadata, null, 2)}
  `
    }

    return JSON.stringify(fullLog || partialLog, null, 2)
  }, [fullLog, partialLog, queryType])

  return (
    <div
      className={cn(
        'relative flex h-full flex-grow flex-col border border-l border-overlay',
        'overflow-y-scroll bg-studio'
      )}
    >
      <div
        className={cn(
          'absolute flex h-full w-full flex-col items-center justify-center gap-2 overflow-y-scroll bg-studio text-center opacity-0 transition-all',
          {
            'z-0 opacity-0': partialLog,
            'z-10 opacity-100': !partialLog,
          }
        )}
      >
        <div
          className={
            `flex
          w-full
          max-w-sm
          scale-95
          flex-col
          items-center
          justify-center
          gap-6
          text-center
          opacity-0
          transition-all delay-300 duration-500 ` +
            (partialLog || isLoading ? 'mt-0 scale-95 opacity-0' : 'mt-8 scale-100 opacity-100')
          }
        >
          <div className="relative flex h-4 w-32 items-center rounded border border-control px-2">
            <div className="h-0.5 w-2/3 rounded-full bg-surface-300"></div>
            <div className="absolute right-1 -bottom-4">
              <MousePointerClick size="24" strokeWidth={1} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm text-foreground">Select an Event</h3>
            <p className="text-xs text-foreground-lighter">
              {queryType === 'warehouse'
                ? 'Select an Event to view the complete JSON payload'
                : 'Select an Event to view the code snippet (pretty view) or complete JSON payload (raw view).'}
            </p>
          </div>
        </div>
      </div>
      <div className="relative flex-grow flex flex-col bg-surface-100">
        <Tabs_Shadcn_ defaultValue="details" className="flex flex-col">
          <TabsList_Shadcn_ className="px-2 pt-2">
            <TabsTrigger_Shadcn_ className="px-3" value="details">
              Details
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ className="px-3" value="raw">
              Raw
            </TabsTrigger_Shadcn_>
            <Button
              type="text"
              className="ml-auto absolute top-2 right-2 cursor-pointer transition hover:text-foreground h-6 w-6 px-0 py-0 flex items-center justify-center"
              onClick={onClose}
            >
              <X size={14} strokeWidth={2} className="text-foreground-lighter" />
            </Button>
          </TabsList_Shadcn_>
          <div className="flex-grow">
            {isLoading || warehouseQueryFetching ? (
              <div className="py-44">
                <Loading />
              </div>
            ) : (
              <>
                <TabsContent_Shadcn_ className="bg-surface-100 space-y-6" value="details">
                  <Formatter />
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ value="raw">
                  <CodeBlock
                    hideLineNumbers
                    language="json"
                    className="prose w-full pt-0 max-w-full border-none"
                  >
                    {JSON.stringify(fullLog || partialLog, null, 2)}
                  </CodeBlock>
                </TabsContent_Shadcn_>
              </>
            )}
          </div>
        </Tabs_Shadcn_>
      </div>
    </div>
  )
}

export default LogSelection
