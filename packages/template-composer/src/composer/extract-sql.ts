import {
  matchIdentifier,
  matchQualifiedIdentifier,
  splitSqlStatements,
  splitSqlValueList,
} from './sql'
import type { ResourceCandidate, ResourceExtractor } from './types'

const SCHEMA_DISPLAY_ORDER = 200

export const extractSql: ResourceExtractor = ({ path, content, templateId }) => {
  const resources: ResourceCandidate[] = []

  for (const statement of splitSqlStatements(content)) {
    const schema = matchIdentifier(
      statement,
      /create\s+schema\s+(?:if\s+not\s+exists\s+)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i
    )

    if (schema) {
      resources.push(makeSchemaResource({ schema, path, templateId }))
    }

    const table = matchQualifiedIdentifier(
      statement,
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:(?:"([^"]+)"|([a-zA-Z_][\w$]*))\.)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i
    )

    if (table) {
      resources.push(makeSchemaResource({ schema: table.schema, path, templateId }))
      resources.push({
        id: `table:${table.schema}.${table.name}`,
        kind: 'table',
        label: table.name,
        schema: table.schema,
        sourceFilePath: path,
        sourceTemplateId: templateId,
        iconKey: 'table',
        parentResourceId: `schema:${table.schema}`,
      })
    }

    const bucketId = matchStorageBucketId(statement)

    if (bucketId) {
      resources.push({
        id: `bucket:${bucketId}`,
        kind: 'bucket',
        label: bucketId,
        sourceFilePath: path,
        sourceTemplateId: templateId,
        iconKey: 'bucket',
        parentResourceId: 'config:storage',
      })
    }
  }

  return resources
}

function makeSchemaResource({
  schema,
  path,
  templateId,
}: {
  schema: string
  path: string
  templateId: string
}): ResourceCandidate {
  return {
    id: `schema:${schema}`,
    kind: 'schema',
    label: schema,
    sourceFilePath: path,
    sourceTemplateId: templateId,
    iconKey: 'schema',
    displayOrder: SCHEMA_DISPLAY_ORDER,
    connectsToDatabase: true,
  }
}

function matchStorageBucketId(statement: string): string | null {
  const match = statement.match(
    /insert\s+into\s+storage\.buckets\s*\(([^)]+)\)\s*values\s*\(([^)]+)\)/is
  )
  if (!match) return null

  const columns = match[1].split(',').map((column) => column.trim().replaceAll('"', ''))
  const values = splitSqlValueList(match[2])
  const idIndex = columns.indexOf('id')
  const bucketId = values[idIndex >= 0 ? idIndex : 0]

  return bucketId?.replace(/^'|'$/g, '') ?? null
}
