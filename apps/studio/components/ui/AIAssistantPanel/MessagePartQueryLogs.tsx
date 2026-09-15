import { type ToolUIPart } from 'ai'
import { Loader2 } from 'lucide-react'

import { AssistantQueryCell } from './AssistantQueryCell'
import { useMessageInfoContext } from './Message.Context'
import {
  getAssistantLogsQueryTitle,
  getAssistantLogsTimeRange,
  parseQueryLogsInput,
  toQueryLogsResult,
} from './MessagePartQueryLogs.utils'

type QueryLogsToolPart = Pick<
  ToolUIPart,
  'toolCallId' | 'state' | 'input' | 'output' | 'errorText'
> & { rawInput?: unknown }

function QueryLogsFailure() {
  return <div className="text-xs text-danger">Failed to query logs.</div>
}

export function MessagePartQueryLogs({ toolPart }: { toolPart: QueryLogsToolPart }) {
  const { id } = useMessageInfoContext()
  const { toolCallId, state, input: submittedInput, rawInput, output } = toolPart

  if (state === 'input-streaming' || state === 'input-available') {
    return (
      <div className="my-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Querying logs...
      </div>
    )
  }

  if (state !== 'output-available' && state !== 'output-error') return null

  const parsedInput = parseQueryLogsInput(submittedInput ?? rawInput)
  if (!parsedInput.success) return <QueryLogsFailure />

  const result =
    state === 'output-error'
      ? { rows: [], error: { message: toolPart.errorText ?? 'Failed to query logs' } }
      : toQueryLogsResult(output)
  if (!result) return <QueryLogsFailure />

  return (
    <div className="w-auto overflow-x-hidden my-4 space-y-2">
      <AssistantQueryCell
        id={`${id}-${toolCallId}`}
        sql={parsedInput.data.sql}
        title={getAssistantLogsQueryTitle(parsedInput.data.sql)}
        source={{
          _tag: 'logs',
          time_range: getAssistantLogsTimeRange(
            parsedInput.data.iso_timestamp_start,
            parsedInput.data.iso_timestamp_end
          ),
        }}
        initialResult={result}
        confirmState={state === 'output-error' ? 'error' : undefined}
      />
    </div>
  )
}
