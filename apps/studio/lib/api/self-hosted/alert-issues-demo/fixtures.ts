/**
 * Rules, advisor findings and scripted investigation reports for the alert issues demo mode.
 * Content mirrors the live self-hosted demo (Logflare presets applied with Terraform).
 */

export type DemoNotebookCell = { title: string; source: 'database' | 'logs'; sql: string }

export type DemoRule = {
  rule_key: string
  name: string
  description: string
  category: 'security' | 'performance' | 'health'
  severity: 'critical' | 'major' | 'warning' | 'info'
  managed: boolean
  language: 'pg_sql' | 'lql'
  lql: string | null
  group_by: string[]
  previewLql: string | null
  notebook: DemoNotebookCell[]
  investigate: boolean
}

export type DemoAdvisorLint = {
  name: string
  title: string
  level: 'ERROR' | 'WARN' | 'INFO'
  category: 'security' | 'performance'
  description: string
  detail: string
  remediation: string
  metadata: { schema?: string; name?: string; entity?: string; type: string; fkey_name?: string }
}

const LINTER_DOCS = 'https://supabase.com/docs/guides/database/database-linter?lint='

export const ADVISOR_LINTS: DemoAdvisorLint[] = [
  {
    name: 'rls_disabled_in_public',
    title: 'RLS Disabled in Public',
    level: 'ERROR',
    category: 'security',
    description:
      'Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST',
    detail: 'Table `public.orders` is public, but RLS has not been enabled.',
    remediation: `${LINTER_DOCS}0013_rls_disabled_in_public`,
    metadata: { schema: 'public', name: 'orders', type: 'table' },
  },
  {
    name: 'policy_exists_rls_disabled',
    title: 'Policy Exists RLS Disabled',
    level: 'ERROR',
    category: 'security',
    description:
      'Detects cases where row level security (RLS) policies have been created, but RLS has not been enabled for the underlying table.',
    detail:
      'Table `public.invoices` has RLS policies but RLS is not enabled on the table. Policies include {"Owners can read invoices"}.',
    remediation: `${LINTER_DOCS}0007_policy_exists_rls_disabled`,
    metadata: { schema: 'public', name: 'invoices', type: 'table' },
  },
  {
    name: 'security_definer_view',
    title: 'Security Definer View',
    level: 'ERROR',
    category: 'security',
    description:
      'Detects views defined with the SECURITY DEFINER property. These views enforce Postgres permissions and row level security policies (RLS) of the view creator, rather than that of the querying user',
    detail: 'View `public.customer_summary` is defined with the SECURITY DEFINER property',
    remediation: `${LINTER_DOCS}0010_security_definer_view`,
    metadata: { schema: 'public', name: 'customer_summary', type: 'view' },
  },
  {
    name: 'function_search_path_mutable',
    title: 'Function Search Path Mutable',
    level: 'WARN',
    category: 'security',
    description: 'Detects functions where the search_path parameter is not set.',
    detail: 'Function `public.handle_new_user` has a role mutable search_path',
    remediation: `${LINTER_DOCS}0011_function_search_path_mutable`,
    metadata: { schema: 'public', name: 'handle_new_user', type: 'function' },
  },
  {
    name: 'auth_leaked_password_protection',
    title: 'Leaked Password Protection Disabled',
    level: 'WARN',
    category: 'security',
    description: 'Leaked password protection is currently disabled.',
    detail:
      'Supabase Auth prevents the use of compromised passwords by checking against HaveIBeenPwned.org. Enable this feature to enhance security.',
    remediation:
      'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection',
    metadata: { type: 'auth', entity: 'Auth' },
  },
  {
    name: 'auth_rls_initplan',
    title: 'Auth RLS Initialization Plan',
    level: 'WARN',
    category: 'performance',
    description:
      'Detects if calls to `current_setting()` and `auth.<function>()` in RLS policies are being unnecessarily re-evaluated for each row',
    detail:
      'Table `public.profiles` has a row level security policy `Users can view own profile` that re-evaluates current_setting() or auth.<function>() for each row. This produces suboptimal query performance at scale. Resolve the issue by replacing `auth.<function>()` with `(select auth.<function>())`.',
    remediation:
      'https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select',
    metadata: { schema: 'public', name: 'profiles', type: 'table' },
  },
  {
    name: 'multiple_permissive_policies',
    title: 'Multiple Permissive Policies',
    level: 'WARN',
    category: 'performance',
    description:
      'Detects if multiple permissive row level security policies are present on a table for the same `role` and `action` (e.g. insert).',
    detail:
      'Table `public.posts` has multiple permissive policies for role `authenticated` for action `SELECT`. Policies include `{"Anyone can read published posts","Authors can read own posts"}`',
    remediation: `${LINTER_DOCS}0006_multiple_permissive_policies`,
    metadata: { schema: 'public', name: 'posts', type: 'table' },
  },
  {
    name: 'unindexed_foreign_keys',
    title: 'Unindexed foreign keys',
    level: 'INFO',
    category: 'performance',
    description:
      'Identifies foreign key constraints without a covering index, which can impact database performance.',
    detail:
      'Table `public.order_items` has a foreign key `order_items_order_id_fkey` without a covering index. This can lead to suboptimal query performance.',
    remediation: `${LINTER_DOCS}0001_unindexed_foreign_keys`,
    metadata: {
      schema: 'public',
      name: 'order_items',
      type: 'table',
      fkey_name: 'order_items_order_id_fkey',
    },
  },
]

