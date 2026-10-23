import dayjs from 'dayjs'

import type { IssueNotificationRule } from '../issue-notification-schema'
import {
  markdownDocument,
  type Issue,
  type IssueActor,
  type IssueAffectedResource,
  type IssueAssistantActor,
  type IssueCell,
  type IssueCheckDefinition,
  type IssueCheckRun,
  type IssueDismissReason,
  type IssueDocument,
  type IssueEpisode,
  type IssueEvent,
  type IssueSeverity,
  type IssueStatus,
  type IssueUserActor,
} from '../issue-schema'
import { buildMockAssistantReply } from './issues-mock-assistant'
import { getIssueCheckDefinition, ISSUE_CHECK_DEFINITIONS } from './issues-mock-checks'
import { applyIssueMutes, type PendingFinding } from './issues-mock-evaluation'
import {
  lintToIssueFinding,
  type IssueAffectedResourceDraft,
  type IssueDraft,
} from './lint-to-issue'
import type { Lint } from '@/data/lint/lint-query'

// Seed data for the mock Issues API. It tells one coherent story about a small commerce
// project so every source (advisor checks, people, their own agents and
// the Assistant) and every state shows up in the UI.

/** Stands in for whoever is signed in; resolved to the real profile when read. */
export const VIEWER_ID = 'viewer'

export const VIEWER_PLACEHOLDER: IssueUserActor = { type: 'user', id: VIEWER_ID, name: 'You' }

const VIEWER_REF = { id: VIEWER_ID, name: 'You' }

export const MOCK_ACTORS = {
  advisor: { type: 'system', id: 'supabase-advisor', name: 'Supabase Advisor' },
  assistant: { type: 'assistant', id: 'supabase-assistant', name: 'Supabase Assistant' },
  maya: { type: 'user', id: 'user-maya', name: 'Maya Chen' },
  tomas: { type: 'user', id: 'user-tomas', name: 'Tomás Rivera' },
} satisfies Record<string, IssueActor>

export const ASSISTANT: IssueAssistantActor = MOCK_ACTORS.assistant

export type StoredIssue = Omit<Issue, 'comment_count' | 'agents_working'>

export type MockIssuesDb = {
  version: number
  issues: StoredIssue[]
  events: IssueEvent[]
  // Oldest first, the last 20 per check
  runs: IssueCheckRun[]
  episodes: IssueEpisode[]
  // Findings waiting out their check's `fire_after_seconds`, by check ID and affected resource key
  pending: Record<string, Record<string, PendingFinding>>
  // Status changes an agent made that land with its reply
  scheduled: Array<{ issue_id: string; at: string; status: IssueStatus; actor: IssueActor }>
  disabled_check_ids: string[]
  notification_rules: IssueNotificationRule[]
}

export const MOCK_DB_VERSION = 10

const ERROR_RATE_CHECK_ID = 'log_data_api_error_rate_high'

type HoursAgo = (hours: number) => string

type SeedEpisode = {
  startHoursAgo: number
  endHoursAgo?: number
  runs: number
  peakValue?: number
}

type SeedAffectedResource = IssueAffectedResourceDraft & {
  firstSeenHoursAgo: number
  lastSeenHoursAgo: number
  occurrences: number
  isCleared?: boolean
  // Defaults to one episode from first to last seen
  episodes?: SeedEpisode[]
}

type SeedTimelineEntry = { hoursAgo: number; actor: IssueActor } & (
  | { type: 'comment'; body: IssueDocument }
  | {
      type: 'status_changed'
      from: IssueStatus
      to: IssueStatus
      dismiss_reason?: IssueDismissReason
      snoozed_until_hours?: number
    }
  | { type: 'severity_changed'; from: IssueSeverity; to: IssueSeverity }
)

type SeedIssue = {
  key: string
  draft: IssueDraft
  createdBy: IssueActor
  firstSeenHoursAgo: number
  // When the issue was filed, if later than first seen, e.g. after waiting out fire_after
  createdHoursAgo?: number
  lastSeenHoursAgo: number
  occurrences: number
  affected: SeedAffectedResource[]
  status?: IssueStatus
  dismissReason?: IssueDismissReason
  snoozedForHours?: number
  timeline?: SeedTimelineEntry[]
  // The seed this one was refiled after, once that one was past its check's reopen window
  previousKey?: string
}

const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

function lint(
  overrides: Pick<Lint, 'name' | 'title' | 'level' | 'detail' | 'description'> & {
    category: Lint['categories'][number]
    metadata: Lint['metadata']
  }
): Lint {
  const { category, metadata, ...rest } = overrides
  const entity = [metadata?.schema, metadata?.name ?? metadata?.entity].filter(Boolean).join('_')

  return {
    ...rest,
    categories: [category],
    metadata,
    facing: 'EXTERNAL',
    cache_key: `${overrides.name}_${entity}`,
    remediation: `https://supabase.com/docs/guides/database/database-linter?lint=${overrides.name}`,
  }
}

const rlsDisabled = (table: string) =>
  lint({
    name: 'rls_disabled_in_public',
    title: 'RLS Disabled in Public',
    level: 'ERROR',
    category: 'SECURITY',
    detail: `Table \\\`public.${table}\\\` is public, but RLS has not been enabled.`,
    description:
      'Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST.',
    metadata: { schema: 'public', name: table, type: 'table' },
  })

