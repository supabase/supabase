import { isToolUIPart, type UIMessage } from 'ai'
import isEqual from 'lodash/isEqual'

type MessagePart = UIMessage['parts'][number]

export function areMessagePartsEqual(previous: MessagePart, next: MessagePart): boolean {
  if (previous === next) return true
  if (previous.type !== next.type) return false

  if (
    isToolUIPart(previous) &&
    isToolUIPart(next) &&
    previous.state === 'output-available' &&
    next.state === 'output-available' &&
    !previous.preliminary &&
    !next.preliminary
  ) {
    // Final output is fixed for a tool call, but the SDK clones it on every text update.
    // Keep checking identity, input, approval and metadata without walking result rows.
    const { output: _previousOutput, ...previousFields } = previous
    const { output: _nextOutput, ...nextFields } = next
    return isEqual(previousFields, nextFields)
  }

  // Preliminary output and live text/reasoning can still change without a state transition.
  return isEqual(previous, next)
}
