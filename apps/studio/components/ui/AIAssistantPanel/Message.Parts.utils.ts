import { getToolName, isToolUIPart, type UIMessage } from 'ai'
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
  'tool-list_reports',
  'tool-get_report',
  'tool-list_databases',
  'tool-list_notebooks',
  'tool-get_notebook',
  // Self-hosted fallbacks
  'tool-getSchemaTables',
  'tool-getRlsKnowledge',
  'tool-getFunctions',
  'tool-getEdgeFunctionKnowledge',
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

/**
 * - `running`: still streaming or executing
 * - `done`: finished
 * - `failed`: the tool call errored or was denied
 * - `stopped`: left unfinished because the response ended, e.g. the user pressed stop
 */
export type CompactPartStatus = 'running' | 'done' | 'failed' | 'stopped'

/**
 * @param isRunning whether the tool group holding the part is still streaming. Anything left
 * unfinished outside a running group will never finish.
 */
export function getCompactPartStatus(part: MessagePart, isRunning: boolean): CompactPartStatus {
  const unfinished = isRunning ? 'running' : 'stopped'

  if (part.type === 'reasoning') return part.state === 'streaming' ? unfinished : 'done'
  if (isToolUIPart(part)) {
    if (part.state === 'output-available') return 'done'
    if (part.state === 'output-error' || part.state === 'output-denied') return 'failed'
    return unfinished
  }
  return 'done'
}

type ToolLabels = {
  /** e.g. "Searching docs" */
  running: string
  /** e.g. "Searched docs" */
  done: string
  /** Completes "Unable to …", e.g. "search docs" */
  base: string
  /** Names what the call looks at, from its input, e.g. "in public" */
  getDetail?: (input: unknown) => string | undefined
}

function getInputField(input: unknown, field: string): unknown {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[field]
    : undefined
}

function getSchemasDetail(input: unknown) {
  const schemas = getInputField(input, 'schemas')
  if (!Array.isArray(schemas)) return undefined
  const names = schemas.filter((schema): schema is string => typeof schema === 'string' && !!schema)
  return names.length > 0 ? `in ${names.join(', ')}` : undefined
}

function getDocsSearchDetail(input: unknown) {
  const graphqlQuery = getInputField(input, 'graphql_query')
  if (typeof graphqlQuery !== 'string') return undefined
  // e.g. { searchDocs(query: "row level security", limit: 5) { ... } }
  const query = graphqlQuery.match(/searchDocs\s*\(\s*query\s*:\s*"((?:[^"\\]|\\.)+)"/)?.[1]
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

function getKnowledgeDetail(input: unknown) {
  const name = getInputField(input, 'name')
  const topic = typeof name === 'string' ? KNOWLEDGE_TOPICS[name] : undefined
  return topic ? `on ${topic}` : undefined
}

function getAdvisorsDetail(input: unknown) {
  const type = getInputField(input, 'type')
  return type === 'security' || type === 'performance' ? `for ${type} issues` : undefined
}

const TOOL_LABELS: Record<string, ToolLabels> = {
  search_docs: {
    running: 'Searching docs',
    done: 'Searched docs',
    base: 'search docs',
    getDetail: getDocsSearchDetail,
  },
  load_knowledge: {
    running: 'Reading up',
    done: 'Read up',
    base: 'read up',
    getDetail: getKnowledgeDetail,
  },
  get_active_incidents: {
    running: 'Checking Supabase status',
    done: 'Checked Supabase status',
    base: 'check Supabase status',
  },
  list_policies: {
    running: 'Checking policies',
    done: 'Checked policies',
    base: 'check policies',
    getDetail: getSchemasDetail,
  },
  list_tables: {
    running: 'Listing tables',
    done: 'Listed tables',
    base: 'list tables',
    getDetail: getSchemasDetail,
  },
  list_extensions: {
    running: 'Listing extensions',
    done: 'Listed extensions',
    base: 'list extensions',
  },
  list_edge_functions: {
    running: 'Listing Edge Functions',
    done: 'Listed Edge Functions',
    base: 'list Edge Functions',
  },
  list_branches: { running: 'Listing branches', done: 'Listed branches', base: 'list branches' },
  get_advisors: {
    running: 'Checking advisors',
    done: 'Checked advisors',
    base: 'check advisors',
    getDetail: getAdvisorsDetail,
  },
  list_reports: { running: 'Listing reports', done: 'Listed reports', base: 'list reports' },
  get_report: { running: 'Reading report', done: 'Read report', base: 'read report' },
  list_databases: {
    running: 'Listing databases',
    done: 'Listed databases',
    base: 'list databases',
  },
  list_notebooks: {
    running: 'Listing notebooks',
    done: 'Listed notebooks',
    base: 'list notebooks',
  },
  get_notebook: { running: 'Reading notebook', done: 'Read notebook', base: 'read notebook' },
  getSchemaTables: {
    running: 'Listing tables',
    done: 'Listed tables',
    base: 'list tables',
    getDetail: getSchemasDetail,
  },
  getRlsKnowledge: {
    running: 'Checking policies',
    done: 'Checked policies',
    base: 'check policies',
    getDetail: getSchemasDetail,
  },
  getFunctions: {
    running: 'Listing database functions',
    done: 'Listed database functions',
    base: 'list database functions',
    getDetail: getSchemasDetail,
  },
  getEdgeFunctionKnowledge: {
    running: 'Reading up',
    done: 'Read up',
    base: 'read up',
    getDetail: () => 'on Edge Functions',
  },
}