const mutableSearchPath = (fn: string) =>
  lint({
    name: 'function_search_path_mutable',
    title: 'Function Search Path Mutable',
    level: 'WARN',
    category: 'SECURITY',
    detail: `Function \\\`public.${fn}\\\` has a role mutable search_path.`,
    description: 'Detects functions where the search_path parameter is not set.',
    metadata: { schema: 'public', name: fn, type: 'function' },
  })

const unindexedForeignKey = (table: string, fkey: string) =>
  lint({
    name: 'unindexed_foreign_keys',
    title: 'Unindexed foreign keys',
    level: 'INFO',
    category: 'PERFORMANCE',
    detail: `Table \\\`public.${table}\\\` has a foreign key \\\`${fkey}\\\` without a covering index.`,
    description:
      'Identifies foreign key constraints without a covering index, which can impact database performance.',
    metadata: { schema: 'public', name: table, type: 'table', fkey_name: fkey },
  })

const singleLint = {
  leakedPasswords: lint({
    name: 'auth_leaked_password_protection',
    title: 'Leaked Password Protection Disabled',
    level: 'WARN',
    category: 'SECURITY',
    detail: 'Leaked password protection is currently disabled.',
    description:
      'Supabase Auth prevents the use of compromised passwords by checking against HaveIBeenPwned.org. Enable this feature to enhance security.',
    metadata: { type: 'auth', entity: 'Auth' },
  }),
  securityDefinerView: lint({
    name: 'security_definer_view',
    title: 'Security Definer View',
    level: 'ERROR',
    category: 'SECURITY',
    detail: 'View \\`public.order_summaries\\` is defined with the SECURITY DEFINER property.',
    description:
      'Detects views defined with the SECURITY DEFINER property. These views enforce Postgres permissions and row level security policies (RLS) of the view creator, rather than that of the querying user.',
    metadata: { schema: 'public', name: 'order_summaries', type: 'view' },
  }),
  extensionInPublic: lint({
    name: 'extension_in_public',
    title: 'Extension in Public',
    level: 'WARN',
    category: 'SECURITY',
    detail: 'Extension \\`pg_trgm\\` is installed in the public schema. Move it to another schema.',
    description: 'Detects extensions installed in the \\`public\\` schema.',
    metadata: { schema: 'public', name: 'pg_trgm', type: 'extension' },
  }),
  initPlanPosts: lint({
    name: 'auth_rls_initplan',
    title: 'Auth RLS Initialization Plan',
    level: 'WARN',
    category: 'PERFORMANCE',
    detail:
      'Table \\`public.posts\\` has a row level security policy \\`Users can view own posts\\` that re-evaluates auth.<function>() for each row.',
    description:
      'Detects if calls to \\`current_setting()\\` and \\`auth.<function>()\\` in RLS policies are being unnecessarily re-evaluated for each row. Replace \\`auth.<function>()\\` with \\`(select auth.<function>())\\`.',
    metadata: { schema: 'public', name: 'posts', type: 'table' },
  }),
  permissivePosts: lint({
    name: 'multiple_permissive_policies',
    title: 'Multiple Permissive Policies',
    level: 'WARN',
    category: 'PERFORMANCE',
    detail:
      'Table \\`public.posts\\` has multiple permissive policies for role \\`authenticated\\` for action \\`SELECT\\`.',
    description:
      'Detects if multiple permissive row level security policies are present on a table for the same role and action. Each policy must be executed for every relevant query.',
    metadata: { schema: 'public', name: 'posts', type: 'table' },
  }),
  unusedIndex: lint({
    name: 'unused_index',
    title: 'Unused Index',
    level: 'INFO',
    category: 'PERFORMANCE',
    detail: 'Index \\`idx_orders_created_at\\` on table \\`public.orders\\` has not been used.',
    description: 'Detects if an index has never been used and may be a candidate for removal.',
    metadata: { schema: 'public', name: 'orders', type: 'table' },
  }),
  duplicateIndex: lint({
    name: 'duplicate_index',
    title: 'Duplicate Index',
    level: 'WARN',
    category: 'PERFORMANCE',
    detail:
      'Table \\`public.products\\` has identical indexes \\`{products_sku_idx,products_sku_key}\\`.',
    description: 'Detects cases where two identical indexes exist. Drop all except one of them.',
    metadata: { schema: 'public', name: 'products', type: 'table' },
  }),
  dataApiErrors: lint({
    name: 'log_data_api_error_rate_high',
    title: 'Data API error rate is high',
    level: 'WARN',
    category: 'HEALTH',
    detail: 'Server errors are 4.2% of Data API requests over the last 15 minutes.',
    description:
      'Detects when the share of Data API requests that fail with a server error rises above normal levels.',
    metadata: { type: 'health', entity: 'Data API' },
  }),
}

const markdown = (text: string): IssueCell => ({ _tag: 'markdown_cell', text })

