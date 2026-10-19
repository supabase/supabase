import { ident, joinSqlFragments, literal, safeSql, type SafeSqlFragment } from './pg-format'

export const coalesceRowsToArray = (
  source: string,
  filter: SafeSqlFragment,
  // Optional ORDER BY (a column reference of `source`) applied INSIDE array_agg
  // to make the emitted array deterministic. Omit it to keep the historical
  // (plan-order) rendering byte-for-byte identical for existing callers.
  orderBy?: SafeSqlFragment
) => {
  const orderClause = orderBy ? safeSql` ORDER BY ${orderBy}` : safeSql``
  return safeSql`
COALESCE(
  (
    SELECT
      array_agg(row_to_json(${ident(source)})${orderClause}) FILTER (WHERE ${filter})
    FROM
      ${ident(source)}
  ),
  '{}'
) AS ${ident(source)}`
}

export function filterByList(include?: string[], exclude?: string[], defaultExclude?: string[]) {
  if (defaultExclude) {
    exclude = defaultExclude.concat(exclude ?? [])
  }
  if (include?.length) {
    return safeSql`IN (${joinSqlFragments(include.map(literal), ',')})`
  } else if (exclude?.length) {
    return safeSql`NOT IN (${joinSqlFragments(exclude.map(literal), ',')})`
  }
  return safeSql``
}

export function exceptionIdentifierNotFound(entityName: string, whereClause: string) {
  return safeSql`raise exception 'Cannot find ${ident(entityName)} with: %', ${literal(whereClause)};`
}

// Escape LIKE/ILIKE wildcards so user input is matched literally. ILIKE's
// default escape character is `\`, so we escape `\`, `%`, and `_` and let the
// pattern carry its own surrounding `%`s as wildcards.
export const escapeIlikeLiteral = (value: string) => value.replace(/([\\%_])/g, '\\$1')

/**
 * The `%I.%I` arguments of a `format()` call that name a relation: the schema
 * and name of the relation with the given oid.
 *
 * Callers deliberately avoid `format('… %s …', <oid>::regclass)`: `%s`
 * substitutes raw text, so a PL/pgSQL body using it can't be proven to build a
 * fixed statement. Servers that statically check `DO` blocks (such as
 * Multigres) reject those. A format string made only of `%I`/`%L` conversions
 * can be checked, and builds the same statement.
 *
 * Deriving the identifiers from `pg_class` also keeps the caller's schema and
 * table names out of the generated SQL text, so a name containing a
 * dollar-quote delimiter (for example `$$`) can't close the enclosing
 * `DO $$ … $$` block early.
 */
export function relationIdentArgs(relationId: number): SafeSqlFragment {
  const id = literal(relationId)
  return safeSql`(select n.nspname from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.oid = ${id}), (select relname from pg_class where oid = ${id})`
}
