import dayjs from 'dayjs'

import type { IssueCell, IssueDocument, IssueResource } from '../issue-schema'
import { formatIssueResource } from '@/components/interfaces/Issues/Issues.utils'
import { timeRangeSchema } from '@/data/content/notebooks/notebook-schema'

// Canned Assistant replies so mentioning @Assistant can be exercised before the Assistant
// has issue tools. A real reply comes from an agent run that reads the issue, queries the
// project and posts back through the same comments API, in the same document format.

export type MockAssistantReply = {
  body: IssueDocument
  // The Assistant fixed the problem and resolves the issue along with its reply
  resolves: boolean
}

const FIX_REQUEST_PATTERN = /\b(fix|resolve)\b/i

const markdown = (text: string): IssueCell => ({ _tag: 'markdown_cell', text })

/** What the Assistant finds on the Data API error rate demo, and the fix when asked for it. */
function buildErrorRateReply({
  capturedAt,
  isFixRequest,
}: {
  capturedAt: string
  isFixRequest: boolean
}): MockAssistantReply {
  const lastHour = timeRangeSchema.parse({
    _tag: 'absolute_time_range',
    start: dayjs(capturedAt).subtract(1, 'hour').toISOString(),
    end: capturedAt,
  })

  if (!isFixRequest) {
    return {
      resolves: false,
      body: {
        schema_version: 1,
        cells: [
          markdown(
            'Most failing requests are 503s from `/rest/v1/orders` waiting for a database connection. The pool is at its limit of 60 because `rpc/create_checkout` holds each connection for about 1.4 s. That started with Sunday’s migration, which added foreign keys on `orders` and `order_items` without indexes.'
          ),
          {
            _tag: 'log_cell',
            title: 'Server errors by path in the last hour',
            sql: "select\n  log_attributes['request.path'] as path,\n  toInt32OrZero(log_attributes['response.status_code']) as status,\n  count() as requests\nfrom logs\nwhere source = 'edge_logs'\n  and toInt32OrZero(log_attributes['response.status_code']) between 500 and 599\ngroup by path, status\norder by requests desc\nlimit 10;",
            time_range: lastHour,
            snapshot: {
              captured_at: capturedAt,
              rows: [
                { path: '/rest/v1/orders', status: 503, requests: 1284 },
                { path: '/rest/v1/rpc/create_checkout', status: 503, requests: 412 },
                { path: '/rest/v1/products', status: 504, requests: 37 },
              ],
            },
          },
          markdown(
            'Adding the two missing indexes should bring checkout back to about 180 ms and the error rate under 1%. Ask me to fix it and I’ll add them and resolve this.'
          ),
        ],
      },
    }
  }

  const rates = [5.8, 5.4, 2.1, 0.4, 0.3]
  return {
    resolves: true,
    body: {
      schema_version: 1,
      cells: [
        markdown(
          'Added the two indexes Sunday’s migration missed, built concurrently so writes weren’t blocked:\n\n```sql\ncreate index concurrently orders_customer_id_idx on public.orders (customer_id);\ncreate index concurrently order_items_order_id_idx on public.order_items (order_id);\n```\n\n`rpc/create_checkout` is back to about 170 ms, and the error rate dropped under 1%:'
        ),
        {
          _tag: 'log_cell',
          title: 'Data API error rate (%) since the fix',
          sql: "select\n  toStartOfFiveMinutes(timestamp) as time,\n  round(100 * countIf(toInt32OrZero(log_attributes['response.status_code']) between 500 and 599) / count(), 2) as error_rate\nfrom logs\nwhere source = 'edge_logs'\n  and log_attributes['request.path'] like '/rest/v1/%'\ngroup by time\norder by time;",
          time_range: lastHour,
          snapshot: {
            captured_at: capturedAt,
            rows: rates.map((errorRate, index) => ({
              time: dayjs(capturedAt)
                .subtract((rates.length - 1 - index) * 5, 'minute')
                .format('HH:mm'),
              error_rate: errorRate,
            })),
          },
        },
        markdown('Resolving this. If the rate goes back above 1%, the check will reopen it.'),
      ],
    },
  }
}

export function buildMockAssistantReply({
  checkId,
  resource,
  capturedAt,
  request = '',
}: {
  checkId: string | undefined
  resource: IssueResource | null
  capturedAt: string
  // What the person asked when they mentioned the Assistant
  request?: string
}): MockAssistantReply {
  const target = resource ? formatIssueResource(resource) : 'this project'

  if (checkId === 'log_data_api_error_rate_high') {
    return buildErrorRateReply({ capturedAt, isFixRequest: FIX_REQUEST_PATTERN.test(request) })
  }

  if (checkId === 'rls_disabled_in_public') {
    const table = resource?.name ?? ''
    return {
      resolves: false,
      body: {
        schema_version: 1,
        cells: [
          {
            _tag: 'markdown_cell',
            text: `\`${target}\` is reachable through the Data API with RLS off. Both \`anon\` and \`authenticated\` can read and change every row:`,
          },
          {
            _tag: 'database_cell',
            title: `Grants on ${target}`,
            sql: `select grantee, string_agg(privilege_type, ', ') as privileges\nfrom information_schema.role_table_grants\nwhere table_schema = 'public' and table_name = '${table}'\ngroup by grantee;`,
            row_limit: 100,
            snapshot: {
              captured_at: capturedAt,
              rows: [
                { grantee: 'anon', privileges: 'SELECT, INSERT, UPDATE, DELETE' },
                { grantee: 'authenticated', privileges: 'SELECT, INSERT, UPDATE, DELETE' },
              ],
            },
          },
          {
            _tag: 'markdown_cell',
            text: `Clients read this table today, so enabling RLS on its own would make those reads return nothing. Enable it together with a policy:\n\n\`\`\`sql\nalter table ${target} enable row level security;\n\ncreate policy "Users can read their own rows"\non ${target} for select\nto authenticated\nusing ((select auth.uid()) = user_id);\n\`\`\``,
          },
        ],
      },
    }
  }

  if (checkId === 'unindexed_foreign_keys') {
    return {
      resolves: false,
      body: {
        schema_version: 1,
        cells: [
          {
            _tag: 'markdown_cell',
            text: `Lookups on \`${target}\` scan the whole table far more often than they use an index:`,
          },
          {
            _tag: 'database_cell',
            title: 'Scans per table',
            sql: `select relname, seq_scan, idx_scan\nfrom pg_stat_user_tables\nwhere relname = '${resource?.name ?? ''}';`,
            row_limit: 100,
            snapshot: {
              captured_at: capturedAt,
              rows: [{ relname: resource?.name ?? '', seq_scan: 48210, idx_scan: 312 }],
            },
          },
          {
            _tag: 'markdown_cell',
            text: `Build the index concurrently so writes aren't blocked:\n\n\`\`\`sql\ncreate index concurrently on ${target} (customer_id);\n\`\`\``,
          },
        ],
      },
    }
  }

  return {
    resolves: false,
    body: {
      schema_version: 1,
      cells: [
        markdown(
          `I looked at ${target} and the logs from the last 24 hours. The issue is still present, and nothing else changed around the time it was first seen. The steps in the description are the right place to start.`
        ),
      ],
    },
  }
}
