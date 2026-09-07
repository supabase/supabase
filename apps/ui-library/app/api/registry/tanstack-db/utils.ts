import { OpenAPIProperty } from './types'

// Valid JS identifier pattern: starts with letter or underscore, contains only alphanumeric and underscores
const VALID_IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/**
 * Validate that a name is safe for use as a JS/TS identifier.
 * Throws if the name contains characters that cannot produce a valid identifier.
 */
export function sanitizeIdentifier(name: string): string {
  // Replace common non-identifier characters with underscores
  let sanitized = name.replace(/[^a-zA-Z0-9_]/g, '_')
  // Ensure it doesn't start with a digit
  if (/^[0-9]/.test(sanitized)) {
    sanitized = `_${sanitized}`
  }
  // Collapse multiple underscores
  sanitized = sanitized.replace(/_+/g, '_').replace(/^_+|_+$/g, '') || '_'

  if (!VALID_IDENTIFIER_RE.test(sanitized)) {
    throw new Error(
      `Cannot safely map name "${name}" to a valid identifier. Names must contain only letters, digits, and underscores.`
    )
  }

  return sanitized
}

/**
 * Validate that a name is safe for use as a file path segment.
 * Rejects traversal sequences, slashes, and other dangerous characters.
 */
export function safeFileSegment(name: string): string {
  if (
    name.includes('/') ||
    name.includes('\\') ||
    name.includes('..') ||
    name.includes('\0') ||
    name.startsWith('.')
  ) {
    throw new Error(
      `Unsafe file segment: "${name}". Names must not contain path separators, traversal sequences, or start with a dot.`
    )
  }

  // Only allow alphanumeric, underscores, and hyphens in file segments
  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '_')
  if (!sanitized) {
    throw new Error(`Cannot safely map name "${name}" to a file path segment.`)
  }

  return sanitized
}

/**
 * Emit safe property access for generated code.
 * Uses dot notation for identifier-safe names, bracket notation otherwise.
 */
export function propAccess(obj: string, name: string): string {
  if (VALID_IDENTIFIER_RE.test(name)) {
    return `${obj}.${name}`
  }
  return `${obj}[${JSON.stringify(name)}]`
}

/**
 * Validate all table and column names from OpenAPI definitions upfront.
 * Throws a descriptive error if any name cannot be safely used.
 */
export function validateDefinitionNames(
  definitions: Record<string, { properties?: Record<string, unknown> }>
): void {
  for (const [tableName, def] of Object.entries(definitions)) {
    if (tableName.startsWith('_')) continue
    // Validate table name can be used as identifier and file segment
    sanitizeIdentifier(tableName)
    safeFileSegment(tableName)

    if (def.properties) {
      for (const colName of Object.keys(def.properties)) {
        // Validate column names can at minimum be used as quoted properties
        if (colName.includes('\0') || colName.includes('\\')) {
          throw new Error(
            `Unsafe column name "${colName}" in table "${tableName}". Column names must not contain null bytes or backslashes.`
          )
        }
      }
    }
  }
}

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
        const enumValues = prop.enum.map((e) => `'${e.replace(/'/g, "\\'")}'`).join(', ')
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
