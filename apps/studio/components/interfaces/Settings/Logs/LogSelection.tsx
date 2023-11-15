import { Button, IconX } from 'ui'

import CopyButton from 'components/ui/CopyButton'
import Connecting from 'components/ui/Loading/Loading'
import useSingleLog from 'hooks/analytics/useSingleLog'
import { useMemo } from 'react'
import {
  isDefaultLogPreviewFormat,
  isUnixMicro,
  LogsEndpointParams,
  unixMicroToIsoTimestamp,
} from '.'
import { LogData, QueryType } from './Logs.types'
import AuthSelectionRenderer from './LogSelectionRenderers/AuthSelectionRenderer'
import DatabaseApiSelectionRender from './LogSelectionRenderers/DatabaseApiSelectionRender'
import DatabasePostgresSelectionRender from './LogSelectionRenderers/DatabasePostgresSelectionRender'
import DefaultExplorerSelectionRenderer from './LogSelectionRenderers/DefaultExplorerSelectionRenderer'
import DefaultPreviewSelectionRenderer from './LogSelectionRenderers/DefaultPreviewSelectionRenderer'
import FunctionInvocationSelectionRender from './LogSelectionRenderers/FunctionInvocationSelectionRender'
import FunctionLogsSelectionRender from './LogSelectionRenderers/FunctionLogsSelectionRender'

export interface LogSelectionProps {
  log: LogData | null
  onClose: () => void
  queryType?: QueryType
  projectRef: string
  params: Partial<LogsEndpointParams>
}

const LogSelection = ({
  projectRef,
  log: partialLog,
  onClose,
  queryType,
  params = {},
}: LogSelectionProps) => {
  const { logData: fullLog, isLoading } = useSingleLog(
    projectRef,
    queryType,
    params,
    partialLog?.id
  )
  const Formatter = () => {
    switch (queryType) {
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
  }, [fullLog])

  return (
    <div
      className={[
        'relative flex h-full flex-grow flex-col border border-l',
        'border-overlay',
        'overflow-y-scroll bg-background',
      ].join(' ')}
    >
      <div
        className={
          `absolute flex
          h-full w-full flex-col items-center justify-center gap-2 overflow-y-scroll bg-background text-center opacity-0 transition-all ` +
          (partialLog ? 'z-0 opacity-0' : 'z-10 opacity-100')
        }
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm text-foreground">Select an Event</h3>
            <p className="text-xs text-foreground-lighter">
              Select an Event to view the code snippet (pretty view) or complete JSON payload (raw
              view).
            </p>
          </div>
        </div>
      </div>
      <div className="relative h-px flex-grow bg-surface-100">
        <div className="pt-4 px-4 flex flex-col gap-4">
          <div className="flex flex-row justify-between items-center">
            <div className={`transition ${!isLoading ? 'opacity-100' : 'opacity-0'}`}>
              <CopyButton text={selectionText} type="default" title="Copy log to clipboard" />
            </div>
            <Button
              type="text"
              className="cursor-pointer transition hover:text-foreground h-8 w-8 px-0 py-0 flex items-center justify-center"
              onClick={onClose}
            >
              <IconX size={14} strokeWidth={2} className="text-foreground-lighter" />
            </Button>
          </div>
          <div className="h-px w-full bg-selection rounded " />
        </div>
        {isLoading && <Connecting />}
        <div className="flex flex-col space-y-6 bg-surface-100 py-4">
          {!isLoading && <Formatter />}
        </div>
      </div>
    </div>
  )
}

export default LogSelection
