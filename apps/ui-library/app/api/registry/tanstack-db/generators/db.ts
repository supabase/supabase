import { OpenAPIDefinition } from '../types'
import { findPrimaryKeys, toCamelCase } from '../utils'

// Generate db.ts content from OpenAPI definitions
export function generateDbContent(definitions: Record<string, OpenAPIDefinition>): string {
  const tableNames = Object.keys(definitions).filter((name) => !name.startsWith('_'))

  const lines: string[] = [
    "import { createSupabaseCollection } from 'supabase-collection'",
    "import { createClient } from '@/lib/supabase/client'",
    "import { getQueryClient } from '@/lib/query-client'",
    'import {',
    ...tableNames.map((name) => `  ${toCamelCase(name)}Schema,`),
    "} from './schemas'",
    '',
    'const supabase = createClient()',
    '',
  ]

  for (const [tableName, definition] of Object.entries(definitions)) {
    // Skip internal PostgREST tables
    if (tableName.startsWith('_')) continue

    const collectionName = `${toCamelCase(tableName)}Collection`
    const schemaName = `${toCamelCase(tableName)}Schema`
    const properties = definition.properties || {}
    const primaryKeys = findPrimaryKeys(properties)

    // Generate getKey function
    let getKeyFn: string
    if (primaryKeys.length === 1) {
      getKeyFn = `(item) => item.${primaryKeys[0]}`
    } else if (primaryKeys.length > 1) {
      const keyParts = primaryKeys.map((k) => `\${item.${k}}`).join('-')
      getKeyFn = `(item) => \`${keyParts}\``
    } else {
      // Fallback to JSON stringify if no keys found
      getKeyFn = '(item) => JSON.stringify(item)'
    }

    // Generate where function
    let whereFn: string
    if (primaryKeys.length === 1) {
      whereFn = `(query, item) => query.eq('${primaryKeys[0]}', item.${primaryKeys[0]})`
    } else if (primaryKeys.length > 1) {
      const whereParts = primaryKeys.map((k) => `.eq('${k}', item.${k})`).join('')
      whereFn = `(query, item) => query${whereParts}`
    } else {
      whereFn = '(query, item) => query'
    }

    lines.push(`export const ${collectionName} = createSupabaseCollection({`)
    lines.push(`  tableName: '${tableName}',`)
    lines.push(`  getKey: ${getKeyFn},`)
    lines.push(`  where: ${whereFn},`)
    lines.push(`  schema: ${schemaName},`)
    lines.push('  queryClient: getQueryClient(),')
    lines.push('  supabase: supabase as any,')
    lines.push('})')
    lines.push('')
  }

  return lines.join('\n')
}