function buildSeedIssues(projectRef: string, at: HoursAgo): SeedIssue[] {
  const { advisor, assistant, maya, tomas } = MOCK_ACTORS
  const viewerViaAgent: IssueUserActor = { ...VIEWER_PLACEHOLDER, via: { client: 'Claude Code' } }
  const mayaViaAgent: IssueUserActor = { ...maya, via: { client: 'Cursor' } }

  /** One issue per check, one affected resource per lint row the check returned. */
  const checkIssue = (
    key: string,
    rows: Array<{
      lint: Lint
      firstSeenHoursAgo: number
      lastSeenHoursAgo?: number
      occurrences?: number
      isCleared?: boolean
      episodes?: SeedEpisode[]
    }>,
    seed: Pick<
      SeedIssue,
      'occurrences' | 'status' | 'dismissReason' | 'snoozedForHours' | 'timeline' | 'previousKey'
    >
  ): SeedIssue => {
    const findings = rows.map((row) => ({
      ...row,
      ...lintToIssueFinding({ lint: row.lint, projectRef }),
    }))
    const [first] = findings
    const affected = findings.map<SeedAffectedResource>((finding) => ({
      ...finding.affected,
      firstSeenHoursAgo: finding.firstSeenHoursAgo,
      lastSeenHoursAgo: finding.lastSeenHoursAgo ?? 0.4,
      occurrences: finding.occurrences ?? seed.occurrences,
      isCleared: finding.isCleared,
      episodes: finding.episodes,
    }))

    return {
      key,
      draft: first.issue,
      createdBy: advisor,
      firstSeenHoursAgo: Math.max(...affected.map((item) => item.firstSeenHoursAgo)),
      lastSeenHoursAgo: Math.min(...affected.map((item) => item.lastSeenHoursAgo)),
      affected,
      ...seed,
    }
  }

  const ordersTable = { type: 'table' as const, schema: 'public', name: 'orders' }

  return [
    checkIssue(
      'rls',
      [
        { lint: rlsDisabled('profiles'), firstSeenHoursAgo: 74, occurrences: 12 },
        { lint: rlsDisabled('invoices'), firstSeenHoursAgo: 30, occurrences: 5 },
        { lint: rlsDisabled('audit_events'), firstSeenHoursAgo: 6, occurrences: 1 },
      ],
      {
        occurrences: 12,
        timeline: [
          {
            type: 'comment',
            hoursAgo: 29,
            actor: maya,
            body: markdownDocument(
              'The mobile app reads `profiles` with the anon key, so we can’t just turn RLS on. @Assistant which columns does it need?'
            ),
          },
          {
            type: 'comment',
            hoursAgo: 28.9,
            actor: assistant,
            body: buildMockAssistantReply({
              checkId: 'rls_disabled_in_public',
              resource: { type: 'table', schema: 'public', name: 'profiles' },
              capturedAt: at(28.9),
            }).body,
          },
          {
            type: 'comment',
            hoursAgo: 25,
            actor: VIEWER_PLACEHOLDER,
            body: markdownDocument(
              'Policy looks right. I’ll ship it with the next mobile release so the app’s queries keep working.'
            ),
          },
        ],
      }
    ),
    {
      key: 'stuck-orders',
      draft: {
        title: 'Orders stuck in pending for more than 24 hours',
        body: {
          schema_version: 1,
          cells: [
            markdown(
              `Tomás asked me to run [Order pipeline checks](/project/${projectRef}/explorer/notebook/nb-order-pipeline) every night and file an issue if I find orders stuck in pending for more than 24 hours. I followed the notebook’s queries and review instructions.\n\nThe **Stuck orders** query returned 14 orders; the notebook says none should remain pending this long. I’m reporting this as a failed check. The oldest order is from Saturday morning, which lines up with the process-payment webhook timeouts.`
            ),
            {
              _tag: 'database_cell',
              title: 'Stuck orders',
              sql: "select id, customer_id, total, created_at\nfrom public.orders\nwhere status = 'pending'\n  and created_at < now() - interval '24 hours'\norder by created_at;",
              row_limit: 100,
              snapshot: {
                captured_at: at(4),
                rows: [
                  {
                    id: 18234,
                    customer_id: 'c_9f2a',
                    total: 129.0,
                    created_at: '2026-10-18 09:12:44+00',
                  },
                  {
                    id: 18241,
                    customer_id: 'c_17bd',
                    total: 64.5,
                    created_at: '2026-10-18 11:03:10+00',
                  },
                  {
                    id: 18266,
                    customer_id: 'c_a0e1',
                    total: 312.99,
                    created_at: '2026-10-18 16:47:02+00',
                  },
                  {
                    id: 18302,
                    customer_id: 'c_5c44',
                    total: 18.0,
                    created_at: '2026-10-19 08:20:51+00',
                  },
                  {
                    id: 18317,
                    customer_id: 'c_9f2a',
                    total: 42.25,
                    created_at: '2026-10-19 13:55:37+00',
                  },
                ],
              },
            },
          ],
        },
        severity: 'critical',
        category: 'data',
        origin: { type: 'manual' },
        fingerprint: 'agent:orders-pending-over-24h',
      },
      createdBy: { ...assistant, on_behalf_of: { id: tomas.id, name: tomas.name } },
      firstSeenHoursAgo: 52,
      lastSeenHoursAgo: 4,
      occurrences: 3,
      affected: [
        {
          key: 'orders-pending-over-24h',
          resource: ordersTable,
          detail: '14 orders have been pending for more than 24 hours',
          firstSeenHoursAgo: 52,
          lastSeenHoursAgo: 4,
          occurrences: 3,
        },
      ],
      timeline: [
        {
          type: 'comment',
          hoursAgo: 20,
          actor: tomas,
          body: markdownDocument(
            'All 14 have a payment intent but no webhook event. I think the provider retried while our endpoint was timing out and gave up.'
          ),
        },
      ],
    },
    checkIssue(
      'data-api-errors',
      [{ lint: singleLint.dataApiErrors, firstSeenHoursAgo: 9 + 5 / 60, lastSeenHoursAgo: 0 }],
      {
        occurrences: 47,
        previousKey: 'data-api-errors-earlier',
      }
    ),
    // The same check two weeks earlier: up for most of a day until a rollback, then resolved.
    // Today's errors came long after its reopen window, so they're a new issue linked to it.
    checkIssue(
      'data-api-errors-earlier',
      [
        {
          lint: singleLint.dataApiErrors,
          firstSeenHoursAgo: 15 * 24 + 22,
          lastSeenHoursAgo: 15 * 24 + 3,
          isCleared: true,
        },
      ],
      {
        occurrences: 228,
        status: 'resolved',
        timeline: [
          {
            type: 'comment',
            hoursAgo: 15 * 24 + 3.5,
            actor: maya,
            body: markdownDocument(
              'Rolled back yesterday’s deploy. The new `order_totals` view was timing out under load.'
            ),
          },
          {
            type: 'status_changed',
            hoursAgo: 15 * 24 + 2,
            actor: advisor,
            from: 'open',
            to: 'resolved',
          },
        ],
      }
    ),
    checkIssue(
      'search-path',
      [
        { lint: mutableSearchPath('handle_new_user'), firstSeenHoursAgo: 300 },
        { lint: mutableSearchPath('update_updated_at'), firstSeenHoursAgo: 300 },
        {
          lint: mutableSearchPath('search_products'),
          firstSeenHoursAgo: 300,
          lastSeenHoursAgo: 90,
          isCleared: true,
        },
      ],
      {
        occurrences: 40,
        timeline: [
          {
            type: 'comment',
            hoursAgo: 91,
            actor: maya,
            body: markdownDocument(
              'Pinned the search path on `search_products`. The other two are next.'
            ),
          },
        ],
      }
    ),
    checkIssue('leaked-passwords', [{ lint: singleLint.leakedPasswords, firstSeenHoursAgo: 500 }], {
      occurrences: 62,
    }),
    {
      key: 'checkout-latency',
      draft: {
        title: 'Checkout queries slowed down after Sunday’s migration',
        body: {
          schema_version: 1,
          cells: [
            markdown(
              'p95 latency for `rpc/create_checkout` went from 180 ms to 1.4 s after migration `20261019_split_order_items`. Both foreign keys added in that migration are missing indexes (see {{fk}}), so every checkout scans `orders` and `order_items`.'
            ),
            {
              _tag: 'database_cell',
              title: 'Slowest statements since the migration',
              sql: 'select left(query, 60) as query, calls, round(mean_exec_time) as mean_ms\nfrom pg_stat_statements\norder by mean_exec_time desc\nlimit 3;',
              row_limit: 100,
              snapshot: {
                captured_at: at(40),
                rows: [
                  {
                    query: 'select * from order_items where order_id = $1',
                    calls: 18422,
                    mean_ms: 812,
                  },
                  {
                    query: 'select * from orders where customer_id = $1 order by',
                    calls: 9310,
                    mean_ms: 455,
                  },
                  {
                    query: 'update orders set status = $1 where id = $2',
                    calls: 4021,
                    mean_ms: 12,
                  },
                ],
              },
            },
          ],
        },
        severity: 'warning',
        category: 'performance',
        origin: { type: 'manual' },
        fingerprint: 'manual:checkout-latency',
      },
      createdBy: { ...assistant, on_behalf_of: VIEWER_REF },
      firstSeenHoursAgo: 40,
      lastSeenHoursAgo: 40,
      occurrences: 1,
      affected: [],
      timeline: [
        {
          type: 'comment',
          hoursAgo: 12,
          actor: VIEWER_PLACEHOLDER,
          body: markdownDocument('Adding both indexes in tonight’s maintenance window.'),
        },
      ],
    },
    checkIssue(
      'fk',
      [
        {
          lint: unindexedForeignKey('orders', 'orders_customer_id_fkey'),
          firstSeenHoursAgo: 150,
          // Fixed before the issue resolved, then lost when Sunday's migration rebuilt orders
          episodes: [
            { startHoursAgo: 150, endHoursAgo: 120, runs: 30 },
            { startHoursAgo: 41, runs: 41 },
          ],
        },
        {
          lint: unindexedForeignKey('order_items', 'order_items_order_id_fkey'),
          firstSeenHoursAgo: 41,
        },
      ],
      {
        occurrences: 9,
        timeline: [
          { type: 'status_changed', hoursAgo: 120, actor: advisor, from: 'open', to: 'resolved' },
          { type: 'status_changed', hoursAgo: 41, actor: advisor, from: 'resolved', to: 'open' },
        ],
      }
    ),
    {
      key: 'service-key-rotation',
      draft: {
        title: 'Rotate the service role key used by staging scripts',
        body: markdownDocument(
          'A staging seed script committed last week included the production `service_role` key. The file is gone, but the key is still in git history.\n\nRotate the key, then update the CI secret and the two scheduled functions that read it. [Open API keys](/project/' +
            projectRef +
            '/settings/api-keys)'
        ),
        severity: 'warning',
        category: 'security',
        origin: { type: 'manual' },
        fingerprint: 'manual:service-key-rotation',
      },
      createdBy: maya,
      firstSeenHoursAgo: 22,
      lastSeenHoursAgo: 22,
      occurrences: 1,
      affected: [],
      timeline: [
        {
          type: 'comment',
          hoursAgo: 18,
          actor: tomas,
          body: markdownDocument(
            'I’ll rotate it after the release freeze lifts on Thursday. Nothing outside CI uses it.'
          ),
        },
      ],
    },
    {
      key: 'send-receipt',
      draft: {
        title: 'Edge Function `send-receipt` runs out of retries when email sending times out',
        body: {
          schema_version: 1,
          cells: [
            markdown(
              '37 invocations of `send-receipt` in the last 24 hours hit the 3-retry limit. Each failure is a 10 s timeout calling the email provider, so customers never get a receipt.\n\nLower the provider timeout to 5 s and send through a queue so a slow provider doesn’t hold up the request.'
            ),
            {
              _tag: 'log_cell',
              title: 'send-receipt server errors',
              sql: "-- send-receipt server errors\nselect\n  timestamp,\n  toInt32OrZero(log_attributes['response.status_code']) as status,\n  log_attributes['execution_time_ms'] as execution_time_ms\nfrom logs\nwhere source = 'function_edge_logs'\n  and log_attributes['function_id'] = 'send-receipt'\n  and toInt32OrZero(log_attributes['response.status_code']) >= 500\norder by timestamp desc\nlimit 100;",
              time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 24 },
              snapshot: {
                captured_at: at(3),
                rows: [
                  {
                    timestamp: '2026-10-21T06:41:09.120000',
                    status: 504,
                    execution_time_ms: '10012',
                  },
                  {
                    timestamp: '2026-10-21T06:12:55.441000',
                    status: 504,
                    execution_time_ms: '10004',
                  },
                  {
                    timestamp: '2026-10-21T05:58:30.902000',
                    status: 504,
                    execution_time_ms: '10021',
                  },
                  {
                    timestamp: '2026-10-21T04:03:17.336000',
                    status: 504,
                    execution_time_ms: '10008',
                  },
                ],
              },
            },
          ],
        },
        severity: 'warning',
        category: 'health',
        origin: { type: 'manual' },
        fingerprint: 'manual:send-receipt-retries',
      },
      createdBy: viewerViaAgent,
      firstSeenHoursAgo: 3,
      lastSeenHoursAgo: 3,
      occurrences: 1,
      affected: [
        {
          key: 'edge_function:send-receipt',
          resource: { type: 'edge_function', name: 'send-receipt' },
          detail: null,
          firstSeenHoursAgo: 3,
          lastSeenHoursAgo: 3,
          occurrences: 1,
        },
      ],
    },
    checkIssue('initplan', [{ lint: singleLint.initPlanPosts, firstSeenHoursAgo: 200 }], {
      occurrences: 30,
    }),
    checkIssue('permissive', [{ lint: singleLint.permissivePosts, firstSeenHoursAgo: 200 }], {
      occurrences: 30,
    }),
    checkIssue('unused-index', [{ lint: singleLint.unusedIndex, firstSeenHoursAgo: 400 }], {
      occurrences: 55,
    }),
    checkIssue('extension', [{ lint: singleLint.extensionInPublic, firstSeenHoursAgo: 600 }], {
      occurrences: 70,
      status: 'snoozed',
      snoozedForHours: 24 * 6,
      timeline: [
        {
          type: 'status_changed',
          hoursAgo: 20,
          actor: VIEWER_PLACEHOLDER,
          from: 'open',
          to: 'snoozed',
          snoozed_until_hours: 24 * 6,
        },
        {
          type: 'comment',
          hoursAgo: 20,
          actor: VIEWER_PLACEHOLDER,
          body: markdownDocument(
            'Moving `pg_trgm` needs the search indexes rebuilt. Revisit after the search rewrite next week.'
          ),
        },
      ],
    }),
    {
      key: 'signups-drop',
      draft: {
        title: 'Daily signups dropped 41% against the 7-day average',
        body: {
          schema_version: 1,
          cells: [
            markdown(
              `Maya asked me to review signups each morning using [Growth daily](/project/${projectRef}/explorer/notebook/nb-growth-daily) and report unexpected drops. I ran the notebook and assessed the results against its guidance to flag a drop of more than 30% below the trailing 7-day average. Yesterday had 241 signups against an average of 409, so I’m flagging the drop for review.`
            ),
            {
              _tag: 'database_cell',
              title: 'Daily signups',
              sql: "select date_trunc('day', created_at)::date as day, count(*) as signups\nfrom auth.users\nwhere created_at > now() - interval '8 days'\ngroup by 1\norder by 1;",
              row_limit: 100,
              view: 'chart',
              chart: {
                type: 'bar',
                x_column: 'day',
                y_series: ['signups'],
                cumulative: false,
                scale: 'linear',
                show_labels: false,
              },
              snapshot: {
                captured_at: at(9),
                rows: [
                  { day: '2026-10-14', signups: 412 },
                  { day: '2026-10-15', signups: 398 },
                  { day: '2026-10-16', signups: 431 },
                  { day: '2026-10-17', signups: 405 },
                  { day: '2026-10-18', signups: 388 },
                  { day: '2026-10-19', signups: 420 },
                  { day: '2026-10-20', signups: 241 },
                ],
              },
            },
          ],
        },
        severity: 'warning',
        category: 'data',
        origin: { type: 'manual' },
        fingerprint: 'agent:daily-signup-drop',
      },
      createdBy: mayaViaAgent,
      firstSeenHoursAgo: 9,
      lastSeenHoursAgo: 9,
      occurrences: 1,
      affected: [],
      status: 'dismissed',
      dismissReason: 'not_relevant',
      timeline: [
        {
          type: 'comment',
          hoursAgo: 7,
          actor: tomas,
          body: markdownDocument(
            'Marketing paused the referral campaign on Monday, so this drop is expected.'
          ),
        },
        {
          type: 'status_changed',
          hoursAgo: 7,
          actor: tomas,
          from: 'open',
          to: 'dismissed',
          dismiss_reason: 'not_relevant',
        },
      ],
    },
    checkIssue(
      'security-definer-view',
      [
        {
          lint: singleLint.securityDefinerView,
          firstSeenHoursAgo: 160,
          lastSeenHoursAgo: 60,
          isCleared: true,
        },
      ],
      {
        occurrences: 8,
        status: 'resolved',
        timeline: [
          {
            type: 'comment',
            hoursAgo: 62,
            actor: maya,
            body: markdownDocument('Recreated the view with `security_invoker = true`.'),
          },
          { type: 'status_changed', hoursAgo: 59, actor: advisor, from: 'open', to: 'resolved' },
        ],
      }
    ),
    checkIssue(
      'duplicate-index',
      [
        {
          lint: singleLint.duplicateIndex,
          firstSeenHoursAgo: 260,
          lastSeenHoursAgo: 100,
          isCleared: true,
        },
      ],
      {
        occurrences: 12,
        status: 'resolved',
        timeline: [
          { type: 'status_changed', hoursAgo: 99, actor: advisor, from: 'open', to: 'resolved' },
        ],
      }
    ),
  ]
}

