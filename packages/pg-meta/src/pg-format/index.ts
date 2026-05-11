import { POSTGRESQL_RESERVED_WORDS } from './reserved'

interface PgFormatConfigPattern {
  ident: string
  literal: string
  string: string
}

export interface PgFormatConfig {
  pattern: PgFormatConfigPattern
}

/**
 * A branded string type representing a SQL fragment that is safe to compose
 * into queries.
 * Values of this type are either:
 * - Static strings in source code (no interpolation)
 * - Outputs of `ident()`, `literal()`, or `keyword()` (properly escaped or
 *   validated)
 * - Compositions via `safeSql` template tag (enforces SafeSqlFragment-only
 *   interpolations)
 * - Compositions via `joinFragments` (enforces SafeSqlFragment inputs)
 *
 * Never cast arbitrary strings to this type — use ident/literal/keyword/safeSql
 * instead.
 */
export type SafeSqlFragment = string & { readonly __safeSqlFragmentBrand: never }

/**
 * A branded string type representing SQL that may have been influenced by a
 * third party (URL params, AI output, external content). Safe to display;
 * must never be auto-executed or persisted as user-authored content.
 * Promote to SafeSqlFragment via acceptUntrustedSql() — only inside an
 * explicit user-action event handler.
 */
export type UntrustedSqlFragment = string & { readonly __untrustedSqlFragmentBrand: never }

/** Either brand — for read-only display surfaces that accept both. */
export type DisplayableSqlFragment = SafeSqlFragment | UntrustedSqlFragment

export type SqlFragmentSeparator =
  | ','
  | ', '
  | ';\n'
  | ' and '
  | ' AND '
  | ' or '
  | ' OR '
  | ' union all '
  | ' union '
  | ' UNION ALL '
  | ' UNION '
  | '\n'
  | '\n\n'
  | ' '

const FMT_PATTERN_CONFIG: PgFormatConfigPattern = {
  ident: 'I',
  literal: 'L',
  string: 's',
}

// convert to Postgres default ISO 8601 format
function formatDate(date: SafeSqlFragment): SafeSqlFragment {
  return date.replace('T', ' ').replace('Z', '+00') as SafeSqlFragment
}

function isReserved(value: string): boolean {
  if (POSTGRESQL_RESERVED_WORDS.has(value.toUpperCase())) {
    return true
  }
  return false
}

function arrayToList<ElementType = unknown>(
  useSpace: boolean,
  array: ElementType[],
  formatter: (value: ElementType) => SafeSqlFragment
): SafeSqlFragment {
  let sql = safeSql``

  sql = useSpace ? safeSql`${sql} (` : safeSql`${sql} (`
  for (const [index, element] of array.entries()) {
    sql = safeSql`${sql}${index === 0 ? safeSql`` : safeSql`, `}${formatter(element)}`
  }
  sql = safeSql`${sql})`

  return sql
}

// Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
// eslint-disable-next-line radar/cognitive-complexity
export function ident(value?: unknown): SafeSqlFragment {
  if (value === undefined || value === null) {
    throw new Error('SQL identifier cannot be null or undefined')
  } else if (value === false) {
    return '"f"' as SafeSqlFragment
  } else if (value === true) {
    return '"t"' as SafeSqlFragment
  } else if (value instanceof Date) {
    return safeSql`"${formatDate(value.toISOString() as SafeSqlFragment)}"`
  } else if (Array.isArray(value)) {
    const temporary: string[] = []
    for (const element of value) {
      if (Array.isArray(element) === true) {
        throw new TypeError(
          'Nested array to grouped list conversion is not supported for SQL identifier'
        )
      } else {
        temporary.push(ident(element))
      }
    }
    return temporary.toString() as SafeSqlFragment
  } else if (value === Object(value)) {
    throw new Error('SQL identifier cannot be an object')
  }

  const tident = String(value).slice(0) // create copy

  // do not quote a valid, unquoted identifier
  if (/^[_a-z][\d$_a-z]*$/.test(tident) === true && isReserved(tident) === false) {
    return tident as SafeSqlFragment
  }

  let quoted = '"'

  for (const c of tident) {
    quoted += c === '"' ? c + c : c
  }

  quoted += '"'

  return quoted as SafeSqlFragment
}

// Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
// eslint-disable-next-line radar/cognitive-complexity
export function literal(value?: unknown): SafeSqlFragment {
  let tliteral = ''
  let explicitCast: string | undefined

  if (value === undefined || value === null) {
    return 'NULL' as SafeSqlFragment
  }
  if (typeof value === 'bigint') {
    return BigInt(value).toString() as SafeSqlFragment
  }
  if (value === Number.POSITIVE_INFINITY) {
    return "'Infinity'" as SafeSqlFragment
  }
  if (value === Number.NEGATIVE_INFINITY) {
    return "'-Infinity'" as SafeSqlFragment
  }
  if (Number.isNaN(value)) {
    return "'NaN'" as SafeSqlFragment
  }
  if (typeof value === 'number') {
    // Test must be AFTER other special case number tests
    return Number(value).toString() as SafeSqlFragment
  }
  if (value === false) {
    return "'f'" as SafeSqlFragment
  }
  if (value === true) {
    return "'t'" as SafeSqlFragment
  }
  if (value instanceof Date) {
    return safeSql`'${formatDate(value.toISOString() as SafeSqlFragment)}'`
  }
  if (Array.isArray(value)) {
    const temporary: string[] = []
    for (const [index, element] of value.entries()) {
      if (Array.isArray(element) === true) {
        temporary.push(arrayToList(index !== 0, element, literal))
      } else {
        temporary.push(literal(element))
      }
    }
    return temporary.toString() as SafeSqlFragment
  }
  if (value === Object(value)) {
    explicitCast = 'jsonb'
    tliteral = JSON.stringify(value)
  } else {
    tliteral = String(value).slice(0) // create copy
  }

  let hasBackslash = false
  let quoted = "'"

  for (const c of tliteral) {
    if (c === "'") {
      quoted += c + c
    } else if (c === '\\') {
      quoted += c + c
      hasBackslash = true
    } else {
      quoted += c
    }
  }

  quoted += "'"

  if (hasBackslash === true) {
    quoted = `E${quoted}`
  }

  if (explicitCast) {
    quoted += `::${explicitCast}`
  }

  return quoted as SafeSqlFragment
}

/**
 * Marks SQL keywords (e.g., 'BEFORE', 'instead of') as safe for interpolation.
 * Only letters, numbers, underscores, and spaces are allowed, to prevent
 * injection.
 */
export function keyword(value: string): SafeSqlFragment {
  if (!/^[A-Za-z][A-Za-z0-9_ ]*$/.test(value)) {
    throw new Error(
      `Not a valid keyword: "${value}". Only letters, numbers, underscores, and spaces are permitted.`
    )
  }
  return value as SafeSqlFragment
}

type Stringifyable =
  | SafeSqlFragment
  | number
  | boolean
  | Date
  | null
  | undefined
  | Record<string | number | symbol, unknown>
  | Stringifyable[]

// eslint-disable-next-line radar/cognitive-complexity
export function string(value?: Stringifyable): SafeSqlFragment {
  if (value === undefined || value === null) {
    return safeSql``
  }
  if (value === false) {
    return safeSql`f`
  }
  if (value === true) {
    return safeSql`t`
  }
  if (value instanceof Date) {
    return formatDate(value.toISOString() as SafeSqlFragment)
  }
  if (Array.isArray(value)) {
    const temporary: SafeSqlFragment[] = []
    for (const [index, element] of value.entries()) {
      if (element !== null && element !== undefined) {
        if (Array.isArray(element) === true) {
          temporary.push(arrayToList(index !== 0, element, string))
        } else {
          temporary.push(string(element))
        }
      }
    }
    return temporary.toString() as SafeSqlFragment
  }
  if (!!value && typeof value === 'object') {
    return JSON.stringify(value) as SafeSqlFragment
  }

  // value is number or SafeSqlFragment
  return String(value).toString().slice(0) as SafeSqlFragment // return copy
}

