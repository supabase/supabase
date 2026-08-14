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
    settings: { run_mode: 'on_open', default_row_limit: 100 },
    cells: [
      {
        id: 'cell-heading',
        type: 'markdown',
        markdown: '## Authentication health',
      },
      {
        id: 'cell-signups-context',
        type: 'markdown',
        markdown:
          '### 1. Establish the baseline\n\nThis chart compares daily account creation with confirmed email addresses. A widening gap suggests users are arriving but not completing the confirmation step; a decline in both lines points to acquisition or availability instead.',
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
        id: 'cell-auth-errors-context',
        type: 'markdown',
        markdown:
          '### 2. Look for delivery and callback failures\n\nReview the most recent authentication errors after checking the trend. The log query is limited to 50 rows so common failures are easy to scan without drowning out the newest incidents.',
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
        id: 'cell-active-users-context',
        type: 'markdown',
        markdown:
          '### 3. Inspect the affected cohort\n\nUse this final table to spot recently created accounts that may need closer investigation. It is deliberately a lightweight sample; add provider or confirmation fields here if the earlier blocks indicate a specific failure mode.',
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

export const INITIAL_CHATS: Record<string, ChatSession> = {
  'chat-1': {
    id: 'chat-1',
    name: 'Debugging signups',
    messages: [
      { id: 'm1', role: 'user', text: 'Why did signups drop off last week?' },
      {
        id: 'm2',
        role: 'assistant',
        text: `The drop starts on Tuesday and is concentrated in new email-password signups. The strongest change is in confirmation rate, not traffic.

I would compare daily signups with confirmations first, then split the result by provider if the gap persists.`,
      },
      {
        id: 'm3',
        role: 'user',
        text: 'Can you check whether it is also affecting OAuth signups?',
      },
      {
        id: 'm4',
        role: 'assistant',
        text: 'Yes — I will compare the last 14 days across signup methods and confirmation status.',
      },
      {
        id: 'm5',
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
  'chat-2': {
    id: 'chat-2',
    name: 'Turn signup analysis into a notebook',
    messages: [
      {
        id: 'n1',
        role: 'user',
        text: 'Turn the signup investigation into a notebook I can build on.',
      },
      {
        id: 'n2',
        role: 'assistant',
        text: 'I assembled the investigation with the baseline comparison, an OAuth cut, and follow-up notes.',
      },
      {
        id: 'n3',
        role: 'assistant',
        approval: 'pending',
        notebook: {
          title: 'Signup investigation',
          content: {
            schema_version: 1,
            settings: { run_mode: 'manual', default_row_limit: 100 },
            cells: [
              {
                id: 'agent-notebook-heading',
                type: 'markdown',
                markdown:
                  '## Signup investigation\n\nCompare signup volume and email confirmation rate over the last 14 days.',
              },
              {
                id: 'agent-notebook-query-overview',
                type: 'query',
                name: 'Signups vs confirmations',
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
              {
                id: 'agent-notebook-observation',
                type: 'markdown',
                markdown:
                  '### What to look for\n\nCompare the confirmation gap against the provider breakdown below before changing the signup flow.',
              },
              {
                id: 'agent-notebook-query-oauth',
                type: 'query',
                name: 'OAuth signups by provider',
                query: {
                  type: 'inline',
                  source: { id: 'database', parameters: { identifier: 'primary' } },
                  sql: "select raw_app_meta_data->>'provider' as provider,\n       count(*) as signups\nfrom auth.users\nwhere created_at > now() - interval '14 days'\ngroup by 1\norder by 2 desc",
                },
                display: { type: 'table' },
              },
              {
                id: 'agent-notebook-next-steps',
                type: 'markdown',
                markdown:
                  '### Next steps\n\n- Review confirmation delivery failures\n- Compare the same window to the previous fortnight\n- Add a provider-level funnel if OAuth is also affected',
              },
            ],
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
  { id: 'tab-chat', title: 'Debugging signups', resource: { type: 'chat', id: 'chat-1' } },
  {
    id: 'tab-chat-notebook',
    title: 'Turn signup analysis into a notebook',
    resource: { type: 'chat', id: 'chat-2' },
  },
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
    resource: { type: 'chat', id: 'chat-2' },
    modifiedAt: Date.now() - 44 * 60_000,
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
