import {
  ColumnFilter,
  ColumnTarget,
  Filter,
  HttpRequest,
  Statement,
  SupabaseJsQuery,
  Target,
} from 'sql-to-rest'

export type BaseResult = {
  statement: Statement
}

export type HttpResult = BaseResult &
  HttpRequest & {
    type: 'http'
    language: 'http' | 'curl'
  }

export type SupabaseJsResult = BaseResult &
  SupabaseJsQuery & {
    type: 'supabase-js'
    language: 'js'
  }

export type ResultBundle = HttpResult | SupabaseJsResult

/**
 * Recursively iterates through PostgREST filters and checks if the predicate
 * matches any of them (ie. `some()`).
 */
export function someFilter(filter: Filter, predicate: (filter: ColumnFilter) => boolean): boolean {
  const { type } = filter

  if (type === 'column') {
    return predicate(filter)
  } else if (type === 'logical') {
    return filter.values.some((f) => someFilter(f, predicate))
  } else {
    throw new Error(`Unknown filter type '${type}'`)
  }
}

/**
 * Recursively iterates through a PostgREST target list and checks if the predicate
 * matches any of them (ie. `some()`).
 */
export function someTarget(target: Target, predicate: (target: ColumnTarget) => boolean): boolean {
  const { type } = target

  if (type === 'column-target') {
    return predicate(target)
  } else if (type === 'embedded-target') {
    return target.targets.some((t) => someTarget(t, predicate))
  } else {
    throw new Error(`Unknown target type '${type}'`)
  }
}

/**
 * Recursively flattens PostgREST embedded targets.
 */
export function flattenTargets(targets: Target[]): Target[] {
  return targets.flatMap((target) => {
    const { type } = target
    if (type === 'column-target') {
      return target
    } else if (type === 'embedded-target') {
      return [target, ...flattenTargets(target.targets)]
    } else {
      throw new Error(`Unknown target type '${type}'`)
    }
  })
}