const ERROR_RATE_SQL =
  "-- Data API error rate per 5 minutes\nselect\n  toStartOfFiveMinutes(timestamp) as time,\n  round(100 * countIf(toInt32OrZero(log_attributes['response.status_code']) between 500 and 599) / count(), 2) as error_rate\nfrom logs\nwhere source = 'edge_logs'\n  and log_attributes['request.path'] like '/rest/v1/%'\ngroup by time\norder by time;"

// The error-rate demo: up for 45 minutes this morning, back to normal (and resolved an hour
// later), then up again for the last 45 minutes
const ERROR_RATE_DEMO = {
  firstStart: 6 + 5 / 60,
  firstEnd: 5 + 20 / 60,
  secondStart: 45 / 60,
  // The rate in each five-minute check of each period
  firstRates: [2.8, 3.9, 4.6, 4.4, 4.1, 3.7, 3.3, 2.6, 1.8],
  secondRates: [2.1, 3.4, 4.8, 5.6, 6.4, 6.1, 5.9, 6.2, 5.7, 5.8],
  // Normal levels between them
  baselineRates: [0.3, 0.2, 0.4, 0.3, 0.5, 0.2],
  seriesHours: 8,
}

/**
 * The check's own series every 5 minutes for the demo's last 8 hours, kept with the body as
 * a snapshot so the chart shows both periods without running against the project's logs.
 */
