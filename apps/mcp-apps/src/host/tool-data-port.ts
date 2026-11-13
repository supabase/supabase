import {
  dataOperations,
  parseUntrustedJson,
  parseUntrustedRows,
  type DataOperationName,
  type DataPort,
} from 'surfaces/contract'

export interface ToolResult {
  isError?: boolean
  structuredContent?: unknown
  content?: unknown[]
}
export type CallTool = (name: string, args: Record<string, unknown>) => Promise<ToolResult>

function textOf(result: ToolResult) {
  return (result.content ?? [])
    .filter(
      (c): c is { type: 'text'; text: string } =>
        !!c &&
        typeof c === 'object' &&
        'type' in c &&
        c.type === 'text' &&
        'text' in c &&
        typeof c.text === 'string'
    )
    .map((c) => c.text)
    .join('\n')
}

/** Tool errors carry plain text or a JSON `{ error: { message } }` body. */
export function toolError(result: ToolResult) {
  let message = textOf(result) || 'The server could not complete this action.'
  try {
    const parsed = JSON.parse(message)
    message = parsed.error?.message ?? parsed.message ?? message
  } catch {
    /* plain text */
  }
  return new Error(message)
}

/** The structured payload of a successful tool result, falling back to JSON text. */
export function decodeToolResult(result: ToolResult): unknown {
  if (result.isError) throw toolError(result)
  if (result.structuredContent !== undefined) return result.structuredContent
  const text = textOf(result)
  if (!text) throw new Error('The server returned no data.')
  try {
    // Model tools may wrap their JSON in untrusted-data markers.
    return parseUntrustedJson(text)
  } catch {
    throw new Error('The server returned an unsupported response.')
  }
}

/**
 * The MCP Apps implementation of DataPort: each operation is a tool call on the
 * originating server, validated on the way out and on the way back with the
 * same contract schemas the server registered.
 */
export function createToolDataPort(
  callTool: CallTool,
  {
    scopedProjectId = () => null,
  }: {
    /** The project a scoped connection is locked to, once known. */
    scopedProjectId?: () => string | null
  } = {}
): DataPort {
  async function call<K extends DataOperationName>(name: K, input: unknown) {
    const op = dataOperations[name]
    const args = op.input.parse(input) as Record<string, unknown>
    // On a scoped connection the server fills in project_id for model tools and rejects it if
    // passed, so a shared tool gets it only on unscoped connections.
    const scoped = scopedProjectId()
    if (op.visibility === 'shared' && scoped && 'project_id' in args) {
      if (args.project_id !== scoped)
        throw new Error('This project is outside the connection’s scope.')
      delete args.project_id
    }
    const payload = decodeToolResult(await callTool(op.tool, args))
    // SQL tools wrap rows for the model; unwrap them here.
    const value = op.result === 'rows' ? parseUntrustedRows(payload) : payload
    return op.output.parse(value)
  }
  const port = {} as Record<DataOperationName, (input: unknown) => Promise<unknown>>
  for (const name of Object.keys(dataOperations) as DataOperationName[]) {
    port[name] = (input) => call(name, input)
  }
  return port as unknown as DataPort
}
