/**
 * A small subset of Logflare's LQL, enough for the demo's rules and previews:
 * `f:<source>`, `m.<path>:<value>` with `>=`, `<=`, `>`, `<`, quoted values, top-level
 * fields (`name:value`), free text (matched against the event message) and `-` negation.
 */

export type LqlFilter = {
  path: string[]
  operator: '=' | '~' | '>=' | '<=' | '>' | '<'
  value: string
  negated: boolean
}

export type ParsedLql = { source?: string; filters: LqlFilter[] }

export type LqlEvent = { event_message?: string | null; body: Record<string, unknown> }

const TOKEN = /(?:[^\s"]+|"[^"]*")+/g
const FIELD = /^([A-Za-z_][\w.]*):(.*)$/

const COMPARISON_OPERATORS = ['>=', '<=', '>', '<'] as const satisfies LqlFilter['operator'][]

const unquote = (value: string) => value.replace(/^"(.*)"$/, '$1')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object'

function toFilter(token: string): LqlFilter | { source: string } {
  const negated = token.length > 1 && token.startsWith('-')
  const term = negated ? token.slice(1) : token
  const field = term.match(FIELD)

  if (!field) return { path: ['event_message'], operator: '~', value: unquote(term), negated }

  const [, name, rawValue] = field
  if (name === 'f' || name === 'from') return { source: unquote(rawValue) }

  const path = name.startsWith('m.') ? ['metadata', ...name.slice(2).split('.')] : name.split('.')
  const operator = COMPARISON_OPERATORS.find((candidate) => rawValue.startsWith(candidate))
  if (operator) {
    return { path, operator, value: unquote(rawValue.slice(operator.length)), negated }
  }
  return { path, operator: '=', value: unquote(rawValue), negated }
}

export function parseLql(lql: string): ParsedLql {
  return (lql.match(TOKEN) ?? []).reduce<ParsedLql>(
    (parsed, token) => {
      const filter = toFilter(token)
      return 'source' in filter
        ? { ...parsed, source: filter.source }
        : { ...parsed, filters: [...parsed.filters, filter] }
    },
    { filters: [] }
  )
}

function valueAt(event: LqlEvent, path: string[]): unknown {
  if (path.length === 1 && path[0] === 'event_message') return event.event_message
  return path.reduce<unknown>(
    (value, key) => (isRecord(value) ? value[key] : undefined),
    event.body
  )
}

function compare(actual: unknown, { operator, value }: LqlFilter) {
  if (actual === undefined || actual === null) return false
  if (operator === '~') return String(actual).toLowerCase().includes(value.toLowerCase())
  if (operator === '=') return String(actual) === value

  const [left, right] = [Number(actual), Number(value)]
  if (Number.isNaN(left) || Number.isNaN(right)) return false
  if (operator === '>=') return left >= right
  if (operator === '<=') return left <= right
  if (operator === '>') return left > right
  return left < right
}

export function matchesLql(event: LqlEvent, filters: LqlFilter[]) {
  return filters.every((filter) => compare(valueAt(event, filter.path), filter) !== filter.negated)
}

/** Fills `{{key}}` placeholders with the alert issue's identifier values, quoted. */
export function fillLqlTemplate(
  template: string,
  identifiers: Record<string, string | null | undefined>
): { lql: string } | { error: string } {
  const keys = [...template.matchAll(/\{\{(\w+)\}\}/g)].map(([, key]) => key)
  const missing = keys.find((key) => !identifiers[key])
  if (missing) return { error: `Missing identifier ${missing}` }
  if (keys.some((key) => /["\\]/.test(identifiers[key] ?? ''))) {
    return { error: 'Identifier values cannot contain quotes or backslashes' }
  }

  return { lql: template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => `"${identifiers[key]}"`) }
}
