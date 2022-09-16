import { FC } from 'react'
import { IconX, Loading } from '@supabase/ui'

import { LogData, QueryType } from './Logs.types'

import DatabaseApiSelectionRender, {
  DatabaseApiSelectionHeaderRender,
} from './LogSelectionRenderers/DatabaseApiSelectionRender'
import DatabasePostgresSelectionRender from './LogSelectionRenderers/DatabasePostgresSelectionRender'
import FunctionInvocationSelectionRender, {
  FunctionInvocationHeaderRender,
} from './LogSelectionRenderers/FunctionInvocationSelectionRender'
import FunctionLogsSelectionRender from './LogSelectionRenderers/FunctionLogsSelectionRender'
import DefaultExplorerSelectionRenderer from './LogSelectionRenderers/DefaultExplorerSelectionRenderer'
import DefaultPreviewSelectionRenderer from './LogSelectionRenderers/DefaultPreviewSelectionRenderer'
import { isDefaultLogPreviewFormat, LogsEndpointParams, LogsTableName } from '.'
import useSingleLog from 'hooks/analytics/useSingleLog'
import Connecting from 'components/ui/Loading/Loading'

export interface LogSelectionProps {
  log: LogData | null
  onClose: () => void
  queryType?: QueryType
  projectRef: string
  params: Partial<LogsEndpointParams>
}

const LogSelection: FC<LogSelectionProps> = ({
  projectRef,
  log: partialLog,
  onClose,
  queryType,
  params = {},
}) => {
  const [{ logData: fullLog, isLoading }] = useSingleLog(
    projectRef,
    queryType,
    params,
    partialLog?.id
  )
  const Formatter = () => {
    switch (queryType) {
      case 'api':
        if (!fullLog) return null
        return <DatabaseApiSelectionRender log={fullLog} />

      case 'database':
        if (!fullLog) return null
        return <DatabasePostgresSelectionRender log={fullLog} />

      case 'fn_edge':
        if (!fullLog) return null
        return <FunctionInvocationSelectionRender log={fullLog} />

      case 'functions':
        if (!fullLog) return null
        return <FunctionLogsSelectionRender log={fullLog} />

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

  return (
    <div
      className={[
        'relative h-full flex flex-col flex-grow border border-l',
        'border-panel-border-light dark:border-panel-border-dark',
        'bg-gray-200 overflow-y-scroll',
      ].join(' ')}
    >
      <div
        className={
          `overflow-y-scroll transition-all
          bg-scale-200 absolute w-full h-full text-center flex-col gap-2 flex items-center justify-center opacity-0 ` +
          (partialLog ? 'opacity-0 z-0' : 'opacity-100 z-10')
        }
      >
        <div
          className={
            `transition-all
          duration-500
          delay-300
          w-full
          flex
          flex-col
          justify-center
          items-center
          gap-6
          max-w-sm
          text-center scale-95 opacity-0 ` +
            (partialLog || isLoading ? 'mt-0 opacity-0 scale-95' : 'mt-8 opacity-100 scale-100')
          }
        >
          <div className="relative border border-scale-600 dark:border-scale-400 w-32 h-4 rounded px-2 flex items-center">
            <div className="h-0.5 rounded-full w-2/3 bg-scale-600 dark:bg-scale-500"></div>
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
            <h3 className="text-sm text-scale-1200">Select an Event</h3>
            <p className="text-xs text-scale-900">
              Select an Event to view the code snippet (pretty view) or complete JSON payload (raw
              view).
            </p>
          </div>
        </div>
      </div>
      <div
        className=" 
          relative
          flex-grow
          h-px
          bg-scale-300
        "
      >
        <div
          className="transition absolute cursor-pointer top-6 right-6 text-scale-900 hover:text-scale-1200"
          onClick={onClose}
        >
          <IconX size={14} strokeWidth={2} />
        </div>
        {isLoading && <Connecting />}
        <div className="bg-scale-300 py-8 flex flex-col space-y-6">
          {!isLoading && <Formatter />}
        </div>
      </div>
    </div>
  )
}

export default LogSelection
