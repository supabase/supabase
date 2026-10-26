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

export type SearchEntitiesTable = {
  id: number
  schema: string
  name: string
  rls_enabled: boolean
  policy_count: number
}

export type SearchEntitiesResult = {
  tables: SearchEntitiesTable[]
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
 * types (policies, functions, triggers) can be added without changing the
 * response shape.
 */
export const getSearchEntitiesSql = ({
  query,
  limit = 6,
}: {
  query: string
  limit?: number
}): SafeSqlFragment => {
  const dotIndex = query.indexOf('.')
  const schemaPart = dotIndex === -1 ? undefined : query.slice(0, dotIndex)
  const namePart = dotIndex === -1 ? query : query.slice(dotIndex + 1)

  const nameFilter = safeSql`c.relname ilike ${literal(`%${escapeIlikeLiteral(query)}%`)}`
  const matchFilter =
    schemaPart === undefined
      ? nameFilter
      : safeSql`(
          ${nameFilter}
          or (
            nc.nspname ilike ${literal(`${escapeIlikeLiteral(schemaPart)}%`)}
            and c.relname ilike ${literal(`%${escapeIlikeLiteral(namePart)}%`)}
          )
        )`

  // Rank on the name part, so `public.colors` ranks the `colors` table first
  const prefixPattern = literal(`${escapeIlikeLiteral(namePart)}%`)
  const exactName = literal(namePart.toLowerCase())
  const excludedSchemas = joinSqlFragments(
    DEFAULT_SYSTEM_SCHEMAS.map((schema) => literal(schema)),
    ', '
  )

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
        and ${matchFilter}
      order by rank, length(c.relname), c.relname
      limit ${literal(CANDIDATE_LIMIT)}
    ),
    matched_tables as (
      select
        tc.oid::int8 as id,
        tc.nspname as schema,
        tc.relname as name,
        tc.relrowsecurity as rls_enabled,
        (select count(*) from pg_policy pol where pol.polrelid = tc.oid)::int as policy_count,
        tc.rank
      from table_candidates tc
      where
        pg_has_role(tc.relowner, 'USAGE')
        or has_table_privilege(
          tc.oid,
          'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
        )
        or has_any_column_privilege(tc.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
      order by tc.rank, length(tc.relname), tc.relname
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
      ) as tables
  `
}