function getToolLabels(toolName: string): ToolLabels {
  const known = TOOL_LABELS[toolName]
  if (known) return known

  // e.g. get_logs or getSchemaTables -> "get logs", "get schema tables"
  const name = toolName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
  return { running: `Running ${name}`, done: `Ran ${name}`, base: `run ${name}` }
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

/** The text of a compact tool row: what it did, plus what it looked at when known. */
export type CompactPartLabel = { action: string; detail?: string }

function withEllipsis({ action, detail }: CompactPartLabel): CompactPartLabel {
  return detail ? { action, detail: `${detail}...` } : { action: `${action}...` }
}

export function getCompactPartLabel(
  part: MessagePart,
  status: CompactPartStatus
): CompactPartLabel {
  if (part.type === 'reasoning') {
    if (status === 'running') return { action: 'Thinking...' }
    if (status === 'stopped') return { action: 'Stopped thinking' }
    return { action: 'Reasoned' }
  }
  if (!isToolUIPart(part)) return { action: 'Working...' }

  const labels = getToolLabels(getToolName(part))
  const detail = labels.getDetail?.(part.input)

  switch (status) {
    case 'running':
      return withEllipsis({ action: labels.running, detail })
    case 'failed':
      return { action: `Unable to ${labels.base}`, detail }
    case 'stopped':
      return { action: `Stopped ${lowerFirst(labels.running)}`, detail }
    case 'done':
      return { action: labels.done, detail }
  }
}

/**
 * The header of a running tool group. A tool call takes over the header only while it
 * executes; the rest of the time the model is working out its next step, however long
 * that takes.
 */
export function getRunningToolGroupHeader(parts: MessagePart[]): CompactPartLabel {
  const runningTool = parts.findLast(
    (part) => isToolUIPart(part) && getCompactPartStatus(part, true) === 'running'
  )
  return runningTool ? getCompactPartLabel(runningTool, 'running') : { action: 'Thinking...' }
}

/** The header of a finished tool group: what its tool calls did, e.g. "Searched docs and checked policies". */
export function getToolGroupSummary(parts: MessagePart[]): CompactPartLabel {
  const actions = [
    ...new Set(
      parts
        .filter((part) => isToolUIPart(part) && getCompactPartStatus(part, false) === 'done')
        .map((part) => getCompactPartLabel(part, 'done').action)
    ),
  ].map((action, idx) => (idx === 0 ? action : lowerFirst(action)))

  if (actions.length === 0) {
    // Nothing finished, so describe how the group ended: reasoning, a failure or a stop
    const lastPart = parts.at(-1)
    if (!lastPart) return { action: 'Reasoned' }
    return { action: getCompactPartLabel(lastPart, getCompactPartStatus(lastPart, false)).action }
  }
  if (actions.length === 1) return { action: actions[0] }
  if (actions.length === 2) return { action: `${actions[0]} and ${actions[1]}` }
  return { action: `${actions[0]}, ${actions[1]}, and ${actions.length - 2} more` }
}
