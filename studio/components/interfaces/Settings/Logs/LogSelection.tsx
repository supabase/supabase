import { FC } from 'react'
import { IconX } from '@supabase/ui'

import { LogData, QueryType } from './Logs.types'

import DatabaseApiSelectionRender, {
  DatabaseApiSelectionHeaderRender,
} from './LogSelectionRenderers/DatabaseApiSelectionRender'
import DatabasePostgresSelectionRender from './LogSelectionRenderers/DatabasePostgresSelectionRender'

interface Props {
  log: LogData
  onClose: () => void
  queryType?: QueryType
}

/**
 * Log selection display
 */
const LogSelection: FC<Props> = ({ log, onClose, queryType }) => {
  const Formatter = () => {
    switch (queryType) {
      case 'api':
        return <DatabaseApiSelectionRender log={log} />
        break

      case 'database':
        return <DatabasePostgresSelectionRender log={log} />
        break

      default:
        return null
        break
    }
  }

  function header() {
    switch (queryType) {
      case 'api':
        return DatabaseApiSelectionHeaderRender(log)

      default:
        return null
    }
  }

  return (
    <div
      className={[
        'h-full flex flex-col flex-grow border border-l',
        'border-panel-border-light dark:border-panel-border-dark',
        'bg-gray-200',
      ].join(' ')}
    >
      {log ? (
        <>
          <div
            className={[
              'bg-panel-header-light dark:bg-panel-header-dark',
              'border-b border-panel-border-interior-light',
              'dark:border-panel-border-interior-dark',
            ].join(' ')}
          >
            <div className="px-6 py-4 flex items-center">
              <div className="flex flex-row justify-between items-center w-full">
                <h3 className="text-xl font-semibold">{header()}</h3>
                <div className="cursor-pointer" onClick={onClose}>
                  <IconX size={14} />
                </div>
              </div>
            </div>
          </div>
          <div
            className="
              flex-grow overflow-y-auto 
              bg-panel-body-light dark:bg-panel-body-dark
              space-y-6
              py-8
          "
          >
            <Formatter />
          </div>
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="w-1/2 text-center flex flex-col gap-2">
            <h3 className="text-sm text-scale-1200">Select an Event</h3>
            <p className="text-xs text-scale-1100">
              Select an Event to view the code snippet (pretty view) or complete JSON payload (raw
              view).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default LogSelection