const POLICIES =
  'select policyname, permissive, roles, cmd, qual from pg_policies where schemaname = {{literal:schema}} and tablename = {{literal:table}};'
const ENABLE_RLS = 'alter table {{ident:schema}}.{{ident:table}} enable row level security;'

const ADVISOR_NOTEBOOKS: Record<string, [string, string][]> = {
  rls_disabled_in_public: [
    [
      'Rows readable with the anon key',
      'select count(*) as exposed_rows from {{ident:schema}}.{{ident:table}};',
    ],
    ['Enable RLS', ENABLE_RLS],
  ],
  policy_exists_rls_disabled: [
    ['Policies that are not enforced', POLICIES],
    ['Enable RLS', ENABLE_RLS],
  ],
  security_definer_view: [
    [
      'View definition',
      "select pg_get_viewdef(format('%I.%I', {{literal:schema}}, {{literal:table}})::regclass, true) as definition;",
    ],
    [
      'Run the view as the querying user',
      'alter view {{ident:schema}}.{{ident:table}} set (security_invoker = on);',
    ],
  ],
  function_search_path_mutable: [
    [
      'Function settings',
      'select p.proname, p.prosecdef as security_definer, p.proconfig from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = {{literal:schema}} and p.proname = {{literal:table}};',
    ],
    [
      'Pin the search_path',
      "alter function {{ident:schema}}.{{ident:table}}() set search_path = '';",
    ],
  ],
  auth_rls_initplan: [['Policies on this table', POLICIES]],
  multiple_permissive_policies: [['Overlapping permissive policies', POLICIES]],
  unindexed_foreign_keys: [
    [
      'Foreign key definition',
      "select conname, pg_get_constraintdef(c.oid) as definition from pg_constraint c where c.conrelid = format('%I.%I', {{literal:schema}}, {{literal:table}})::regclass and c.contype = 'f';",
    ],
    [
      'Sequential vs index scans',
      'select relname, seq_scan, idx_scan, n_live_tup from pg_stat_user_tables where schemaname = {{literal:schema}} and relname = {{literal:table}};',
    ],
  ],
}

const ADVISOR_SEVERITY = { ERROR: 'critical', WARN: 'warning', INFO: 'info' } as const

const advisorRule = (lint: DemoAdvisorLint): DemoRule => ({
  rule_key: `supabase.advisor.${lint.name}`,
  name: lint.title,
  description: lint.description,
  category: lint.category,
  severity: ADVISOR_SEVERITY[lint.level],
  managed: true,
  language: 'pg_sql',
  lql: null,
  group_by: ['entity'],
  previewLql: `f:advisor_lints name:${lint.name}`,
  notebook: (ADVISOR_NOTEBOOKS[lint.name] ?? []).map(([title, sql]) => ({
    title,
    source: 'database',
    sql,
  })),
  investigate: false,
})

