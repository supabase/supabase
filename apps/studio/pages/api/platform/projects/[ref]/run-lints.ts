import { bff, getProjectDataPlane } from '@/lib/console-bff'

// [console fork] The hosted platform runs splinter lints server-side. We don't have
// that pipeline, so we run the most important security checks directly against the
// project DB (via its pg-meta) and return them in studio's lint shape. Covers: RLS
// disabled on public tables, RLS enabled with no policy, and SECURITY DEFINER views.
const LINT_SQL = `
with rls_disabled as (
  select c.relname as name, n.nspname as schema
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r' and n.nspname = 'public' and c.relrowsecurity = false
),
rls_no_policy as (
  select c.relname as name, n.nspname as schema
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r' and n.nspname = 'public' and c.relrowsecurity = true
    and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
),
sec_def_views as (
  select c.relname as name, n.nspname as schema
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'v' and n.nspname = 'public'
    and pg_get_viewdef(c.oid) ilike '%security_definer%'
),
unindexed_fks as (
  select distinct cl.relname as name, ns.nspname as schema
  from pg_constraint con
  join pg_class cl on cl.oid = con.conrelid
  join pg_namespace ns on ns.oid = cl.relnamespace
  where con.contype = 'f' and ns.nspname = 'public'
    and not exists (
      select 1 from pg_index i
      where i.indrelid = con.conrelid
        and (con.conkey[1]) = any (i.indkey[0:0])
    )
),
unused_indexes as (
  select relname as name, schemaname as schema
  from pg_stat_user_indexes
  where schemaname = 'public' and idx_scan = 0
)
select 'rls_disabled_in_public' as name, 'ERROR' as level, name as obj, schema from rls_disabled
union all
select 'policy_exists_rls_disabled', 'WARN', name, schema from rls_no_policy
union all
select 'security_definer_view', 'WARN', name, schema from sec_def_views
union all
select 'unindexed_foreign_keys', 'INFO', name, schema from unindexed_fks
union all
select 'unused_index', 'INFO', name, schema from unused_indexes
`

const META: Record<
  string,
  { title: string; description: string; categories: string[]; remediation: string }
> = {
  rls_disabled_in_public: {
    title: 'RLS Disabled in Public',
    description: 'Table is public but Row Level Security (RLS) has not been enabled.',
    categories: ['SECURITY'],
    remediation: 'Enable RLS on the table and add policies that match your access rules.',
  },
  policy_exists_rls_disabled: {
    title: 'RLS Enabled, No Policy',
    description: 'RLS is enabled but the table has no policies, so it is inaccessible.',
    categories: ['SECURITY'],
    remediation: 'Add at least one RLS policy, or disable RLS if the table is internal.',
  },
  security_definer_view: {
    title: 'Security Definer View',
    description: 'View is defined with SECURITY DEFINER, bypassing the querying user’s RLS.',
    categories: ['SECURITY'],
    remediation: 'Recreate the view without SECURITY DEFINER unless strictly required.',
  },
  unindexed_foreign_keys: {
    title: 'Unindexed Foreign Keys',
    description: 'Foreign key column has no covering index, which can slow joins and deletes.',
    categories: ['PERFORMANCE'],
    remediation: 'Add an index on the foreign key column(s).',
  },
  unused_index: {
    title: 'Unused Index',
    description: 'Index has never been scanned and may be unnecessary overhead on writes.',
    categories: ['PERFORMANCE'],
    remediation: 'Consider dropping the index if it is not needed.',
  },
}

export default bff({
  GET: async (req, res) => {
    const ref = String(req.query.ref ?? '')
    const dp = await getProjectDataPlane(req, ref)
    if (!dp) return res.status(200).json([]) // not running -> no lints

    try {
      const upstream = await fetch(`${dp.baseUrl}/pg/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: dp.serviceKey,
          Authorization: `Bearer ${dp.serviceKey}`,
        },
        body: JSON.stringify({ query: LINT_SQL }),
      })
      if (!upstream.ok) return res.status(200).json([])
      const rows = (await upstream.json()) as Array<{
        name: string
        level: string
        obj: string
        schema: string
      }>

      const lints = (Array.isArray(rows) ? rows : []).map((r) => {
        const m = META[r.name] ?? {
          title: r.name,
          description: '',
          categories: ['SECURITY'],
          remediation: '',
        }
        return {
          name: r.name,
          title: m.title,
          level: r.level,
          facing: 'EXTERNAL',
          categories: m.categories,
          description: m.description,
          detail: `\`${r.schema}.${r.obj}\` — ${m.description}`,
          remediation: m.remediation,
          metadata: { name: r.obj, type: 'table', schema: r.schema },
          cache_key: `${r.name}_${r.schema}_${r.obj}`,
        }
      })
      return res.status(200).json(lints)
    } catch {
      return res.status(200).json([])
    }
  },
})