function buildErrorRateSeries(at: HoursAgo) {
  const { firstStart, secondStart, firstRates, secondRates, baselineRates, seriesHours } =
    ERROR_RATE_DEMO
  const firstStartMinutes = Math.round(firstStart * 60)
  const secondStartMinutes = Math.round(secondStart * 60)

  return Array.from({ length: (seriesHours * 60) / 5 + 1 }, (_, index) => {
    const minutesAgo = seriesHours * 60 - index * 5
    const firstIndex = (firstStartMinutes - minutesAgo) / 5
    const secondIndex = (secondStartMinutes - minutesAgo) / 5
    const rate = firstRates[firstIndex] ?? secondRates[secondIndex] ?? baselineRates[index % 6]
    return { time: dayjs(at(minutesAgo / 60)).format('HH:mm'), error_rate: rate }
  })
}

/**
 * A day of the Data API error rate check: failing, then passing, then failing again, with
 * nothing else in the timeline so mentioning the Assistant in a demo shows up clearly.
 */
function withErrorRateDay(seed: SeedIssue, at: HoursAgo): SeedIssue {
  if (seed.key !== 'data-api-errors') return seed
  const { advisor } = MOCK_ACTORS
  const { firstStart, firstEnd, secondStart, firstRates, secondRates } = ERROR_RATE_DEMO
  const secondRuns = secondRates.length

  return {
    ...seed,
    firstSeenHoursAgo: firstStart,
    createdHoursAgo: firstStart - 5 / 60,
    occurrences: firstRates.length + secondRuns,
    affected: seed.affected.map((item) => ({
      ...item,
      firstSeenHoursAgo: firstStart,
      detail: 'Server errors are 5.8% of Data API requests over the last 5 minutes.',
      value: secondRates.at(-1),
      threshold: 1,
      unit: '%',
      episodes: [
        {
          startHoursAgo: firstStart,
          endHoursAgo: firstEnd,
          runs: firstRates.length,
          peakValue: Math.max(...firstRates),
        },
        { startHoursAgo: secondStart, runs: secondRuns, peakValue: Math.max(...secondRates) },
      ],
    })),
    timeline: [
      {
        type: 'status_changed',
        hoursAgo: firstEnd - 1,
        actor: advisor,
        from: 'open',
        to: 'resolved',
      },
      {
        type: 'status_changed',
        hoursAgo: secondStart - 5 / 60,
        actor: advisor,
        from: 'resolved',
        to: 'open',
      },
    ],
    draft: {
      ...seed.draft,
      title: 'Data API error rate elevated',
      body: {
        schema_version: 1,
        cells: [
          markdown(
            'More than 1% of Data API requests are failing with a server error. This check looks at the last 5 minutes of API logs every 5 minutes. It flags the rate after 5 minutes above 1% and clears it after 10 minutes below. If the rate stays down for an hour, the issue resolves.\n\nEach period above 1% shows in the activity with how long it lasted and how high it got.'
          ),
          {
            _tag: 'log_cell',
            title: 'Data API error rate (%)',
            sql: ERROR_RATE_SQL,
            time_range: {
              _tag: 'relative_time_range',
              unit: 'hour',
              amount: ERROR_RATE_DEMO.seriesHours,
            },
            snapshot: { captured_at: at(0), rows: buildErrorRateSeries(at) },
            view: 'chart',
            chart: {
              type: 'line',
              x_column: 'time',
              y_series: ['error_rate'],
              cumulative: false,
              scale: 'linear',
              show_labels: false,
            },
          },
        ],
      },
    },
  }
}

