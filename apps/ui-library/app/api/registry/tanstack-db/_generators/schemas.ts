import { OpenAPIDefinition } from '../types'
import { openApiTypeToZod, toCamelCase, toPascalCase } from '../utils'

// Generate schemas.ts content from OpenAPI definitions
export function generateSchemasContent(definitions: Record<string, OpenAPIDefinition>): string {
  const lines: string[] = ["import { z } from 'zod'", '']

  for (const [tableName, definition] of Object.entries(definitions)) {
    // Skip internal PostgREST tables
    if (tableName.startsWith('_')) continue

    const typeName = toPascalCase(tableName)
    const schemaName = `${toCamelCase(tableName)}Schema`
    const properties = definition.properties || {}
    const required = definition.required || []

    lines.push(`// ${typeName} schema`)
    lines.push(`export const ${schemaName} = z.object({`)

    for (const [propName, prop] of Object.entries(properties)) {
      const isRequired = required.includes(propName)
      const zodType = openApiTypeToZod(prop, isRequired)
      lines.push(`  ${propName}: ${zodType},`)
    }

    lines.push('})')
    lines.push('')
    lines.push(`export type ${typeName} = z.infer<typeof ${schemaName}>`)
    lines.push('')
  }

  return lines.join('\n')
}