export const DEMO_RULES: DemoRule[] = [
  {
    rule_key: 'supabase.edge-function-5xx',
    name: 'Edge Function errors',
    description: 'An Edge Function returned 5xx responses in the last hour.',
    category: 'health',
    severity: 'major',
    managed: true,
    language: 'pg_sql',
    lql: null,
    group_by: ['function_id'],
    previewLql: 'f:function_edge_logs m.function_id:{{function_id}} m.status_code:>=500',
    notebook: [],
    investigate: true,
  },
  {
    rule_key: 'supabase.edge-function-latency',
    name: 'Slow Edge Function responses',
    description: 'Edge Function requests took longer than 5 seconds.',
    category: 'performance',
    severity: 'major',
    managed: true,
    language: 'pg_sql',
    lql: null,
    group_by: ['function_id'],
    previewLql: 'f:function_edge_logs m.function_id:{{function_id}} m.execution_time_ms:>5000',
    notebook: [],
    investigate: false,
  },
  {
    rule_key: 'supabase.postgres-connections',
    name: 'Database connections near the limit',
    description: 'Postgres used more than 90% of max_connections for 5 minutes.',
    category: 'health',
    severity: 'critical',
    managed: true,
    language: 'pg_sql',
    lql: null,
    group_by: [],
    previewLql: null,
    notebook: [
      {
        title: 'Connections by application',
        source: 'database',
        sql: "select coalesce(nullif(application_name, ''), usename) as client, state, count(*) as connections from pg_stat_activity group by 1, 2 order by 3 desc;",
      },
    ],
    investigate: true,
  },
  ...ADVISOR_LINTS.map(advisorRule),
  {
    rule_key: 'custom.auth-rate-limits',
    name: 'Auth rate limits',
    description: 'Sign-in requests hit the Auth rate limit.',
    category: 'security',
    severity: 'warning',
    managed: false,
    language: 'lql',
    lql: 'f:auth_logs m.status:429',
    group_by: [],
    previewLql: 'f:auth_logs m.status:429',
    notebook: [],
    investigate: false,
  },
]

/**
 * Scripted stand-ins for the o11y-sre-agent's initial investigation reports. In the real flow
 * the agent investigates in tenant mode and Logflare posts its report as this comment.
 */
export const SCRIPTED_INVESTIGATION_REPORTS: Record<string, string> = {
  'supabase.edge-function-5xx': [
    '**Initial investigation**',
    '',
    '`stripe-webhook` started failing about 30 minutes ago: roughly 9 in 10 requests now return 500, 502 or 504, up from 3 in 10 over the previous week.',
    '',
    '- The 504s line up with `Error: Stripe API request timed out after 10000ms` in `function_logs`, so the function waits on Stripe until the gateway gives up.',
    '- Other functions are unaffected, and the project has no deploys in this window, so this looks upstream rather than a code change.',
    '',
    '**Suggested next steps**',
    '',
    '1. Check the Stripe status page for API latency.',
    '2. Add a timeout below 10s with retries and backoff around the Stripe call, and return 2xx to Stripe quickly so it stops retrying the webhook.',
  ].join('\n'),
  'supabase.postgres-connections': [
    '**Initial investigation**',
    '',
    'Connections reached 54 of 60 (`max_connections`), and most of them are idle sessions held by `postgrest` and a single application user.',
    '',
    '- Idle connections grew steadily after the last deploy, which points to a client that opens connections without returning them to its pool.',
    '- Queries are fast and there is no lock contention, so this is connection pressure rather than slow queries.',
    '',
    '**Suggested next steps**',
    '',
    '1. Run "Connections by application" below to see which client holds them.',
    '2. Route the application through the Supavisor transaction pooler, or lower its pool size.',
  ].join('\n'),
}
