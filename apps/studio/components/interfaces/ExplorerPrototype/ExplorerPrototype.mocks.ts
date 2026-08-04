/**
 * PROTOTYPE — seed data and a fake query runner.
 *
 * `runMockQuery` stands in for PR E2's `useQuerySourceRun`. It has the same
 * shape as the real thing (source in, rows out, latency, occasional failure)
 * so the surfaces around it are wired the way they will be for real.
 */

import type {
  CellSource,
  ChatSession,
  NotebookContent,
  RecentItem,
  ResultRow,
  SnippetDoc,
  Source,
  Tab,
} from './ExplorerPrototype.types'

/** Sources are declared by the application, once. Cells only reference them by id. */
export const SOURCES: Source[] = [
  { id: 'database', type: 'database', endpoint: '/platform/pg-meta/{ref}/query' },
  {
    id: 'logs',
    type: 'logs',
    endpoint: '/platform/projects/{ref}/analytics/endpoints/logs.all.otel',
  },
]

export const MOCK_REPLICAS = [
  { identifier: 'primary', label: 'Primary database' },
  { identifier: 'replica-eu-west-1', label: 'Read replica — eu-west-1' },
  { identifier: 'replica-us-east-1', label: 'Read replica — us-east-1' },
]

// ---------------------------------------------------------------------------
// Seed documents
// ---------------------------------------------------------------------------

export const INITIAL_NOTEBOOKS: Record<string, NotebookContent> = {
  'nb-auth-health': {
    schema_version: 1,
    settings: { run_mode: 'manual', default_row_limit: 100 },
    cells: [
      {
        id: 'cell-heading',
        type: 'markdown',
        markdown:
          '## Authentication health\n\nRun the cells below to check signup volume and recent auth failures. Cells run top to bottom.',
      },
      {
        id: 'cell-signups',
        type: 'query',
        name: 'Signups by day',
        query: {
          type: 'inline',
          source: { id: 'database', parameters: { identifier: 'primary' } },
          sql: "select date_trunc('day', created_at)::date as day,\n       count(*) as signups,\n       count(*) filter (where email_confirmed_at is not null) as confirmed\nfrom auth.users\ngroup by 1\norder by 1",
        },
        display: {
          type: 'chart',
          chart: {
            type: 'line',
            x_axis: { field: 'day' },
            series: [
              { field: 'signups', label: 'Signups' },
              { field: 'confirmed', label: 'Confirmed' },
            ],
          },
        },
      },
      {
        id: 'cell-auth-errors',
        type: 'query',
        name: 'Recent authentication errors',
        query: {
          type: 'inline',
          source: {
            id: 'logs',
            parameters: { time_range: { type: 'relative', amount: 24, unit: 'hour' } },
          },
          sql: "select timestamp, event_message\nfrom logs\nwhere event_message ilike '%error%'\norder by timestamp desc",
        },
        display: { type: 'table' },
        execution: { row_limit: 50 },
      },
      {
        id: 'cell-active-users',
        type: 'query',
        name: 'Active database users',
        query: {
          type: 'inline',
          source: { id: 'database', parameters: { identifier: 'primary' } },
          sql: 'select id, email, created_at\nfrom auth.users\nwhere deleted_at is null\norder by created_at desc',
        },
        display: { type: 'table' },
      },
    ],
  },
}

export const INITIAL_SNIPPETS: Record<string, SnippetDoc> = {
  'snip-slow-queries': {
    id: 'snip-slow-queries',
    name: 'Slowest queries',
    contentType: 'sql',
    sql: 'select calls, mean_exec_time, query\nfrom pg_stat_statements\norder by mean_exec_time desc\nlimit 20',
    display: { type: 'table' },
  },
  'snip-edge-errors': {
    id: 'snip-edge-errors',
    name: 'Edge errors by hour',
    contentType: 'log_sql',
    sql: 'select toStartOfHour(timestamp) as hour, count(*) as errors\nfrom logs\nwhere status_code >= 500\ngroup by hour\norder by hour',
    display: {
      type: 'chart',
      chart: {
        type: 'bar',
        x_axis: { field: 'hour' },
        series: [{ field: 'errors', label: 'Errors' }],
      },
    },
  },
}

export const INITIAL_CHATS: Record<string, ChatSession> = {
  'chat-1': {
    id: 'chat-1',
    name: 'Debugging signups',
    messages: [
      { id: 'm1', role: 'user', text: 'Why did signups drop off last week?' },
      {
        id: 'm2',
        role: 'assistant',
        text: "Let's start by looking at daily signups alongside confirmation rate. I can run this for you:",
      },
      {
        id: 'm3',
        role: 'assistant',
        approval: 'pending',
        cell: {
          id: 'agent-cell-1',
          type: 'query',
          name: 'Signups vs confirmations, last 14 days',
          query: {
            type: 'inline',
            source: { id: 'database', parameters: { identifier: 'primary' } },
            sql: "select date_trunc('day', created_at)::date as day,\n       count(*) as signups,\n       count(*) filter (where email_confirmed_at is not null) as confirmed\nfrom auth.users\nwhere created_at > now() - interval '14 days'\ngroup by 1\norder by 1",
          },
          display: {
            type: 'chart',
            chart: {
              type: 'bar',
              x_axis: { field: 'day' },
              series: [
                { field: 'signups', label: 'Signups' },
                { field: 'confirmed', label: 'Confirmed' },
              ],
            },
          },
        },
      },
    ],
  },
}

