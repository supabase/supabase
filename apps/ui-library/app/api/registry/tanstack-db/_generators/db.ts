import { OpenAPIDefinition } from '../types'
import { findPrimaryKeys, propAccess, sanitizeIdentifier, toCamelCase } from '../utils'

// Generate db.ts content from OpenAPI definitions
export function generateDbContent(definitions: Record<string, OpenAPIDefinition>): string {
  const tableNames = Object.keys(definitions).filter((name) => !name.startsWith('_'))

  const lines: string[] = [
    "import { supabaseCollectionOptions } from 'supa-tdb-collection'",
    "import { createClient } from '@/lib/supabase/client'",
    'import {',
    ...tableNames.map((name) => `  ${toCamelCase(sanitizeIdentifier(name))}Schema,`),
    "} from './schemas'",
    "import { createCollection } from '@tanstack/db'",
    '',
    'const supabase = createClient()',
    '',
  ]

  for (const [tableName, definition] of Object.entries(definitions)) {
    // Skip internal PostgREST tables
    if (tableName.startsWith('_')) continue

    const safeTableId = sanitizeIdentifier(tableName)
    const collectionName = `${toCamelCase(safeTableId)}Collection`
    const schemaName = `${toCamelCase(safeTableId)}Schema`
    const properties = definition.properties || {}
    const primaryKeys = findPrimaryKeys(properties)

    if (primaryKeys.length === 0) {
      throw new Error(
        `Table "${tableName}" has no primary key columns. TanStack DB collections require at least one primary key. Skipping generation for this table.`
      )
    }

    // Generate getKey function using bracket notation for safety
    let getKeyFn: string
    if (primaryKeys.length === 1) {
      getKeyFn = `(item) => ${propAccess('item', primaryKeys[0])}`
    } else {
      const keyParts = primaryKeys.map((k) => `\${${propAccess('item', k)}}`).join('-')
      getKeyFn = `(item) => \`${keyParts}\``
    }

    // Generate where function
    let whereFn: string
    if (primaryKeys.length === 1) {
      whereFn = `(query, item) => query.eq(${JSON.stringify(primaryKeys[0])}, ${propAccess('item', primaryKeys[0])})`
    } else {
      const whereParts = primaryKeys
        .map((k) => `.eq(${JSON.stringify(k)}, ${propAccess('item', k)})`)
        .join('')
      whereFn = `(query, item) => query${whereParts}`
    }

    lines.push(`export const ${collectionName} = createCollection(supabaseCollectionOptions({`)
    lines.push(`  tableName: ${JSON.stringify(tableName)},`)
    lines.push(`  getKey: ${getKeyFn},`)
    lines.push(`  where: ${whereFn},`)
    lines.push(`  schema: ${schemaName},`)
    lines.push(`  realtime: true,`)
    lines.push('  supabase: supabase,')
    lines.push('}))')
    lines.push('')
  }

  return lines.join('\n')
}
