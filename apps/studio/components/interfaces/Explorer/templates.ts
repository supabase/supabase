import { buildSecurityAuditCells } from './security-audit-template'
import { createLogCellSkeleton, createMarkdownCellSkeleton, createQueryCellSkeleton } from './utils'
import type { AgentCell, AgentNotebook } from '@/data/content/notebooks/notebook-schema'
import type { Notebooks } from '@/types'

export type NotebookTemplate = {
  /** Stable id the Assistant uses to add a template, so it never retypes the cells. */
  id: string
  title: string
  buildCells: () => Notebooks.Content['cells']
}

export const NOTEBOOK_TEMPLATES = [
  {
    id: 'database_health_check',
    title: 'Database health check',
    buildCells: () => [
      createMarkdownCellSkeleton({
        content: [
          '# Database health check',
          '',
          'A quick look at table sizes, index usage, and dead tuples — good to run before a scaling decision or when queries feel slower than usual.',
        ].join('\n'),
      }),
      createMarkdownCellSkeleton({
        content: [
          '### Largest tables',
          '',
          "Tables ranked by total size (table plus its indexes), with a live row estimate. Use it to spot which tables are actually driving disk usage, and whether a table's row count justifies its size — a small table with a disproportionately large total size usually means bloat or over-indexing.",
        ].join('\n'),
      }),
      createQueryCellSkeleton({
        title: 'Largest tables',
        sql: [
          'select',
          '  schemaname,',
          '  relname as table_name,',
          '  pg_size_pretty(pg_total_relation_size(relid)) as total_size,',
          '  pg_size_pretty(pg_relation_size(relid)) as table_size,',
          '  n_live_tup as row_estimate',
          'from pg_stat_user_tables',
          'order by pg_total_relation_size(relid) desc',
          'limit 20;',
        ].join('\n'),
      }),
      createMarkdownCellSkeleton({
        content: [
          '### Unused indexes',
          '',
          "Indexes that have never been used by a query (`index_scans = 0`) since statistics were last reset, sized so you can see what dropping them would reclaim. Every index also has a write cost, so a large, never-scanned index is usually a good candidate to remove — just confirm it isn't a uniqueness/FK constraint you still need.",
        ].join('\n'),
      }),
      createQueryCellSkeleton({
        title: 'Unused indexes',
        sql: [
          'select',
          '  schemaname,',
          '  relname as table_name,',
          '  indexrelname as index_name,',
          '  idx_scan as index_scans,',
          '  pg_size_pretty(pg_relation_size(indexrelid)) as index_size',
          'from pg_stat_user_indexes',
          'where idx_scan = 0',
          'order by pg_relation_size(indexrelid) desc',
          'limit 20;',
        ].join('\n'),
      }),
      createMarkdownCellSkeleton({
        content: [
          '### Tables with the most dead tuples',
          '',
          'Dead tuples are rows left behind by updates/deletes until autovacuum reclaims them; a high count relative to live rows means autovacuum is falling behind, which slows down queries and grows table size. Check `last_autovacuum` here — if it looks stale on a table with a lot of dead tuples, that table may need a manual `VACUUM` or a more aggressive autovacuum setting.',
        ].join('\n'),
      }),
      createQueryCellSkeleton({
        title: 'Tables with the most dead tuples',
        sql: [
          'select',
          '  schemaname,',
          '  relname as table_name,',
          '  n_live_tup,',
          '  n_dead_tup,',
          '  last_autovacuum',
          'from pg_stat_user_tables',
          'where n_dead_tup > 0',
          'order by n_dead_tup desc',
          'limit 20;',
        ].join('\n'),
      }),
      createMarkdownCellSkeleton({
        content: [
          '### Recent database errors and warnings',
          '',
          "Postgres log lines from the last day at `WARNING` severity or above. Use it to cross-check the tables above against what's actually going wrong at query time — e.g. repeated deadlocks or out-of-memory errors on a table that also showed up as bloated or oversized here.",
        ].join('\n'),
      }),
      createLogCellSkeleton({
        title: 'Recent database errors and warnings',
        sql: [
          '-- recent database errors and warnings',
          "select timestamp, event_message, log_attributes['parsed.error_severity'] as severity",
          'from logs',
          "where source = 'postgres_logs'",
          "  and log_attributes['parsed.error_severity'] in ('ERROR', 'FATAL', 'PANIC', 'WARNING')",
          'order by timestamp desc',
          'limit 50',
        ].join('\n'),
        time_range: { _tag: 'relative_time_range', unit: 'day', amount: 1 },
      }),
      createMarkdownCellSkeleton({
        content: [
          '## Notes',
          '',
          '- Any tables above growing faster than expected?',
          '- Any indexes with zero scans worth dropping?',
        ].join('\n'),
      }),
    ],
  },
  {
    id: 'user_growth',
    title: 'User growth',
    buildCells: () => [
      createMarkdownCellSkeleton({
        content: [
          '# User growth',
          '',
          'Signups, active users, and retention over time, plus recent auth activity — a starting point for tracking how your user base is trending.',
        ].join('\n'),
      }),
      createMarkdownCellSkeleton({
        content: [
          '### Signups and active users',
          '',
          "The basic trend lines: `new_users` counts fresh signups each week from `auth.users.created_at`, while `active_users` counts distinct users who signed in at all that week (`last_sign_in_at`). Look for growth stalling, or active users flattening even while signups keep climbing — a sign new users aren't sticking around.",
        ].join('\n'),
      }),
      {
        ...createQueryCellSkeleton({
          title: 'Signups per week',
          sql: [
            'select',
            "  date_trunc('week', created_at) as signup_week,",
            '  count(*) as new_users',
            'from auth.users',
            'group by signup_week',
            'order by signup_week desc',
            'limit 52;',
          ].join('\n'),
        }),
        view: 'chart',
        chart: {
          type: 'line',
          x_column: 'signup_week',
          y_series: ['new_users'],
          cumulative: false,
          scale: 'linear',
          show_labels: false,
        },
      },
      createQueryCellSkeleton({
        title: 'Weekly active users',
        sql: [
          'select',
          "  date_trunc('week', last_sign_in_at) as week,",
          '  count(distinct id) as active_users',
          'from auth.users',
          'where last_sign_in_at is not null',
          'group by week',
          'order by week desc',
          'limit 52;',
        ].join('\n'),
      }),
      createMarkdownCellSkeleton({
        content: [
          '### Retention cohorts',
          '',
          'Each row groups users by the week they signed up (`signup_week`), then shows how many of them came back in the weeks that followed (`weeks_since_signup`). `retained_pct` is the share of that cohort still active in that week — a fast drop-off in the first couple of rows usually points to an onboarding problem.',
        ].join('\n'),
      }),
      createQueryCellSkeleton({
        title: 'Retention cohorts (weekly)',
        sql: [
          'with cohorts as (',
          "  select id as user_id, date_trunc('week', created_at) as signup_week",
          '  from auth.users',
          '),',
          'cohort_sizes as (',
          '  select signup_week, count(*) as cohort_size',
          '  from cohorts',
          '  group by signup_week',
          '),',
          'activity as (',
          "  select user_id, date_trunc('week', created_at) as active_week",
          '  from auth.sessions',
          '),',
          'retention as (',
          '  select',
          '    c.signup_week,',
          '    round(extract(epoch from (a.active_week - c.signup_week)) / 604800)::int',
          '      as weeks_since_signup,',
          '    count(distinct a.user_id) as retained_users',
          '  from cohorts c',
          '  join activity a using (user_id)',
          '  where a.active_week >= c.signup_week',
          '  group by c.signup_week, weeks_since_signup',
          ')',
          'select',
          '  r.signup_week,',
          '  r.weeks_since_signup,',
          '  r.retained_users,',
          '  cs.cohort_size,',
          '  round(r.retained_users::numeric / cs.cohort_size * 100, 1) as retained_pct',
          'from retention r',
          'join cohort_sizes cs using (signup_week)',
          'order by r.signup_week desc, r.weeks_since_signup',
          'limit 200;',
        ].join('\n'),
      }),
      createMarkdownCellSkeleton({
        content: [
          '### Auth activity by endpoint',
          '',
          "Raw request counts per auth endpoint and outcome, straight from the auth logs. Use it to sanity-check the numbers above against what's actually happening at the API level — e.g. a `signup`/`400` count that's high relative to successful signups points to a broken signup flow rather than a genuine drop in interest.",
        ].join('\n'),
      }),
      createLogCellSkeleton({
        title: 'Auth activity by endpoint',
        sql: [
          '-- signups and logins by endpoint and outcome',
          'select',
          "  log_attributes['path'] as path,",
          "  log_attributes['status'] as status,",
          '  count() as events',
          'from logs',
          "where source = 'auth_logs'",
          'group by path, status',
          'order by events desc',
          'limit 50',
        ].join('\n'),
        time_range: { _tag: 'relative_time_range', unit: 'day', amount: 7 },
      }),
      createMarkdownCellSkeleton({
        content: [
          '## Notes',
          '',
          '- Is growth trending in the direction you expect?',
          '- Which signup cohorts are retaining well, and which drop off fastest?',
          '- Any auth endpoints with an unusually high failure rate?',
        ].join('\n'),
      }),
    ],
  },
  {
    id: 'security_audit',
    title: 'Security audit',
    buildCells: buildSecurityAuditCells,
  },
] as const satisfies readonly NotebookTemplate[]

