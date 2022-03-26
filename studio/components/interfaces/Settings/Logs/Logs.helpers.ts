import { LogsTableName, SQL_FILTER_TEMPLATES } from './Logs.constants'
import { FilterObject, Override } from './Logs.types'

export function filterSqlWhereBuilder(
  filters: FilterObject | any,
  table: LogsTableName,
  override?: Override
) {
  let count = 0

  // remove any filter arrays that are empty
  const filtersSanitized: any = Object.values(filters).filter((x: any) => x && x.length > 0)

  const keys = Object.keys(filters)
  console.log('override first', override)

  const hasOverride = override && override.value && override.key
  // build array of where statements
  // first item is `where` if there are any filters
  let whereArray: string[] = filtersSanitized.length > 0 || hasOverride ? ['where'] : []

  if (filtersSanitized.length === 0 && !hasOverride) return whereArray

  if (hasOverride) {
    console.log('override', override)
    count = +1
    const sql = `${override.key}='${override.value}'`
    whereArray.push(sql)
  }

  if (filtersSanitized.length === 0) return whereArray

  keys.map((x: string, i) => {
    // do not parse empty key
    if (!x) return

    const filterKeyArray: string[] = []

    filters[x].map((value: string, i: number) => {
      // first line should be WHERE
      const last = i === filters[x].length - 1

      if (count === 0) {
        count = +1
        // the first argument begins with a `(`
        // if this is also the last argument, it is closed with a `)`
        const sql = `( ${SQL_FILTER_TEMPLATES[table][`${x}.${value}`]}${last ? ' ) ' : ''}`
        filterKeyArray.push(sql)
        return sql
      } else {
        count = +1
        // remaining lines use `or` as standard
        // if this is also the last argument, it is closed with a `)`
        const sql = ` or ${SQL_FILTER_TEMPLATES[table][`${x}.${value}`]}${last ? ' ) ' : ''}`
        filterKeyArray.push(sql)
        return sql
      }
    })

    whereArray.push(...filterKeyArray)

    // if there are multiple filters in an 'and' sequence
    // then `and` is inserted between them
    if (filtersSanitized.length > 0 && i < filtersSanitized.length - 1) {
      whereArray.push(' and ')
    }

    return filterKeyArray
  })
  return whereArray
}

export function filterReducer(state: FilterObject, action: any) {
  const oldState = { ...state }
  const newState = { ...oldState, ...action }

  return newState
}
