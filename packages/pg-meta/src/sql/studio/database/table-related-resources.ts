import { DEFAULT_SYSTEM_SCHEMAS } from '../../../constants'
import { joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'
import {
  EXTENSION_FUNCTIONS_CTE,
  hasTableAccess,
  triggerActivation,
  triggerEvents,
} from './catalog-helpers'

// Only a safety cap, so a pathological table can't flood the menu or payload
const RELATED_LIMIT = 100

// A source scan can't tell a real reference from a comment or a similarly named
// table, so only a few are offered to keep wrong guesses a small part of the list
export const TABLE_RELATED_FUNCTION_LIMIT = 5

// Collected before ranking and the privilege check. Well above the limit so
// functions the role can't execute don't starve the result.
export const TABLE_RELATED_FUNCTION_CANDIDATE_LIMIT = 50

export type TableRelatedPolicy = {
  id: number
  name: string
  command: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
  schema: string
}

export type TableRelatedTrigger = {
  id: number
  name: string
  activation: 'BEFORE' | 'AFTER' | 'INSTEAD OF'
  events: Array<'INSERT' | 'UPDATE' | 'DELETE' | 'TRUNCATE'>
  schema: string
}

export type TableRelatedIndex = {
  id: number
  name: string
  schema: string
  /** Covered columns in index order; an expression column reads `(expression)`. */
  columns: string[]
  is_primary: boolean
  is_unique: boolean
}

export type TableRelatedFunction = {
  id: number
  schema: string
  name: string
  type: 'function' | 'procedure'
  args: string
}

export type TableRelatedResourcesResult = {
  policies: TableRelatedPolicy[]
  triggers: TableRelatedTrigger[]
  indexes: TableRelatedIndex[]
}

export type TableReferencingFunctionsResult = {
  functions: TableRelatedFunction[]
}

type TableArgs = { schema: string; name: string }

/** The given table, only if the role can see it. */
const targetTable = ({ schema, name }: TableArgs) => safeSql`target_table as (
      select c.oid, c.relname, c.relowner, nc.nspname
      from pg_class c
      join pg_namespace nc on nc.oid = c.relnamespace
      where nc.nspname = ${literal(schema)}
        and c.relname = ${literal(name)}
        and c.relkind in ('r', 'p')
        and ${hasTableAccess(safeSql`c.oid`, safeSql`c.relowner`)}
    )`

/**
 * Policies, triggers and indexes of one table, for the command menu's
 * "Related resources". All three are index probes keyed by the table's oid.
 *
 * Kept apart from functions (see `getTableReferencingFunctionsSql`) because
 * those are far slower to find, and this half should render immediately.
 */
export const getTableRelatedResourcesSql = ({
  schema,
  name,
}: TableArgs): SafeSqlFragment => safeSql`
    with ${targetTable({ schema, name })},
    table_policies as (
      select pol.oid, pol.polname, pol.polcmd, tt.nspname
      from target_table tt
      join pg_policy pol on pol.polrelid = tt.oid
      order by pol.polname
      limit ${literal(RELATED_LIMIT)}
    ),
    table_triggers as (
      select t.oid, t.tgname, t.tgtype, tt.nspname
      from target_table tt
      join pg_trigger t on t.tgrelid = tt.oid
      where not t.tgisinternal
        and ${hasTableAccess(safeSql`tt.oid`, safeSql`tt.relowner`, { includeSelect: false })}
      order by t.tgname
      limit ${literal(RELATED_LIMIT)}
    ),
    table_indexes as (
      select
        i.indexrelid as oid,
        ic.relname,
        i.indisprimary,
        i.indisunique,
        tt.nspname,
        -- Columns in index order. indkey holds 0 for an expression, which has
        -- no pg_attribute row, so those come back as (expression).
        (
          select array_agg(coalesce(a.attname, '(expression)') order by k.ord)
          from unnest(i.indkey) with ordinality as k(attnum, ord)
          left join pg_attribute a on a.attrelid = tt.oid and a.attnum = k.attnum
        ) as columns
      from target_table tt
      join pg_index i on i.indrelid = tt.oid
      join pg_class ic on ic.oid = i.indexrelid
      where i.indislive
      order by ic.relname
      limit ${literal(RELATED_LIMIT)}
    )
    select
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', p.oid::int8,
              'name', p.polname,
              'command', case p.polcmd
                when 'r' then 'SELECT'
                when 'a' then 'INSERT'
                when 'w' then 'UPDATE'
                when 'd' then 'DELETE'
                else 'ALL'
              end,
              'schema', p.nspname
            )
            order by p.polname
          )
          from table_policies p
        ),
        '[]'::jsonb
      ) as policies,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', t.oid::int8,
              'name', t.tgname,
              'activation', ${triggerActivation(safeSql`t.tgtype`)},
              'events', ${triggerEvents(safeSql`t.tgtype`)},
              'schema', t.nspname
            )
            order by t.tgname
          )
          from table_triggers t
        ),
        '[]'::jsonb
      ) as triggers,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', i.oid::int8,
              'name', i.relname,
              'schema', i.nspname,
              -- array_agg yields null for an index with no key columns
              'columns', coalesce(to_jsonb(i.columns), '[]'::jsonb),
              'is_primary', i.indisprimary,
              'is_unique', i.indisunique
            )
            order by i.relname
          )
          from table_indexes i
        ),
        '[]'::jsonb
      ) as indexes
  `

/**
 * Functions whose source mentions the table. Postgres records no dependency
 * between a plpgsql function and the tables it reads, so this is a substring
 * match on `prosrc`: a filtered seq scan of pg_proc, and imprecise.
 *
 * - Candidates are capped before ranking. Ranking first would read every
 *   function body before the limit applies.
 * - `strpos` over `ilike` is several times faster on large source, but misses
 *   differently-cased references.
 * - Functions with parsed bodies (`BEGIN ATOMIC`) have a null `prosrc` and
 *   never match.
 */
export const getTableReferencingFunctionsSql = ({
  schema,
  name,
}: TableArgs): SafeSqlFragment => safeSql`
    with ${targetTable({ schema, name })},
    trigger_functions as (
      select t.tgfoid
      from target_table tt
      join pg_trigger t on t.tgrelid = tt.oid
      where not t.tgisinternal
    ),
    ${EXTENSION_FUNCTIONS_CTE},
    function_candidates as materialized (
      select p.oid, p.proname, p.proowner, p.prokind, n.nspname
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where p.prokind in ('f', 'p')
        and n.nspname not in (${joinSqlFragments(
          DEFAULT_SYSTEM_SCHEMAS.map((s) => literal(s)),
          ', '
        )})
        and not pg_is_other_temp_schema(n.oid)
        -- Skips the source scan when the table isn't visible
        and exists (select 1 from target_table)
        -- Before the cap, so extension members can't crowd out the user's functions
        and p.oid not in (select objid from extension_functions)
        -- Already listed under the triggers they back
        and p.oid not in (select tgfoid from trigger_functions)
        and strpos(p.prosrc, ${literal(name)}) > 0
      -- Unordered on purpose, so the scan can stop at the cap
      limit ${literal(TABLE_RELATED_FUNCTION_CANDIDATE_LIMIT)}
    ),
    related_functions as (
      select
        fc.oid,
        fc.proname,
        fc.prokind,
        fc.nspname,
        -- Named after the table is likelier a real reference than a mere mention
        case when strpos(fc.proname, ${literal(name)}) > 0 then 0 else 1 end as rank
      from function_candidates fc
      where pg_has_role(fc.proowner, 'USAGE') or has_function_privilege(fc.oid, 'EXECUTE')
      order by rank, length(fc.proname), fc.proname, fc.nspname
      limit ${literal(TABLE_RELATED_FUNCTION_LIMIT)}
    )
    select
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
          from related_functions f
        ),
        '[]'::jsonb
      ) as functions
  `
