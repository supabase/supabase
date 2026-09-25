import { getToolName, isToolUIPart, type UIMessage } from 'ai'

type MessagePart = UIMessage['parts'][number]

/**
 * - `compact`: a one-line tool row (reasoning, lookups) that gets folded into a tool group
 * - `block`: content that renders on its own (text, SQL results, notebooks, Edge Functions)
 * - `hidden`: renders nothing, so it neither breaks up nor joins a tool group
 */
type MessagePartKind = 'compact' | 'block' | 'hidden'

const COMPACT_TOOL_PART_TYPES = new Set<string>([
  'tool-list_policies',
  'tool-search_docs',
  'tool-get_active_incidents',
  'tool-load_knowledge',
])

const BLOCK_TOOL_PART_TYPES = new Set<string>([
  'tool-execute_sql',
  'tool-query_logs',
  'tool-deploy_edge_function',
  'tool-create_notebook',
  'tool-update_notebook',
  'tool-delete_notebook',
  'tool-run_notebook',
])

export function getMessagePartKind(part: MessagePart): MessagePartKind {
  if (part.type === 'reasoning') return 'compact'
  if (part.type === 'dynamic-tool') return part.toolName === 'query_logs' ? 'block' : 'compact'
  if (part.type === 'text') return part.text.trim().length > 0 ? 'block' : 'hidden'
  if (COMPACT_TOOL_PART_TYPES.has(part.type)) return 'compact'
  if (BLOCK_TOOL_PART_TYPES.has(part.type)) return 'block'
  return 'hidden'
}

export type MessagePartItem =
  | { type: 'part'; part: MessagePart; partIndex: number }
  | { type: 'tool-group'; parts: MessagePart[]; groupIndex: number }

/**
 * Folds each run of consecutive compact tool parts into a single tool group. Hidden parts
 * (step markers, tools without UI) are dropped so they don't split a run in two.
 */
export function groupMessageParts(parts: MessagePart[]): MessagePartItem[] {
  const items: MessagePartItem[] = []
  let groupCount = 0

  parts.forEach((part, partIndex) => {
    const kind = getMessagePartKind(part)
    if (kind === 'hidden') return

    if (kind === 'block') {
      items.push({ type: 'part', part, partIndex })
      return
    }

    const lastItem = items.at(-1)
    if (lastItem?.type === 'tool-group') {
      lastItem.parts.push(part)
    } else {
      items.push({ type: 'tool-group', parts: [part], groupIndex: groupCount++ })
    }
  })

  return items
}

/** The text of a compact tool row: an action, plus the tool's name for tool calls. */
type CompactPartLabel = { action: string; toolName?: string }

export function getCompactPartLabel(part: MessagePart): CompactPartLabel {
  if (part.type === 'reasoning') {
    return { action: part.state === 'streaming' ? 'Thinking...' : 'Reasoned' }
  }
  if (isToolUIPart(part)) {
    return {
      action: part.state === 'input-streaming' ? 'Running' : 'Ran',
      toolName: getToolName(part),
    }
  }
  return { action: 'Working...' }
}

/** The summary row of a tool group. While the group runs collapsed it mirrors the latest tool call. */
export function getToolGroupHeader({
  parts,
  isRunning,
  isOpen,
}: {
  parts: MessagePart[]
  isRunning: boolean
  isOpen: boolean
}): CompactPartLabel {
  if (!isRunning) {
    const noun = parts.length === 1 ? 'tool' : 'tools'
    return { action: `Worked across ${parts.length} ${noun}` }
  }

  const latestPart = parts.at(-1)
  // Expanded, the latest call is already visible as the last row
  if (isOpen || !latestPart) return { action: 'Working...' }

  return getCompactPartLabel(latestPart)
}