export function config(cfg: PgFormatConfig): void {
  // default
  FMT_PATTERN_CONFIG.ident = 'I'
  FMT_PATTERN_CONFIG.literal = 'L'
  FMT_PATTERN_CONFIG.string = 's'

  if (cfg && cfg.pattern) {
    if (cfg.pattern.ident) {
      FMT_PATTERN_CONFIG.ident = cfg.pattern.ident
    }
    if (cfg.pattern.literal) {
      FMT_PATTERN_CONFIG.literal = cfg.pattern.literal
    }
    if (cfg.pattern.string) {
      FMT_PATTERN_CONFIG.string = cfg.pattern.string
    }
  }
}

export function withArray(fmt: SafeSqlFragment, parameters: SafeSqlFragment[]): SafeSqlFragment {
  let index = 0

  let reText = '%(%|(\\d+\\$)?['
  reText += FMT_PATTERN_CONFIG.ident
  reText += FMT_PATTERN_CONFIG.literal
  reText += FMT_PATTERN_CONFIG.string
  reText += '])'
  const re = new RegExp(reText, 'g')

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  return fmt.replace(re, (_, type: string): SafeSqlFragment => {
    if (type === '%') {
      return safeSql`%`
    }

    let position = index
    const tokens = type.split('$')

    if (tokens.length > 1) {
      position = Number.parseInt(tokens[0], 10) - 1
      // eslint-disable-next-line no-param-reassign, prefer-destructuring
      type = tokens[1]
    }

    if (position < 0) {
      throw new Error('specified argument 0 but arguments start at 1')
    } else if (position > parameters.length - 1) {
      throw new Error('too few arguments')
    }

    index = position + 1

    if (type === FMT_PATTERN_CONFIG.ident) {
      return ident(parameters[position])
    }
    if (type === FMT_PATTERN_CONFIG.literal) {
      return literal(parameters[position])
    }
    if (type === FMT_PATTERN_CONFIG.string) {
      return string(parameters[position])
    }

    throw new Error(`unsupported format type: ${type}`)
  }) as SafeSqlFragment
}

export function format(fmt: SafeSqlFragment, ...arguments_: SafeSqlFragment[]): SafeSqlFragment {
  return withArray(fmt, arguments_)
}

/**
 * Tagged template literal for composing SQL fragments safely.
 * Only accepts SafeSqlFragment interpolations — plain strings are rejected at
 * compile time.
 */
export function safeSql(
  strings: TemplateStringsArray,
  ...interpolated: Array<SafeSqlFragment>
): SafeSqlFragment {
  return strings.reduce(
    (result, string, i) => result + string + (interpolated[i] ?? ''),
    ''
  ) as SafeSqlFragment
}

/**
 * Marks a user-provided SQL string as a SafeSqlFragment for execution.
 * Only use this when the user has explicitly typed or authored the SQL
 * (e.g. a SQL editor, RLS tester). Never use for arbitrary data.
 */
export function rawSql(sql: string): SafeSqlFragment {
  return sql as SafeSqlFragment
}

/**
 * Marks SQL that may have been influenced by a third party (URL params, AI
 * output, external content) as UntrustedSqlFragment. Safe to display; must
 * never be auto-executed or persisted as user-authored.
 */
export function untrustedSql(sql: string): UntrustedSqlFragment {
  return sql as UntrustedSqlFragment
}

/**
 * Promote SQL to executable after explicit user acknowledgment.
 * Accepts DisplayableSqlFragment (SafeSqlFragment | UntrustedSqlFragment) because
 * a Run action approves whatever is currently in the editor, whether the user typed
 * it themselves or loaded it from an external source.
 * ONLY call from an event handler tied to a deliberate user action (onClick,
 * keydown on Run shortcut). Never call from useEffect, render, or any path
 * that runs without a user gesture.
 */
export function acceptUntrustedSql(sql: DisplayableSqlFragment): SafeSqlFragment {
  return sql as unknown as SafeSqlFragment
}

/**
 * Joins an array of already-safe SQL fragments with a fixed structural
 * separator.
 */
export function joinSqlFragments(
  fragments: Array<SafeSqlFragment>,
  separator: SqlFragmentSeparator
): SafeSqlFragment {
  return fragments.join(separator) as SafeSqlFragment
}
