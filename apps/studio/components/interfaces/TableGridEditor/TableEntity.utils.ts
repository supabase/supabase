import { SupaTable } from 'components/grid/types'

import { Lint } from '@/data/lint/lint-query'

export const getEntityLintDetails = (
  entityName: string,
  lintName: string,
  lintLevels: ('ERROR' | 'WARN' | 'INFO')[],
  lints: Lint[],
  schema: string
): { hasLint: boolean; count: number; matchingLint: Lint | null } => {
  const matchingLint =
    lints?.find(
      (lint) =>
        lint?.metadata?.name === entityName &&
        lint?.metadata?.schema === schema &&
        lint?.name === lintName &&
        lintLevels.includes(lint?.level)
    ) || null

  return {
    hasLint: matchingLint !== null,
    count: matchingLint ? 1 : 0,
    matchingLint,
  }
}

export const formatTableRowsToSQL = (table: SupaTable, rows: any[]) => {
  if (rows.length === 0) return ''

  const columns = table.columns.map((col) => `"${col.name}"`).join(', ')

  const valuesSets = rows
    .map((row) => {
      const filteredRow = { ...row }
      if ('idx' in filteredRow) delete filteredRow.idx

      const values = Object.entries(filteredRow).map(([key, val]) => {
        const { dataType, format } = table.columns.find((col) => col.name === key) ?? {}

        // We only check for NULL, array and JSON types, everything else we stringify
        // given that Postgres can implicitly cast the right type based on the column type
        // For string types, we need to deal with escaping single quotes
        const stringFormats = ['text', 'varchar']

        if (val === null) {
          return 'null'
        } else if (dataType === 'ARRAY') {
          const array = Array.isArray(val) ? val : JSON.parse(val as string)
          return `${formatArrayForSql(array as unknown[])}`
        } else if (format?.includes('json')) {
          return `${JSON.stringify(val).replace(/\\"/g, '"').replace(/'/g, "''").replace('"', "'").replace(/.$/, "'")}`
        } else if (
          typeof format === 'string' &&
          typeof val === 'string' &&
          stringFormats.includes(format)
        ) {
          return `'${val.replaceAll("'", "''")}'`
        } else {
          return `'${val}'`
        }
      })

      return `(${values.join(', ')})`
    })
    .join(', ')

  return `INSERT INTO "${table.schema}"."${table.name}" (${columns}) VALUES ${valuesSets};`
}

/**
 * Generate a random tag for dollar-quoting of SQL strings
 *
 * @return A random tag in the format `$tag$`
 */
const generateRandomTag = (): `$${string}$` => {
  const inner = Math.random().toString(36).substring(2, 15)
  // Ensure the tag starts with a character not a digit to avoid conflicts with
  // Postgres parameter syntax
  return `$x${inner}$`
}

/**
 * Wrap a string in dollar-quote tags, ensuring the tag does not appear in the string
 *
 * @throws Error if unable to generate a unique tag after multiple attempts
 */
const safeDollarQuote = (str: string): string => {
  let tag = generateRandomTag()

  let attempts = 0
  const maxAttempts = 100
  while (str.includes(tag)) {
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate a unique dollar-quote tag after multiple attempts.')
    }

    attempts++
    tag = generateRandomTag()
  }
  return `${tag}${str}${tag}`
}

const formatArrayForSql = (arr: unknown[]): string => {
  let result = 'ARRAY['

  arr.forEach((item, index) => {
    if (Array.isArray(item)) {
      result += formatArrayForSql(item)
    } else if (typeof item === 'string') {
      result += `"${item.replace(/"/g, '""')}"`
    } else if (!!item && typeof item === 'object') {
      result += `${safeDollarQuote(JSON.stringify(item))}::json`
    } else {
      result += `${item}`
    }

    if (index < arr.length - 1) {
      result += ','
    }
  })

  result += ']'

  return result
}
