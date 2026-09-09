import { useQueryStates } from 'nuqs'
import { ToggleGroup, ToggleGroupItem } from 'ui'

import { getVisibleWorkerLogStreams } from '../Workers.utils'
import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import {
  WORKER_LOG_STREAM_LABEL,
  WORKER_LOG_STREAMS,
  type WorkerLogStream,
} from '@/lib/constants/workers'

const isWorkerLogStream = (value: string): value is WorkerLogStream =>
  (WORKER_LOG_STREAMS as readonly string[]).includes(value)

/**
 * Toggles which of the worker's three log streams are shown. Backed by the same
 * `worker_*` view-option params the unified Logs page uses for its nested
 * Workers toggles, so the selection carries over when opening the logs there.
 */
export const WorkerLogStreamToggle = () => {
  const [search, setSearch] = useQueryStates(SEARCH_PARAMS_PARSER)
  const visibleStreams = getVisibleWorkerLogStreams(search)

  const handleValueChange = (next: string[]) => {
    const streams = next.filter(isWorkerLogStream)
    // Hiding every stream would only ever show an empty table, so keep at least one on.
    if (streams.length === 0) return
    setSearch({
      worker_requests: streams.includes('requests'),
      worker_output: streams.includes('output'),
      worker_builds: streams.includes('builds'),
    })
  }

  return (
    <ToggleGroup
      type="multiple"
      variant="outline"
      size="tiny"
      aria-label="Log streams"
      value={visibleStreams}
      onValueChange={handleValueChange}
    >
      {WORKER_LOG_STREAMS.map((stream) => (
        <ToggleGroupItem key={stream} value={stream}>
          {WORKER_LOG_STREAM_LABEL[stream]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