export type NotebookTemplateId = (typeof NOTEBOOK_TEMPLATES)[number]['id']

export const NOTEBOOK_TEMPLATE_IDS = NOTEBOOK_TEMPLATES.map((template) => template.id) as [
  NotebookTemplateId,
  ...NotebookTemplateId[],
]

const toAgentCell = (cell: Notebooks.Content['cells'][number]): AgentCell => {
  switch (cell._tag) {
    case 'markdown_cell':
      return { _tag: cell._tag, text: cell.text }
    case 'database_cell': {
      const { _id, unchecked_sql, ...rest } = cell
      return { ...rest, sql: unchecked_sql }
    }
    case 'log_cell': {
      const { _id, unchecked_sql, ...rest } = cell
      return { ...rest, sql: unchecked_sql }
    }
  }
}

/**
 * A template as `create_notebook` input, so the Assistant's template tool can reuse the
 * create proposal (preview and approval) and the server can save it the same way.
 */
export const buildTemplateNotebook = (
  id: NotebookTemplateId
): { name: string; content: AgentNotebook } => {
  const template = NOTEBOOK_TEMPLATES.find((template) => template.id === id)
  if (!template) throw new Error(`Unknown notebook template: ${id}`)

  return {
    name: template.title,
    content: { schema_version: 1, cells: template.buildCells().map(toAgentCell) },
  }
}
