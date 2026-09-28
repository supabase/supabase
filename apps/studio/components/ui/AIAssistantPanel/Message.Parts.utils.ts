import {
  getToolName,
  isToolUIPart,
  type DynamicToolUIPart,
  type ReasoningUIPart,
  type ToolUIPart,
  type UIMessage,
} from 'ai'
import isEqual from 'lodash/isEqual'

type MessagePart = UIMessage['parts'][number]
type ToolPart = ToolUIPart | DynamicToolUIPart
/** A one-line row that folds into a tool group: reasoning, or a lookup tool call. */
export type CompactPart = ReasoningUIPart | ToolPart

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

type ToolLabels = {
  running: string
  done: string
  /** What the call looks at, from its input, e.g. "in public" */
  detail?: (input: unknown) => string | undefined
}

const getField = (input: unknown, key: string): unknown =>
  typeof input === 'object' && input !== null ? Reflect.get(input, key) : undefined

function inSchemas(input: unknown) {
  const schemas = getField(input, 'schemas')
  return Array.isArray(schemas) && schemas.length > 0 ? `in ${schemas.join(', ')}` : undefined
}

function forDocsQuery(input: unknown) {
  // e.g. { searchDocs(query: "row level security", limit: 5) { ... } }
  const query = String(getField(input, 'graphql_query')).match(
    /searchDocs\s*\(\s*query\s*:\s*"((?:[^"\\]|\\.)+)"/
  )?.[1]
  return query ? `for "${query}"` : undefined
}

const KNOWLEDGE_TOPICS: Record<string, string> = {
  pg_best_practices: 'Postgres best practices',
  rls: 'RLS',
  storage: 'Storage',
  edge_functions: 'Edge Functions',
  realtime: 'Realtime',
  logs: 'logs',
}

function onKnowledgeTopic(input: unknown) {
  const name = String(getField(input, 'name'))
  return Object.hasOwn(KNOWLEDGE_TOPICS, name) ? `on ${KNOWLEDGE_TOPICS[name]}` : undefined
}

function forAdvisorType(input: unknown) {
  const type = getField(input, 'type')
  return type === 'security' || type === 'performance' ? `for ${type} issues` : undefined
}

const TOOL_LABELS: Record<string, ToolLabels> = {
  search_docs: { running: 'Searching docs', done: 'Searched docs', detail: forDocsQuery },
  load_knowledge: { running: 'Reading up', done: 'Read up', detail: onKnowledgeTopic },
  get_active_incidents: { running: 'Checking Supabase status', done: 'Checked Supabase status' },
  list_policies: { running: 'Checking policies', done: 'Checked policies', detail: inSchemas },
  list_tables: { running: 'Listing tables', done: 'Listed tables', detail: inSchemas },
  list_extensions: { running: 'Listing extensions', done: 'Listed extensions' },
  list_edge_functions: { running: 'Listing Edge Functions', done: 'Listed Edge Functions' },
  list_branches: { running: 'Listing branches', done: 'Listed branches' },
  get_advisors: { running: 'Checking advisors', done: 'Checked advisors', detail: forAdvisorType },
  list_reports: { running: 'Listing reports', done: 'Listed reports' },
  get_report: { running: 'Reading report', done: 'Read report' },
  list_databases: { running: 'Listing databases', done: 'Listed databases' },
  list_notebooks: { running: 'Listing notebooks', done: 'Listed notebooks' },
  get_notebook: { running: 'Reading notebook', done: 'Read notebook' },
  // Self-hosted fallbacks
  getSchemaTables: { running: 'Listing tables', done: 'Listed tables', detail: inSchemas },
  getRlsKnowledge: { running: 'Checking policies', done: 'Checked policies', detail: inSchemas },
  getFunctions: {
    running: 'Listing database functions',
    done: 'Listed database functions',
    detail: inSchemas,
  },
  getEdgeFunctionKnowledge: {
    running: 'Reading up',
    done: 'Read up',
    detail: () => 'on Edge Functions',
  },
}

