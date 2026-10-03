import prettier from 'prettier/standalone.js'
import SqlFormatter from 'prettier-plugin-sql'
import { parse, deparse } from 'pgsql-parser'
import { FormatterOptions } from './types.js'

const DEFAULT_FORMATTER_OPTIONS = {
  plugins: [SqlFormatter],
  formatter: 'sql-formatter',
  language: 'postgresql',
  database: 'postgresql',
  parser: 'sql',
}

/**
 * Parses a SQL string into an AST.
 */
export function Parse(sql: string): ParseReturnValues {
  try {
    const data = parse(sql)

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}
interface ParseReturnValues {
  data: object | null
  error: null | Error
}

/**
 * Deparses an AST into SQL string.
 */
export async function Deparse(parsedSql: object): Promise<DeparseReturnValues> {
  try {
    const data = await deparse(parsedSql, {})
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}
interface DeparseReturnValues {
  data: string | null
  error: null | Error
}

/**
 * Formats a SQL string into a prettier-formatted SQL string.
 */
export async function Format(
  sql: string,
  options: FormatterOptions = {}
): Promise<FormatReturnValues> {
  try {
    const formatted = await prettier.format(sql, {
      ...DEFAULT_FORMATTER_OPTIONS,
      ...options,
    })

    return { data: formatted, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}
interface FormatReturnValues {
  data: string | null
  error: null | Error
}
