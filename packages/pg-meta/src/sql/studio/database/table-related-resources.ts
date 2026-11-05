import { DEFAULT_SYSTEM_SCHEMAS } from '../../../constants'
import { joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'
import {
  EXTENSION_FUNCTIONS_CTE,
  hasTableAccess,
  triggerActivation,
  triggerEvents,
} from './catalog-helpers'

// Policies and triggers come back in full. The cap only exists so that a
// pathological table can't flood the command menu or the response payload.
const RELATED_LIMIT = 100

// Functions are found by scanning their source for the table's name, which
// can't tell a real reference from a comment, a string literal, or a similarly
// named table. Only the best-named few are offered, so a wrong guess stays a
// small part of the list.
export const TABLE_RELATED_FUNCTION_LIMIT = 5

// How many source matches are collected before ranking and the privilege check.
// Well above the final limit, so the odd function the role can't execute doesn't
// starve the result.
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
}

export type TableReferencingFunctionsResult = {
  functions: TableRelatedFunction[]
}

type TableArgs = { schema: string; name: string }

/** The one table everything else here hangs off, and proof the role can see it. */
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
 * The policies and triggers of one table, for the command menu's "Related
 * resources" section in the table editor.
 *
 * Unlike the entity search this runs once per table rather than per keystroke,
 * and the table is given rather than matched, so both are plain index probes on
 * `polrelid` / `tgrelid` — a couple of milliseconds on a large catalog.
 *
 * Functions are deliberately not here: finding them means reading function
 * bodies, which is two orders of magnitude more expensive (see
 * `getTableReferencingFunctionsSql`). Keeping them apart lets this half render
 * immediately.
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
      ) as triggers
  `

/**
 * Functions whose source mentions one table, for the command menu's "Related
 * resources" section in the table editor.
 *
 * This is the expensive and imprecise half. Postgres records no dependency
 * between a plpgsql function and the tables it reads — the body is opaque text
 * — so the only thing available is a substring match on `prosrc`, one filtered
 * seq scan of pg_proc whose cost follows the total size of the project's
 * function source. Three things keep that honest:
 *
 * - Candidates are capped before anything is ranked. Ranking first would make
 *   Postgres read every function body before the limit could apply, which on a
 *   large catalog is the difference between milliseconds and about a second.
 * - The match is `strpos` rather than `ilike`, several times faster over
 *   megabytes of source, at the cost of missing differently-cased references.
 * - The result is capped hard, with functions named after the table first, so a
 *   wrong guess stays a small part of the list.
 *
 * Functions whose body is stored parsed (`BEGIN ATOMIC`, which leaves `prosrc`
 * null) are not matched.
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
        -- Skips the source scan entirely when the table isn't visible
        and exists (select 1 from target_table)
        -- Excluded before the cap, so extension members can never crowd the
        -- user's own functions out of the candidate set
        and p.oid not in (select objid from extension_functions)
        -- Already listed under the triggers they back
        and p.oid not in (select tgfoid from trigger_functions)
        and strpos(p.prosrc, ${literal(name)}) > 0
      -- Deliberately unordered, so the scan can stop at the cap
      limit ${literal(TABLE_RELATED_FUNCTION_CANDIDATE_LIMIT)}
    ),
    related_functions as (
      select
        fc.oid,
        fc.proname,
        fc.prokind,
        fc.nspname,
        -- A function named after the table is far likelier to be a genuine
        -- reference than one that merely mentions it somewhere in its body
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