export const INITIAL_TABS: Tab[] = [
  {
    id: 'tab-nb',
    title: 'Authentication health',
    resource: { type: 'notebook', id: 'nb-auth-health' },
  },
  {
    id: 'tab-snip',
    title: 'Slowest queries',
    resource: { type: 'snippet', id: 'snip-slow-queries' },
  },
  { id: 'tab-chat', title: 'Debugging signups', resource: { type: 'chat', id: 'chat-1' } },
]

/** Seeded so the "Recent" group isn't empty on first load. Mixed across types. */
export const INITIAL_RECENT_ITEMS: RecentItem[] = [
  {
    resource: { type: 'notebook', id: 'nb-auth-health' },
    modifiedAt: Date.now() - 4 * 60_000,
  },
  {
    resource: { type: 'chat', id: 'chat-1' },
    modifiedAt: Date.now() - 26 * 60_000,
  },
  {
    resource: { type: 'snippet', id: 'snip-slow-queries' },
    modifiedAt: Date.now() - 3 * 3_600_000,
  },
  {
    resource: { type: 'snippet', id: 'snip-edge-errors' },
    modifiedAt: Date.now() - 2 * 86_400_000,
  },
]

// ---------------------------------------------------------------------------
// Fake execution
// ---------------------------------------------------------------------------

const DAYS = 14

const buildSignupRows = (): ResultRow[] =>
  Array.from({ length: DAYS }, (_, index) => {
    const date = new Date(Date.now() - (DAYS - 1 - index) * 86_400_000)
    const signups = Math.round(120 + Math.sin(index / 2) * 40 + index * 4)
    return {
      day: date.toISOString().slice(0, 10),
      signups,
      confirmed: Math.round(signups * (0.62 + (index % 3) * 0.05)),
    }
  })

const buildLogRows = (): ResultRow[] =>
  Array.from({ length: 24 }, (_, index) => {
    const stamp = new Date(Date.now() - index * 3_600_000)
    return {
      timestamp: stamp.toISOString(),
      event_message: [
        'AuthApiError: Invalid login credentials',
        'AuthApiError: Email rate limit exceeded',
        'error: token has expired or is invalid',
      ][index % 3],
    }
  })

const buildHourlyErrorRows = (): ResultRow[] =>
  Array.from({ length: 24 }, (_, index) => {
    const stamp = new Date(Date.now() - (23 - index) * 3_600_000)
    return {
      hour: stamp.toISOString().slice(0, 13).replace('T', ' ') + ':00',
      errors: Math.max(0, Math.round(18 + Math.sin(index / 3) * 12 - (index % 5))),
    }
  })

const buildUserRows = (): ResultRow[] =>
  Array.from({ length: 40 }, (_, index) => ({
    id: `8f14e45f-ceea-467a-9f1a-${String(index).padStart(12, '0')}`,
    email: `user${index + 1}@example.com`,
    created_at: new Date(Date.now() - index * 5_400_000).toISOString(),
  }))

const buildSlowQueryRows = (): ResultRow[] => [
  { calls: 12_408, mean_exec_time: 812.4, query: 'select * from orders where customer_id = $1' },
  {
    calls: 3_201,
    mean_exec_time: 431.9,
    query: 'select count(*) from events where created_at > $1',
  },
  {
    calls: 890,
    mean_exec_time: 288.1,
    query: 'update inventory set stock = stock - $1 where id = $2',
  },
  { calls: 22_910, mean_exec_time: 96.3, query: 'select id, email from auth.users where id = $1' },
]

export const isWriteQuery = (sql: string) =>
  /^\s*(insert|update|delete|drop|alter|truncate|create)\b/i.test(sql)

export type MockRunOutcome =
  | { status: 'success'; rows: ResultRow[] }
  | { status: 'error'; message: string }

/** Picks canned rows by keyword. Stands in for a real endpoint call. */
export const runMockQuery = async ({
  source,
  sql,
  rowLimit,
}: {
  source: CellSource
  sql: string
  rowLimit: number
}): Promise<MockRunOutcome> => {
  await new Promise((resolve) => setTimeout(resolve, 420))

  const normalized = sql.toLowerCase()

  if (normalized.includes('nonexistent_table')) {
    return { status: 'error', message: 'relation "nonexistent_table" does not exist' }
  }

  if (source.id === 'logs') {
    const rows = normalized.includes('count(') ? buildHourlyErrorRows() : buildLogRows()
    return { status: 'success', rows: rows.slice(0, rowLimit) }
  }

  if (normalized.includes('pg_stat_statements')) {
    return { status: 'success', rows: buildSlowQueryRows().slice(0, rowLimit) }
  }
  if (normalized.includes('group by')) {
    return { status: 'success', rows: buildSignupRows().slice(0, rowLimit) }
  }
  return { status: 'success', rows: buildUserRows().slice(0, rowLimit) }
}