function getToolLabels(toolName: string): ToolLabels {
  if (Object.hasOwn(TOOL_LABELS, toolName)) return TOOL_LABELS[toolName]
  const name = toolName.replaceAll('_', ' ')
  return { running: `Running ${name}`, done: `Ran ${name}` }
}

const BLOCK_TOOLS = new Set([
  'execute_sql',
  'query_logs',
  'deploy_edge_function',
  'create_notebook',
  'update_notebook',
  'delete_notebook',
  'run_notebook',
])

/** Lookups get a compact row. Studio's own tools need a label; any MCP tool gets a generic one. */
export function isCompactToolCall(part: ToolPart): boolean {
  const toolName = getToolName(part)
  return part.type === 'dynamic-tool'
    ? toolName !== 'query_logs'
    : Object.hasOwn(TOOL_LABELS, toolName)
}

const isBlockPart = (part: MessagePart) =>
  part.type === 'text'
    ? part.text.trim().length > 0
    : isToolUIPart(part) && BLOCK_TOOLS.has(getToolName(part))

export type MessagePartItem =
  | { type: 'part'; part: MessagePart; partIndex: number }
  | { type: 'tool-group'; parts: CompactPart[]; groupIndex: number }

/**
 * Folds each run of consecutive compact parts into a tool group. Parts that render nothing
 * (step markers, empty text, tools without UI) are dropped so they don't split a run.
 */
export function groupMessageParts(parts: MessagePart[]): MessagePartItem[] {
  const items: MessagePartItem[] = []
  let groupCount = 0

  parts.forEach((part, partIndex) => {
    if (part.type === 'reasoning' || (isToolUIPart(part) && isCompactToolCall(part))) {
      const lastItem = items.at(-1)
      if (lastItem?.type === 'tool-group') lastItem.parts.push(part)
      else items.push({ type: 'tool-group', parts: [part], groupIndex: groupCount++ })
    } else if (isBlockPart(part)) {
      items.push({ type: 'part', part, partIndex })
    }
  })

  return items
}

export const INTERRUPTED_LABEL = 'Response interrupted'

/** `running` covers any unfinished part. Once its message stops, it renders as interrupted. */
export type CompactPartStatus = 'running' | 'done' | 'failed'

export function getCompactPartStatus(part: CompactPart): CompactPartStatus {
  if (part.type === 'reasoning') return part.state === 'streaming' ? 'running' : 'done'
  if (part.state === 'output-available') return 'done'
  if (part.state === 'output-error' || part.state === 'output-denied') return 'failed'
  return 'running'
}

export const isRunningToolCall = (part: CompactPart) =>
  part.type !== 'reasoning' && getCompactPartStatus(part) === 'running'

export function getCompactPartLabel(
  part: CompactPart,
  status = getCompactPartStatus(part)
): string {
  if (part.type === 'reasoning') return status === 'running' ? 'Thinking...' : 'Reasoned'

  const labels = getToolLabels(getToolName(part))
  const detail = labels.detail?.(part.input)
  const target = detail ? ` ${detail}` : ''
  if (status === 'running') return `${labels.running}${target}...`
  if (status === 'failed') return `${labels.running}${target} failed`
  return `${labels.done}${target}`
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

/** A finished group's header: what its tool calls did, e.g. "Searched docs and checked policies". */
export function getToolGroupSummary(parts: CompactPart[]): string {
  const actions = new Set(
    parts.flatMap((part) =>
      part.type !== 'reasoning' && getCompactPartStatus(part) === 'done'
        ? [getToolLabels(getToolName(part)).done]
        : []
    )
  )
  const [first, second, ...rest] = actions

  if (!first) {
    // Nothing finished: the group only reasoned, failed or was cut off
    const lastPart = parts.at(-1)
    if (!lastPart) return 'Reasoned'
    return getCompactPartStatus(lastPart) === 'running'
      ? INTERRUPTED_LABEL
      : getCompactPartLabel(lastPart)
  }
  if (!second) return first
  if (rest.length === 0) return `${first} and ${lowerFirst(second)}`
  return `${first}, ${lowerFirst(second)}, and ${rest.length} more`
}
