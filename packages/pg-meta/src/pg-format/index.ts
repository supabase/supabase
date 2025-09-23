import { POSTGRESQL_RESERVED_WORDS } from './reserved'

interface PgFormatConfigPattern {
  ident: string
  literal: string
  string: string
}

export interface PgFormatConfig {
  pattern: PgFormatConfigPattern
}

const FMT_PATTERN_CONFIG: PgFormatConfigPattern = {
  ident: 'I',
  literal: 'L',
  string: 's',
}

// convert to Postgres default ISO 8601 format
function formatDate(date: string): string {
  return date.replace('T', ' ').replace('Z', '+00')
}

function isReserved(value: string): boolean {
  if (POSTGRESQL_RESERVED_WORDS.has(value.toUpperCase())) {
    return true
  }
  return false
}

function arrayToList(useSpace: boolean, array: unknown[], formatter: (value: unknown) => string) {
  let sql = ''

  sql += useSpace ? ' (' : '('
  for (const [index, element] of array.entries()) {
    sql += (index === 0 ? '' : ', ') + formatter(element)
  }
  sql += ')'

  return sql
}

// Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
// eslint-disable-next-line radar/cognitive-complexity
export function ident(value?: unknown): string {
  if (value === undefined || value === null) {
    throw new Error('SQL identifier cannot be null or undefined')
  } else if (value === false) {
    return '"f"'
  } else if (value === true) {
    return '"t"'
  } else if (value instanceof Date) {
    return `"${formatDate(value.toISOString())}"`
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
    return temporary.toString()
  } else if (value === Object(value)) {
    throw new Error('SQL identifier cannot be an object')
  }

  const tident = String(value).slice(0) // create copy

  // do not quote a valid, unquoted identifier
  if (/^[_a-z][\d$_a-z]*$/.test(tident) === true && isReserved(tident) === false) {
    return tident
  }

  let quoted = '"'

  for (const c of tident) {
    quoted += c === '"' ? c + c : c
  }

  quoted += '"'

  return quoted
}

// Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
// eslint-disable-next-line radar/cognitive-complexity
export function literal(value?: unknown): string {
  let tliteral = ''
  let explicitCast: string | undefined

  if (value === undefined || value === null) {
    return 'NULL'
  }
  if (typeof value === 'bigint') {
    return BigInt(value).toString()
  }
  if (value === Number.POSITIVE_INFINITY) {
    return "'Infinity'"
  }
  if (value === Number.NEGATIVE_INFINITY) {
    return "'-Infinity'"
  }
  if (Number.isNaN(value)) {
    return "'NaN'"
  }
  if (typeof value === 'number') {
    // Test must be AFTER other special case number tests
    return Number(value).toString()
  }
  if (value === false) {
    return "'f'"
  }
  if (value === true) {
    return "'t'"
  }
  if (value instanceof Date) {
    return `'${formatDate(value.toISOString())}'`
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
    return temporary.toString()
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

  return quoted
}

// eslint-disable-next-line radar/cognitive-complexity
export function string(value?: unknown): string {
  if (value === undefined || value === null) {
    return ''
  }
  if (value === false) {
    return 'f'
  }
  if (value === true) {
    return 't'
  }
  if (value instanceof Date) {
    return formatDate(value.toISOString())
  }
  if (Array.isArray(value)) {
    const temporary: string[] = []
    for (const [index, element] of value.entries()) {
      if (element !== null && element !== undefined) {
        if (Array.isArray(element) === true) {
          temporary.push(arrayToList(index !== 0, element, string))
        } else {
          temporary.push(string(element))
        }
      }
    }
    return temporary.toString()
  }
  if (value === Object(value)) {
    return JSON.stringify(value)
  }

  return String(value).toString().slice(0) // return copy
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

export function withArray(fmt: string, parameters: unknown[]): string {
  let index = 0

  let reText = '%(%|(\\d+\\$)?['
  reText += FMT_PATTERN_CONFIG.ident
  reText += FMT_PATTERN_CONFIG.literal
  reText += FMT_PATTERN_CONFIG.string
  reText += '])'
  const re = new RegExp(reText, 'g')

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return fmt.replace(re, (_, type: string): string => {
    if (type === '%') {
      return '%'
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
  })
}

export function format(fmt: string, ...arguments_: unknown[]): string {
  return withArray(fmt, arguments_)
}
