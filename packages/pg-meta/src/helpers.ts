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
 * The elements of a one-dimensional Postgres array in its text form (`{a,"b, c",NULL}`), as pg
 * returns an array type it has no parser for. Quoted elements keep commas, braces and escaped quotes.
 */
export function parseTextArray(text: string): Array<string | null> {
  const body = text.trim().replace(/^\{/, '').replace(/\}$/, '')
  if (body === '') return []
  const elements: Array<string | null> = []
  let current = ''
  let quoted = false
  let wasQuoted = false
  for (let i = 0; i < body.length; i++) {
    const char = body[i]
    if (quoted && char === '\\') current += body[++i] ?? ''
    else if (char === '"') {
      quoted = !quoted
      wasQuoted = true
    } else if (char === ',' && !quoted) {
      elements.push(!wasQuoted && current === 'NULL' ? null : current)
      current = ''
      wasQuoted = false
    } else current += char
  }
  elements.push(!wasQuoted && current === 'NULL' ? null : current)
  return elements
}