export function buildSeedDb(projectRef: string, now = dayjs()): MockIssuesDb {
  const at: HoursAgo = (hoursAgo) => now.subtract(Math.round(hoursAgo * 60), 'minute').toISOString()
  const seeds = buildSeedIssues(projectRef, at).map((seed) => withErrorRateDay(seed, at))
  const idByKey = new Map(seeds.map((seed) => [seed.key, createId('iss')]))

  // Bodies reference other seeds as {{key}}; they become links to that issue
  const linkIssues = (document: IssueDocument): IssueDocument => ({
    ...document,
    cells: document.cells.map((cell) => {
      if (cell._tag !== 'markdown_cell') return cell
      return {
        ...cell,
        text: cell.text.replace(/\{\{([\w-]+)\}\}/g, (match, key: string) => {
          const id = idByKey.get(key)
          const title = seeds.find((seed) => seed.key === key)?.draft.title
          return id && title ? `[${title}](/project/${projectRef}/issues/${id})` : match
        }),
      }
    }),
  })

  const issues: StoredIssue[] = []
  const events: IssueEvent[] = []
  const episodes: IssueEpisode[] = []

  for (const seed of seeds) {
    const id = idByKey.get(seed.key)!
    const status = seed.status ?? 'open'
    const lastStatusChange = [...(seed.timeline ?? [])]
      .reverse()
      .find((entry) => entry.type === 'status_changed')
    const { origin } = seed.draft
    const check = origin.type === 'check' ? getIssueCheckDefinition(origin.check_id) : undefined

    const affected = seed.affected.map((item): IssueAffectedResource => {
      const affectedId = createId('res')
      const resourceEpisodes = item.episodes ?? [
        {
          startHoursAgo: item.firstSeenHoursAgo,
          endHoursAgo: item.isCleared ? item.lastSeenHoursAgo : undefined,
          runs: item.occurrences,
        },
      ]
      for (const episode of resourceEpisodes) {
        episodes.push({
          id: createId('epi'),
          issue_id: id,
          affected_id: affectedId,
          started_at: at(episode.startHoursAgo),
          ended_at: episode.endHoursAgo === undefined ? null : at(episode.endHoursAgo),
          failing_run_count: episode.runs,
          peak_value: episode.peakValue ?? item.value ?? null,
        })
      }
      const currentEpisode = resourceEpisodes.at(-1)

      return {
        id: affectedId,
        key: item.key,
        resource: item.resource,
        detail: item.detail,
        severity: item.severity ?? seed.draft.severity,
        value: item.value ?? null,
        threshold: item.threshold ?? null,
        unit: item.unit ?? null,
        status: item.isCleared ? 'cleared' : 'open',
        first_seen_at: at(item.firstSeenHoursAgo),
        last_seen_at: at(item.lastSeenHoursAgo),
        last_evaluated_at: at(check ? lastRunHoursAgo(check) : item.lastSeenHoursAgo),
        failing_since: item.isCleared || !currentEpisode ? null : at(currentEpisode.startHoursAgo),
        passing_since: null,
        muted: null,
      }
    })
    const snoozedUntil = seed.snoozedForHours ? at(-seed.snoozedForHours) : null
    const dismissReason = seed.dismissReason ?? null

    issues.push({
      ...seed.draft,
      body: linkIssues(seed.draft.body),
      id,
      previous_issue_id: seed.previousKey ? (idByKey.get(seed.previousKey) ?? null) : null,
      status,
      affected: applyIssueMutes({
        affected,
        issue: { status, dismiss_reason: dismissReason, snoozed_until: snoozedUntil },
        actor: lastStatusChange?.actor ?? seed.createdBy,
        now: at(lastStatusChange?.hoursAgo ?? seed.lastSeenHoursAgo),
      }),
      created_by: seed.createdBy,
      occurrence_count: seed.occurrences,
      first_seen_at: at(seed.firstSeenHoursAgo),
      last_seen_at: at(seed.lastSeenHoursAgo),
      created_at: at(seed.createdHoursAgo ?? seed.firstSeenHoursAgo),
      updated_at: at(
        Math.min(seed.lastSeenHoursAgo, ...(seed.timeline ?? []).map((entry) => entry.hoursAgo))
      ),
      resolved_at: status === 'resolved' && lastStatusChange ? at(lastStatusChange.hoursAgo) : null,
      snoozed_until: snoozedUntil,
      dismiss_reason: dismissReason,
    })

    const base = (hoursAgo: number, actor: IssueActor) => ({
      id: createId('evt'),
      issue_id: id,
      actor,
      created_at: at(hoursAgo),
    })

    events.push({
      ...base(seed.createdHoursAgo ?? seed.firstSeenHoursAgo, seed.createdBy),
      type: 'created',
    })

    for (const entry of seed.timeline ?? []) {
      const eventBase = base(entry.hoursAgo, entry.actor)
      switch (entry.type) {
        case 'comment':
          events.push({ ...eventBase, type: 'comment', body: linkIssues(entry.body) })
          break
        case 'severity_changed':
          events.push({ ...eventBase, type: 'severity_changed', from: entry.from, to: entry.to })
          break
        case 'status_changed':
          events.push({
            ...eventBase,
            type: 'status_changed',
            from: entry.from,
            to: entry.to,
            dismiss_reason: entry.dismiss_reason ?? null,
            snoozed_until: entry.snoozed_until_hours
              ? at(entry.hoursAgo - entry.snoozed_until_hours)
              : null,
          })
          break
      }
    }
  }

  // The earlier issue notes when the check filed the next one
  for (const seed of seeds) {
    const previousId = seed.previousKey && idByKey.get(seed.previousKey)
    if (!previousId) continue
    events.push({
      id: createId('evt'),
      issue_id: previousId,
      actor: MOCK_ACTORS.advisor,
      created_at: at(seed.createdHoursAgo ?? seed.firstSeenHoursAgo),
      type: 'recurred',
      next_issue_id: idByKey.get(seed.key)!,
    })
  }

  return {
    version: MOCK_DB_VERSION,
    issues,
    events,
    runs: buildSeedRuns(issues, at),
    episodes,
    pending: {},
    scheduled: [],
    disabled_check_ids: [],
    notification_rules: [],
  }
}

