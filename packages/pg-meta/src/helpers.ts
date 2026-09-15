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
