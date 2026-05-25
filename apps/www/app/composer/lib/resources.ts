import type { MergeResult } from './composer'
import type { Template } from './templates'

export type ComposerResourceKind = 'config' | 'schema' | 'table' | 'bucket' | 'edge-function'

export interface ComposerResource {
  id: string
  kind: ComposerResourceKind
  label: string
  sourceFilePath: string
  sourceTemplateIds: string[]
  schema?: string
}

interface ResourceCandidate {
  id: string
  kind: ComposerResourceKind
  label: string
  sourceFilePath: string
  sourceTemplateId: string
  schema?: string
}

export function extractComposerResources({
  templates,
  mergeResult,
}: {
  templates: Template[]
  mergeResult: MergeResult | null
}): ComposerResource[] {
  const mergedFilePaths = new Set(mergeResult?.files.map((file) => file.path) ?? [])
  const resources = new Map<string, ComposerResource>()

  for (const template of templates) {
    for (const file of template.files) {
      if (mergedFilePaths.size > 0 && !mergedFilePaths.has(file.path)) continue

      for (const candidate of extractResourcesFromFile(file.path, file.content, template.id)) {
        const existing = resources.get(candidate.id)

        if (existing) {
          existing.sourceTemplateIds = Array.from(
            new Set([...existing.sourceTemplateIds, candidate.sourceTemplateId])
          ).sort()
          continue
        }

        resources.set(candidate.id, {
          id: candidate.id,
          kind: candidate.kind,
          label: candidate.label,
          schema: candidate.schema,
          sourceFilePath: candidate.sourceFilePath,
          sourceTemplateIds: [candidate.sourceTemplateId],
        })
      }
    }
  }

  return Array.from(resources.values()).sort((a, b) => {
    const kindComparison = a.kind.localeCompare(b.kind)
    if (kindComparison !== 0) return kindComparison

    return a.id.localeCompare(b.id)
  })
}

function extractResourcesFromFile(
  path: string,
  content: string,
  templateId: string
): ResourceCandidate[] {
  if (path.endsWith('.toml')) {
    return extractConfigResources(path, content, templateId)
  }

  const edgeFunctionName = getEdgeFunctionName(path)
  if (edgeFunctionName) {
    return [
      {
        id: `edge-function:${edgeFunctionName}`,
        kind: 'edge-function',
        label: edgeFunctionName,
        sourceFilePath: path,
        sourceTemplateId: templateId,
      },
    ]
  }

  if (path.endsWith('.sql')) {
    return extractSqlResources(path, content, templateId)
  }

  return []
}

function extractConfigResources(
  path: string,
  content: string,
  templateId: string
): ResourceCandidate[] {
  const sections = new Set<string>()
  const schemas = new Set<string>()

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    const sectionMatch = trimmed.match(/^\[([^\].]+)(?:\.[^\]]+)?\]$/)
    if (sectionMatch) sections.add(sectionMatch[1])

    const schemasMatch = trimmed.match(/^schemas\s*=\s*\[([^\]]*)\]$/)
    if (schemasMatch) {
      for (const schema of schemasMatch[1].match(/"([^"]+)"/g) ?? []) {
        schemas.add(schema.replaceAll('"', ''))
      }
    }
  }

  if (sections.has('db')) schemas.add('public')

  return [
    ...Array.from(sections).map((section) => ({
      id: `config:${section}`,
      kind: 'config' as const,
      label: section,
      sourceFilePath: path,
      sourceTemplateId: templateId,
    })),
    ...Array.from(schemas).map((schema) => ({
      id: `schema:${schema}`,
      kind: 'schema' as const,
      label: schema,
      sourceFilePath: path,
      sourceTemplateId: templateId,
    })),
  ]
}

function extractSqlResources(
  path: string,
  content: string,
  templateId: string
): ResourceCandidate[] {
  const resources: ResourceCandidate[] = []

  for (const statement of splitSqlStatements(content)) {
    const schema = matchIdentifier(
      statement,
      /create\s+schema\s+(?:if\s+not\s+exists\s+)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i
    )

    if (schema) {
      resources.push({
        id: `schema:${schema}`,
        kind: 'schema',
        label: schema,
        sourceFilePath: path,
        sourceTemplateId: templateId,
      })
    }

    const table = matchQualifiedIdentifier(
      statement,
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:(?:"([^"]+)"|([a-zA-Z_][\w$]*))\.)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/i
    )

    if (table) {
      resources.push({
        id: `schema:${table.schema}`,
        kind: 'schema',
        label: table.schema,
        sourceFilePath: path,
        sourceTemplateId: templateId,
      })
      resources.push({
        id: `table:${table.schema}.${table.name}`,
        kind: 'table',
        label: table.name,
        schema: table.schema,
        sourceFilePath: path,
        sourceTemplateId: templateId,
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
      })
    }
  }

  return resources
}

function splitSqlStatements(content: string): string[] {
  const statements: string[] = []
  let currentStatement = ''
  let inDollarBlock = false

  for (const line of content.split('\n')) {
    const dollarDelimiterCount = line.match(/\$\$/g)?.length ?? 0

    if (dollarDelimiterCount % 2 === 1) {
      inDollarBlock = !inDollarBlock
    }

    currentStatement += `${line}\n`

    if (line.trim().endsWith(';') && !inDollarBlock) {
      statements.push(currentStatement.trim())
      currentStatement = ''
    }
  }

  if (currentStatement.trim()) {
    statements.push(currentStatement.trim())
  }

  return statements
}

function matchIdentifier(statement: string, regex: RegExp) {
  const match = statement.match(regex)
  if (!match) return null

  return match[1] ?? match[2] ?? null
}

function matchQualifiedIdentifier(statement: string, regex: RegExp) {
  const match = statement.match(regex)
  if (!match) return null

  return {
    schema: match[1] ?? match[2] ?? 'public',
    name: match[3] ?? match[4],
  }
}

function matchStorageBucketId(statement: string) {
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

function splitSqlValueList(valueList: string) {
  const values: string[] = []
  let currentValue = ''
  let inString = false

  for (let index = 0; index < valueList.length; index++) {
    const char = valueList[index]
    const nextChar = valueList[index + 1]

    currentValue += char

    if (char === "'" && nextChar === "'") {
      currentValue += nextChar
      index++
      continue
    }

    if (char === "'") {
      inString = !inString
      continue
    }

    if (char === ',' && !inString) {
      values.push(currentValue.slice(0, -1).trim())
      currentValue = ''
    }
  }

  if (currentValue.trim()) {
    values.push(currentValue.trim())
  }

  return values
}

function getEdgeFunctionName(path: string) {
  return path.match(/(?:^|\/)functions\/([^/]+)\/index\.(?:ts|js)$/)?.[1] ?? null
}
