import { Filter, Select, Statement } from '../processor'

export type HttpRequest = {
  method: 'GET'
  path: string
}

/**
 * Renders a `Statement` as an HTTP request.
 */
export async function renderHttp(processed: Statement): Promise<HttpRequest> {
  switch (processed.type) {
    case 'select':
      return formatSelect(processed)
    default:
      throw new Error(`Unsupported statement type '${processed.type}'`)
  }
}

async function formatSelect(select: Select): Promise<HttpRequest> {
  const { from, targets, filter, sorts, limit } = select
  const params = new URLSearchParams()

  if (targets.length > 0) {
    const [firstTarget] = targets

    // Exclude "select=*" if it's the only target
    if (firstTarget.column !== '*' || targets.length !== 1) {
      params.set(
        'select',
        targets
          .map(({ column, alias, cast }) => {
            let value = column

            if (alias && alias !== column) {
              value = `${alias}:${value}`
            }

            if (cast) {
              value = `${value}::${cast}`
            }

            return value
          })
          .join(',')
      )
    }
  }

  if (filter) {
    formatSelectFilterRoot(params, filter)
  }

  if (sorts) {
    const columns = []

    for (const sort of sorts) {
      let value = sort.column

      if (sort.direction) {
        value += `.${sort.direction}`
      }
      if (sort.nulls) {
        value += `.nulls${sort.nulls}`
      }

      columns.push(value)
    }

    if (columns.length > 0) {
      params.set('order', columns.join(','))
    }
  }

  if (limit) {
    if (limit.count !== undefined) {
      params.set('limit', limit.count.toString())
    }
    if (limit.offset !== undefined) {
      params.set('offset', limit.offset.toString())
    }
  }

  let path = `/${from}`

  if (params.size > 0) {
    path += `?${encodeParams(params, ['*', '(', ')', ',', ':'])}`
  }

  return {
    method: 'GET',
    path,
  }
}

/**
 * URL encodes query parameters with an optional character whitelist
 * that should not be encoded.
 */
function encodeParams(params: URLSearchParams, characterWhitelist: string[] = []) {
  let urlEncodedParams = params.toString()

  // Convert whitelisted characters back from their hex representation (eg. '%2A' -> '*')
  for (const char of characterWhitelist) {
    const hexCode = char.charCodeAt(0).toString(16).toUpperCase()
    urlEncodedParams = urlEncodedParams.replaceAll(`%${hexCode}`, char)
  }

  return urlEncodedParams
}

function formatSelectFilterRoot(params: URLSearchParams, filter: Filter) {
  const { type } = filter
  const maybeNot = filter.negate ? 'not.' : ''

  // Column filter, eg. "title=eq.Cheese"
  if (type === 'column') {
    // Convert '%' to URL-safe '*'
    if (filter.operator === 'like' || filter.operator === 'ilike') {
      filter.value = filter.value.replaceAll('%', '*')
    }

    params.set(filter.column, `${maybeNot}${filter.operator}.${filter.value}`)
  }
  // Logical operator filter, eg. "or=(title.eq.Cheese,title.eq.Salsa)""
  else if (type === 'logical') {
    // The `and` operator is a a special case where we can format each nested
    // filter as a separate query param as long as the `and` is not negated
    if (filter.operator === 'and' && !filter.negate) {
      for (const subFilter of filter.values) {
        formatSelectFilterRoot(params, subFilter)
      }
    }
    // Otherwise use the <operator>=(...) syntax
    else {
      params.set(
        `${maybeNot}${filter.operator}`,
        `(${filter.values.map((subFilter) => formatSelectFilter(subFilter)).join(',')})`
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
    // Convert '%' to URL-safe '*'
    if (filter.operator === 'like' || filter.operator === 'ilike') {
      filter.value = filter.value.replaceAll('%', '*')
    }

    return `${maybeNot}${filter.column}.${filter.operator}.${filter.value}`
  } else if (type === 'logical') {
    return `${maybeNot}${filter.operator}(${filter.values.map((subFilter) => formatSelectFilter(subFilter)).join(',')})`
  } else {
    throw new Error(`Unknown filter type '${type}'`)
  }
}
