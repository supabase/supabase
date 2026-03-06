import { OpenAPIProperty } from './types'

// Convert OpenAPI type to Zod type
export function openApiTypeToZod(prop: OpenAPIProperty, isRequired: boolean): string {
  let zodType: string

  switch (prop.type) {
    case 'string':
      if (prop.format === 'uuid') {
        zodType = 'z.string().uuid()'
      } else if (prop.format === 'date-time' || prop.format === 'timestamp with time zone') {
        zodType = 'z.string()'
      } else if (prop.enum && prop.enum.length > 0) {
        const enumValues = prop.enum.map((e) => `'${e}'`).join(', ')
        zodType = `z.enum([${enumValues}])`
      } else {
        zodType = 'z.string()'
      }
      break
    case 'integer':
      zodType = 'z.number().int()'
      break
    case 'number':
      zodType = 'z.number()'
      break
    case 'boolean':
      zodType = 'z.boolean()'
      break
    case 'array':
      if (prop.items) {
        const itemType = openApiTypeToZod(prop.items as OpenAPIProperty, true)
        zodType = `z.array(${itemType})`
      } else {
        zodType = 'z.array(z.unknown())'
      }
      break
    case 'object':
      zodType = 'z.record(z.unknown())'
      break
    default:
      zodType = 'z.unknown()'
  }

  // Add nullable if not required
  if (!isRequired) {
    zodType += '.nullable()'
  }

  return zodType
}

// Convert table name to PascalCase for type names
export function toPascalCase(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

// Convert table name to camelCase for variable names
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

// Convert field name to human-readable label
export function toLabel(fieldName: string): string {
  return fieldName
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Get singular form of table name (simple heuristic)
export function toSingular(tableName: string): string {
  if (tableName.endsWith('ies')) {
    return tableName.slice(0, -3) + 'y'
  }
  if (tableName.endsWith('ses') || tableName.endsWith('xes') || tableName.endsWith('zes')) {
    return tableName.slice(0, -2)
  }
  if (tableName.endsWith('s') && !tableName.endsWith('ss')) {
    return tableName.slice(0, -1)
  }
  return tableName
}

// Find primary key columns from properties
export function findPrimaryKeys(properties: Record<string, OpenAPIProperty>): string[] {
  const primaryKeys: string[] = []

  for (const [name, prop] of Object.entries(properties)) {
    // Check if the description mentions primary key
    if (prop.description?.toLowerCase().includes('primary key')) {
      primaryKeys.push(name)
    }
  }

  // If no primary keys found, default to 'id' if it exists
  if (primaryKeys.length === 0 && properties['id']) {
    primaryKeys.push('id')
  }

  return primaryKeys
}
