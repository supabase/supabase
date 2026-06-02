import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { forwardRef, useState } from 'react'

import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'
import { LogTable } from '@/components/interfaces/Settings/Logs/LogTable'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'

export type UtilityTabLogsResultsProps = {
  id: string
  isExecuting?: boolean
  onRun?: () => void
}

export const UtilityTabLogsResults = forwardRef<HTMLDivElement, UtilityTabLogsResultsProps>(
  ({ id, isExecuting, onRun }) => {
    const { ref: projectRef } = useParams()
    const snapV2 = useSqlEditorV2StateSnapshot()
    const [selectedLog, setSelectedLog] = useState<LogData | null>(null)

    const logsResult = snapV2.logsResults[id]
    const error = logsResult?.error

    if (isExecuting) {
      return (
        <div className="flex items-center gap-x-4 px-6 py-4 bg-table-header-light in-data-[theme*=dark]:bg-table-header-dark">
          <Loader2 size={14} className="animate-spin" />
          <p className="m-0 border-0 font-mono text-sm">Running...</p>
        </div>
      )
    }

    if (error) {
      const errorMessage =
        typeof error === 'string'
          ? error
          : typeof error === 'object' && error !== null && 'message' in error
            ? String((error as { message: string }).message)
            : 'An error occurred while running the query'

      return (
        <div className="bg-table-header-light in-data-[theme*=dark]:bg-table-header-dark overflow-y-auto">
          <div className="flex flex-row justify-between items-start py-4 px-6 gap-x-4">
            <p className="font-mono text-sm tracking-tight whitespace-pre-wrap">{errorMessage}</p>
          </div>
        </div>
      )
    }

    return (
      <LogTable
        projectRef={projectRef as string}
        data={(logsResult?.rows ?? []) as LogData[]}
        isLoading={false}
        error={null}
        showHeader={false}
        selectedLog={selectedLog ?? undefined}
        onSelectedLogChange={setSelectedLog}
        onRun={onRun}
        sqlQuery={undefined}
      />
    )
  }
)

UtilityTabLogsResults.displayName = 'UtilityTabLogsResults'
