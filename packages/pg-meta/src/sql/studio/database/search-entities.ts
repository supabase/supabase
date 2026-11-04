import { DEFAULT_SYSTEM_SCHEMAS } from '../../../constants'
import { escapeIlikeLiteral } from '../../../helpers'
import { joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

// Postgres identifiers are capped at 63 bytes, so a longer search string can
// never match a name. Callers should skip the request entirely in that case.
export const SEARCH_ENTITIES_MAX_QUERY_LENGTH = 63

// How many name matches are considered before the (comparatively expensive)
// privilege checks run. Kept well above `limit` so that the odd relation the
// role can't access doesn't starve the result set.
const CANDIDATE_LIMIT = 50

// Mirrors what the table list endpoints expose: the role owns the table or has
// some privilege on it (or one of its columns).
const hasTableAccess = (oid: SafeSqlFragment, owner: SafeSqlFragment) => safeSql`(
  pg_has_role(${owner}, 'USAGE')
  or has_table_privilege(
    ${oid},
    'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
  )
  or has_any_column_privilege(${oid}, 'SELECT, INSERT, UPDATE, REFERENCES')
)`

// Name matches rank by policy name. Policies pulled in through a matched table
// group by that table first (in the table's own order), then by policy name.
const POLICY_ORDER = safeSql`source, rank, table_sort_length, table_sort_name, length(name), name, table_name`

export type SearchEntitiesTable = {
  id: number
  schema: string
  name: string
  rls_enabled: boolean
  policy_count: number
}

export type SearchEntitiesPolicy = {
  id: number
  name: string
  command: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  schema: string
  table: string
  table_id: number
}

export type SearchEntitiesFunction = {
  id: number
  schema: string
  name: string
  type: 'function' | 'procedure'
  args: string
}

export type SearchEntitiesResult = {
  tables: SearchEntitiesTable[]
  policies: SearchEntitiesPolicy[]
  functions: SearchEntitiesFunction[]
}

/**
 * Name search across database entities, for the command menu.
 *
 * This runs on (debounced) keystrokes against the user's live catalog, so it is
 * built to stay cheap on very large catalogs:
 * - The substring match is the only work done per pg_class row. A leading-
 *   wildcard ILIKE can't use pg_class_relname_nsp_index, so one filtered seq
 *   scan of pg_class is structurally unavoidable (see the plan-guard test).
 * - Candidates are capped in a MATERIALIZED CTE so privilege checks and policy
 *   counts only ever run on a bounded set of rows, never the whole catalog.
 * - Policy counts are index probes on pg_policy (polrelid, polname).
 * - No size functions, column/constraint enrichment, or definition rendering.
 *
 * A query containing a dot is also treated as `schema.name`: the schema must
 * start with the part before the first dot and the name must contain the part
 * after it, so `public.colors` and `pub.colors` both find `public.colors`. The
 * full query is still matched against names too, since names may contain dots.
 *
 * Returns a single row with one JSON array per entity type, so other entity
 * types (functions, triggers) can be added without changing the response
 * shape.
 */
export const getSearchEntitiesSql = ({
  query,
  limit = 5,
}: {
  query: string
  limit?: number
}): SafeSqlFragment => {
  const dotIndex = query.indexOf('.')
  const schemaPart = dotIndex === -1 ? undefined : query.slice(0, dotIndex)
  const namePart = dotIndex === -1 ? query : query.slice(dotIndex + 1)

  // `schema.name` queries match a schema prefix and a name substring, and the
  // full query is still matched against the name alone since names may contain dots
  const getMatchFilter = (nameColumn: SafeSqlFragment, schemaColumn: SafeSqlFragment) => {
    const nameFilter = safeSql`${nameColumn} ilike ${literal(`%${escapeIlikeLiteral(query)}%`)}`
    if (schemaPart === undefined) return nameFilter
    return safeSql`(
          ${nameFilter}
          or (
            ${schemaColumn} ilike ${literal(`${escapeIlikeLiteral(schemaPart)}%`)}
            and ${nameColumn} ilike ${literal(`%${escapeIlikeLiteral(namePart)}%`)}
          )
        )`
  }
  const tableMatchFilter = getMatchFilter(safeSql`c.relname`, safeSql`nc.nspname`)
  const functionMatchFilter = getMatchFilter(safeSql`p.proname`, safeSql`n.nspname`)

  // Rank on the name part, so `public.colors` ranks the `colors` table first
  const prefixPattern = literal(`${escapeIlikeLiteral(namePart)}%`)
  const exactName = literal(namePart.toLowerCase())
  const excludedSchemas = joinSqlFragments(
    DEFAULT_SYSTEM_SCHEMAS.map((schema) => literal(schema)),
    ', '
  )

  const policyNamePattern = literal(`%${escapeIlikeLiteral(query)}%`)
  const policyPrefixPattern = literal(`${escapeIlikeLiteral(query)}%`)
  const policyExactName = literal(query.toLowerCase())

  return safeSql`
    with table_candidates as materialized (
      select
        c.oid,
        c.relname,
        c.relowner,
        c.relrowsecurity,
        nc.nspname,
        case
          when lower(c.relname) = ${exactName} then 0
          when c.relname ilike ${prefixPattern} then 1
          else 2
        end as rank
      from pg_class c
      join pg_namespace nc on nc.oid = c.relnamespace
      where c.relkind in ('r', 'p')
        and not c.relispartition
        and nc.nspname not in (${excludedSchemas})
        and not pg_is_other_temp_schema(nc.oid)
        and ${tableMatchFilter}
      order by rank, length(c.relname), c.relname
      limit ${literal(CANDIDATE_LIMIT)}
    ),
    matched_tables as (
      select
        tc.oid,
        tc.oid::int8 as id,
        tc.nspname as schema,
        tc.relname as name,
        tc.relrowsecurity as rls_enabled,
        (select count(*) from pg_policy pol where pol.polrelid = tc.oid)::int as policy_count,
        tc.rank
      from table_candidates tc
      where ${hasTableAccess(safeSql`tc.oid`, safeSql`tc.relowner`)}
      order by tc.rank, length(tc.relname), tc.relname
      limit ${literal(limit)}
    ),
    policy_name_candidates as materialized (
      select
        pol.oid,
        pol.polname,
        pol.polcmd,
        pol.polrelid as table_oid,
        c.relname,
        c.relowner,
        nc.nspname,
        case
          when lower(pol.polname) = ${policyExactName} then 0
          when pol.polname ilike ${policyPrefixPattern} then 1
          else 2
        end as rank
      from pg_policy pol
      -- offset 0 keeps this a per-policy probe of pg_class_oid_index. Without it a
      -- broad search lets the planner hash-join a second full pass of pg_class.
      cross join lateral (
        select c.relname, c.relowner, c.relnamespace
        from pg_class c
        where c.oid = pol.polrelid
        offset 0
      ) c
      join pg_namespace nc on nc.oid = c.relnamespace
      where pol.polname ilike ${policyNamePattern}
        and nc.nspname not in (${excludedSchemas})
        and not pg_is_other_temp_schema(nc.oid)
      order by rank, length(pol.polname), pol.polname
      limit ${literal(CANDIDATE_LIMIT)}
    ),
    policy_matches as (
      select
        pnc.oid::int8 as id,
        pnc.polname as name,
        pnc.polcmd as cmd,
        pnc.nspname as schema,
        pnc.relname as table_name,
        pnc.table_oid::int8 as table_id,
        0 as source,
        pnc.rank,
        0 as table_sort_length,
        '' as table_sort_name
      from policy_name_candidates pnc
      where ${hasTableAccess(safeSql`pnc.table_oid`, safeSql`pnc.relowner`)}

      union all

      select
        pol.oid::int8,
        pol.polname,
        pol.polcmd,
        mt.schema,
        mt.name,
        mt.id,
        1,
        mt.rank,
        length(mt.name),
        mt.name
      from matched_tables mt
      cross join lateral (
        select p.oid, p.polname, p.polcmd
        from pg_policy p
        where p.polrelid = mt.oid
        order by p.polname
        limit ${literal(limit)}
      ) pol
    ),
    matched_policies as (
      select *
      from (
        select distinct on (pm.id) pm.*
        from policy_matches pm
        order by pm.id, pm.source
      ) deduped
      order by ${POLICY_ORDER}
      limit ${literal(limit)}
    ),
    -- Built once from the pg_depend reference index (cost follows extension members,
    -- not matches). A per-row not exists probe is slower and can seq scan pg_depend.
    extension_functions as materialized (
      select d.objid
      from pg_depend d
      where d.refclassid = 'pg_extension'::regclass
        and d.refobjid in (select e.oid from pg_extension e)
        and d.classid = 'pg_proc'::regclass
        and d.deptype = 'e'
    ),
    function_candidates as materialized (
      select
        p.oid,
        p.proname,
        p.proowner,
        p.prokind,
        n.nspname,
        case
          when lower(p.proname) = ${exactName} then 0
          when p.proname ilike ${prefixPattern} then 1
          else 2
        end as rank
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where p.prokind in ('f', 'p')
        and n.nspname not in (${excludedSchemas})
        and not pg_is_other_temp_schema(n.oid)
        and p.oid not in (select objid from extension_functions)
        and ${functionMatchFilter}
      order by rank, length(p.proname), p.proname
      limit ${literal(CANDIDATE_LIMIT)}
    ),
    matched_functions as (
      select fc.oid, fc.nspname, fc.proname, fc.prokind, fc.rank
      from function_candidates fc
      where pg_has_role(fc.proowner, 'USAGE') or has_function_privilege(fc.oid, 'EXECUTE')
      order by fc.rank, length(fc.proname), fc.proname, fc.nspname
      limit ${literal(limit)}
    )
    select
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', t.id,
              'schema', t.schema,
              'name', t.name,
              'rls_enabled', t.rls_enabled,
              'policy_count', t.policy_count
            )
            order by t.rank, length(t.name), t.name
          )
          from matched_tables t
        ),
        '[]'::jsonb
      ) as tables,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', p.id,
              'name', p.name,
              'command', case p.cmd
                when 'r' then 'SELECT'
                when 'a' then 'INSERT'
                when 'w' then 'UPDATE'
                when 'd' then 'DELETE'
                else 'ALL'
              end,
              'schema', p.schema,
              'table', p.table_name,
              'table_id', p.table_id
            )
            order by ${POLICY_ORDER}
          )
          from matched_policies p
        ),
        '[]'::jsonb
      ) as policies,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', f.oid::int8,
              'schema', f.nspname,
              'name', f.proname,
              'type', case f.prokind when 'p' then 'procedure' else 'function' end,
              'args', pg_get_function_identity_arguments(f.oid)
            )
            order by f.rank, length(f.proname), f.proname, f.nspname
          )
          from matched_functions f
        ),
        '[]'::jsonb
      ) as functions
  `
}