/** When each check last ran: recently enough that none of them look stale. */
function lastRunHoursAgo(check: IssueCheckDefinition) {
  if (check.id === ERROR_RATE_CHECK_ID) return 0
  if (check.interval_seconds === null) return 0.4
  return Math.min(0.4, check.interval_seconds / 3600 / 2)
}

/** Every check's latest scheduled run, plus the error-rate demo's full history. */
function buildSeedRuns(issues: StoredIssue[], at: HoursAgo): IssueCheckRun[] {
  const scheduledRun = (
    check: IssueCheckDefinition,
    hoursAgo: number,
    findingCount: number
  ): IssueCheckRun => ({
    id: createId('run'),
    check_id: check.id,
    trigger: 'schedule',
    actor: MOCK_ACTORS.advisor,
    scope: { type: 'full' },
    status: findingCount > 0 ? 'failed' : 'passed',
    error: null,
    window: check.window_seconds
      ? { start: at(hoursAgo + check.window_seconds / 3600), end: at(hoursAgo) }
      : null,
    finding_count: findingCount,
    started_at: at(hoursAgo),
    finished_at: at(hoursAgo),
  })

  return ISSUE_CHECK_DEFINITIONS.flatMap((check) => {
    // The demo's last 20 runs: passing, then failing since its second period started
    if (check.id === ERROR_RATE_CHECK_ID) {
      return Array.from({ length: 20 }, (_, index) =>
        scheduledRun(
          check,
          ((19 - index) * 5) / 60,
          index >= 20 - ERROR_RATE_DEMO.secondRates.length ? 1 : 0
        )
      )
    }
    const issue = issues.find(
      ({ origin }) => origin.type === 'check' && origin.check_id === check.id
    )
    const openCount = issue?.affected.filter(({ status }) => status === 'open').length ?? 0
    return [scheduledRun(check, lastRunHoursAgo(check), openCount)]
  }).sort((a, b) => a.started_at.localeCompare(b.started_at))
}
