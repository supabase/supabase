// AI SDK v1 wire compatibility examples owned by this application.
const sqlCall = {
  type: 'tool-call',
  toolName: 'execute_sql',
  toolCallId: 'sql',
  input: { sql: 'select 1', label: 'Test', chartConfig: { view: 'table' }, isWriteQuery: false },
}
const deployCall = {
  type: 'tool-call',
  toolName: 'deploy_edge_function',
  toolCallId: 'deploy',
  input: { name: 'hello', code: 'export default {}' },
}
export const assistantStreamFixtures: {
  name: string
  parts: { type: string; [key: string]: unknown }[]
  expected: string[]
}[] = [
  {
    name: 'text and reasoning',
    parts: [
      { type: 'reasoning-start', id: 'reason' },
      { type: 'reasoning-delta', id: 'reason', text: 'Thinking' },
      { type: 'reasoning-end', id: 'reason' },
      { type: 'text-start', id: 'text' },
      { type: 'text-delta', id: 'text', text: 'Hello' },
      { type: 'text-end', id: 'text' },
    ],
    expected: ['reasoning-delta', 'Thinking', 'text-delta', 'Hello'],
  },
  {
    name: 'SQL approval',
    parts: [
      sqlCall,
      { type: 'tool-approval-request', approvalId: 'approve-sql', toolCall: sqlCall },
    ],
    expected: ['tool-input-available', 'tool-approval-request', 'approve-sql'],
  },
  {
    name: 'SQL rejection',
    parts: [
      sqlCall,
      { type: 'tool-approval-request', approvalId: 'deny-sql', toolCall: sqlCall },
      { type: 'tool-approval-response', approvalId: 'deny-sql', approved: false },
      { type: 'tool-output-denied', toolCallId: 'sql' },
    ],
    expected: ['tool-output-denied'],
  },
  {
    name: 'SQL results',
    parts: [
      sqlCall,
      { type: 'tool-result', toolCallId: 'sql', toolName: 'execute_sql', output: [{ result: 1 }] },
    ],
    expected: ['tool-output-available', 'result'],
  },
  {
    name: 'deployment approval',
    parts: [
      deployCall,
      { type: 'tool-approval-request', approvalId: 'approve-deploy', toolCall: deployCall },
    ],
    expected: ['deploy_edge_function', 'approve-deploy'],
  },
  {
    name: 'dynamic MCP results',
    parts: [
      { type: 'tool-call', toolCallId: 'mcp', toolName: 'list_tables', input: {}, dynamic: true },
      {
        type: 'tool-result',
        toolCallId: 'mcp',
        toolName: 'list_tables',
        output: { content: [] },
        dynamic: true,
      },
    ],
    expected: ['"dynamic":true', 'list_tables'],
  },
  {
    name: 'error',
    parts: [{ type: 'error', error: 'Model unavailable' }],
    expected: ['"type":"error"', 'Model unavailable'],
  },
]
