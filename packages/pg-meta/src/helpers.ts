import { literal } from './pg-format'

export const coalesceRowsToArray = (source: string, filter: string) => {
  return `
COALESCE(
  (
    SELECT
      array_agg(row_to_json(${source})) FILTER (WHERE ${filter})
    FROM
      ${source}
  ),
  '{}'
) AS ${source}`
}

export function filterByList(
  include?: (string | number)[],
  exclude?: (string | number)[],
  defaultExclude?: (string | number)[]
) {
  if (defaultExclude) {
    exclude = defaultExclude.concat(exclude ?? [])
  }
  if (include?.length) {
    return `IN (${include.map(literal).join(',')})`
  } else if (exclude?.length) {
    return `NOT IN (${exclude.map(literal).join(',')})`
  }
  return ''
}

export const filterByValue = (ids?: (string | number)[]) => {
  if (ids?.length) {
    return `IN (${ids.map(literal).join(',')})`
  }
  return ''
}

export function exceptionIdentifierNotFound(entityName: string, whereClause: string) {
  return `raise exception 'Cannot find ${entityName} with: %', ${literal(whereClause)};`
}
