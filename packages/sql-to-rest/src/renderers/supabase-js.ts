import { Filter, Select, Statement } from '../processor'

export type SupabaseJsQuery = {
  code: string
}

/**
 * Renders a `Statement` as a supabase-js query.
 */
export function renderSupabaseJs(processed: Statement): SupabaseJsQuery {
  switch (processed.type) {
    case 'select':
      return formatSelect(processed)
    default:
      throw new Error(`Unsupported statement type '${processed.type}'`)
  }
}

function formatSelect(select: Select): SupabaseJsQuery {
  const { from, targets, filter, limit } = select
  const lines = ['const { data, error } = await supabase', `.from('${from}')`]

  if (targets.length > 0) {
    const [firstTarget] = targets

    // Remove '*' from select() if it's the only target
    if (firstTarget.column === '*' && targets.length === 1) {
      lines.push('.select()')
    } else {
      const renderedTargets = targets.map(({ column, alias }) => {
        if (alias) {
          return `${alias}:${column}`
        }
        return column
      })

      lines.push(`.select('${renderedTargets.join(', ')}')`)
    }
  }

  if (filter) {
    formatSelectFilterRoot(lines, filter)
  }

  if (limit) {
    if (limit.count !== undefined && limit.offset === undefined) {
      lines.push(`.limit(${limit.count})`)
    } else if (limit.count === undefined && limit.offset !== undefined) {
      throw new Error(`supabase-js doesn't support an offset without a limit`)
    } else if (limit.count !== undefined && limit.offset !== undefined) {
      lines.push(`.range(${limit.offset}, ${limit.offset + limit.count})`)
    }
  }

  // Join lines together and indent
  const code = lines.map((line, index) => (index > 0 ? `  ${line}` : line)).join('\n')

  return {
    code,
  }
}

function formatSelectFilterRoot(lines: string[], filter: Filter) {
  const { type } = filter

  if (filter.negate) {
    if (filter.type === 'column') {
      const value = typeof filter.value === 'string' ? `'${filter.value}'` : filter.value
      lines.push(`.not('${filter.column}', '${filter.operator}', ${value})`)
    }
    // supabase-js doesn't support negated logical operators.
    // We work around this by wrapping the filter in an 'or'
    // with only 1 value
    else if (filter.type === 'logical') {
      lines.push(`.or('${formatSelectFilter(filter)}')`)
    }
    return
  }

  // Column filter, eg. .eq('title', 'Cheese')
  if (type === 'column') {
    const value = typeof filter.value === 'string' ? `'${filter.value}'` : filter.value
    lines.push(`.${filter.operator}('${filter.column}', ${value})`)
  }

  // Logical operator filter, eg. .or('title.eq.Cheese,title.eq.Salsa')
  else if (type === 'logical') {
    // The `and` operator is a a special case where we can format each nested
    // filter as a separate filter method
    if (filter.operator === 'and') {
      for (const subFilter of filter.values) {
        formatSelectFilterRoot(lines, subFilter)
      }
    }
    // Otherwise use the .or(...) method
    else if (filter.operator === 'or') {
      lines.push(
        `.or('${filter.values.map((subFilter) => formatSelectFilter(subFilter)).join(', ')}')`
      )
    }
  } else {
    throw new Error(`Unknown filter type '${type}'`)
  }
}

function formatSelectFilter(filter: Filter): string {
  const { type } = filter
  const maybeNot = filter.negate ? 'not.' : ''

  if (type === 'column') {
    return `${maybeNot}${filter.column}.${filter.operator}.${filter.value}`
  } else if (type === 'logical') {
    return `${maybeNot}${filter.operator}(${filter.values.map((subFilter) => formatSelectFilter(subFilter)).join(', ')})`
  } else {
    throw new Error(`Unknown filter type '${type}'`)
  }
}
