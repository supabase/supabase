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
// some privilege on it (or one of its columns). Triggers are listed through
// information_schema.triggers, which does not count SELECT.
const hasTableAccess = (
  oid: SafeSqlFragment,
  owner: SafeSqlFragment,
  { includeSelect = true }: { includeSelect?: boolean } = {}
) => {
  const tablePrivileges = includeSelect
    ? safeSql`'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'`
    : safeSql`'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'`
  const columnPrivileges = includeSelect
    ? safeSql`'SELECT, INSERT, UPDATE, REFERENCES'`
    : safeSql`'INSERT, UPDATE, REFERENCES'`
  return safeSql`(
  pg_has_role(${owner}, 'USAGE')
  or has_table_privilege(${oid}, ${tablePrivileges})
  or has_any_column_privilege(${oid}, ${columnPrivileges})
)`
}

// For things that hang off a table (policies, triggers). Name matches rank by
// their own name. Ones pulled in through a matched table group by that table
// first (in the table's own order), then by their own name.
const TABLE_RELATED_ORDER = safeSql`source, rank, table_sort_length, table_sort_name, length(name), name, table_name`

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

export type SearchEntitiesTrigger = {
  id: number
  name: string
  activation: 'BEFORE' | 'AFTER' | 'INSTEAD OF'
  events: Array<'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE'>
  schema: string
  table: string
  table_id: number
  // Set only when the trigger was found because its function matched the search
  matched_function: string | null
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
  triggers: SearchEntitiesTrigger[]
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

  const triggerNamePattern = literal(`%${escapeIlikeLiteral(query)}%`)
  const triggerPrefixPattern = literal(`${escapeIlikeLiteral(query)}%`)
  const triggerExactName = literal(query.toLowerCase())

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
        tc.relowner,
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
      order by ${TABLE_RELATED_ORDER}
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
    ),
    trigger_name_candidates as materialized (
      select
        t.oid,
        t.tgname,
        t.tgtype,
        t.tgfoid,
        t.tgrelid as table_oid,
        c.relname,
        c.relowner,
        nc.nspname,
        case
          when lower(t.tgname) = ${triggerExactName} then 0
          when t.tgname ilike ${triggerPrefixPattern} then 1
          when t.tgname ilike ${triggerNamePattern} then 2
          else 3
        end as rank
      from pg_trigger t
      -- Same per-row pg_class_oid_index probe as the policy candidates above
      cross join lateral (
        select c.relname, c.relowner, c.relnamespace
        from pg_class c
        where c.oid = t.tgrelid
        offset 0
      ) c
      join pg_namespace nc on nc.oid = c.relnamespace
      -- pg_trigger has no index on tgfoid, so matching by function shares this single
      -- pass over pg_trigger instead of adding a second one. Triggers that only match
      -- through their function (rank 3) sort after the name matches.
      where not t.tgisinternal
        and (t.tgname ilike ${triggerNamePattern} or t.tgfoid in (select oid from matched_functions))
        and nc.nspname not in (${excludedSchemas})
        and not pg_is_other_temp_schema(nc.oid)
      order by rank, length(t.tgname), t.tgname
      limit ${literal(CANDIDATE_LIMIT)}
    ),
    trigger_matches as (
      select
        tnc.oid::int8 as id,
        tnc.tgname as name,
        tnc.tgtype,
        tnc.tgfoid,
        tnc.nspname as schema,
        tnc.relname as table_name,
        tnc.table_oid::int8 as table_id,
        0 as source,
        tnc.rank,
        0 as table_sort_length,
        '' as table_sort_name
      from trigger_name_candidates tnc
      where ${hasTableAccess(safeSql`tnc.table_oid`, safeSql`tnc.relowner`, { includeSelect: false })}

      union all

      select
        trg.oid::int8,
        trg.tgname,
        trg.tgtype,
        trg.tgfoid,
        mt.schema,
        mt.name,
        mt.id,
        1,
        mt.rank,
        length(mt.name),
        mt.name
      from matched_tables mt
      cross join lateral (
        select t.oid, t.tgname, t.tgtype, t.tgfoid
        from pg_trigger t
        where t.tgrelid = mt.oid
          and not t.tgisinternal
        order by t.tgname
        limit ${literal(limit)}
      ) trg
      where ${hasTableAccess(safeSql`mt.oid`, safeSql`mt.relowner`, { includeSelect: false })}
    ),
    matched_triggers as (
      select *
      from (
        select distinct on (tm.id) tm.*
        from trigger_matches tm
        order by tm.id, tm.source
      ) deduped
      order by ${TABLE_RELATED_ORDER}
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
            order by ${TABLE_RELATED_ORDER}
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
              'args', coalesce(pg_get_function_identity_arguments(f.oid), '')
            )
            order by f.rank, length(f.proname), f.proname, f.nspname
          )
          from matched_functions f
        ),
        '[]'::jsonb
      ) as functions,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', t.id,
              'name', t.name,
              'activation', case
                when (t.tgtype & 2) <> 0 then 'BEFORE'
                when (t.tgtype & 64) <> 0 then 'INSTEAD OF'
                else 'AFTER'
              end,
              'events', to_jsonb(
                array_remove(
                  array[
                    case when (t.tgtype & 4) <> 0 then 'INSERT' end,
                    case when (t.tgtype & 16) <> 0 then 'UPDATE' end,
                    case when (t.tgtype & 8) <> 0 then 'DELETE' end,
                    case when (t.tgtype & 32) <> 0 then 'TRUNCATE' end
                  ],
                  null
                )
              ),
              'schema', t.schema,
              'table', t.table_name,
              'table_id', t.table_id,
              'matched_function', case
                when t.source = 0 and t.rank = 3
                  then (select p.proname from pg_proc p where p.oid = t.tgfoid)
              end
            )
            order by ${TABLE_RELATED_ORDER}
          )
          from matched_triggers t
        ),
        '[]'::jsonb
      ) as triggers
  `
}
