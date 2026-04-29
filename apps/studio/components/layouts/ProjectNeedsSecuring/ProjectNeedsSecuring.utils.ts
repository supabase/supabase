import { type ProjectSecurityTable } from './ProjectNeedsSecuring.types'
import { parseDbSchemaString } from '@/data/config/project-postgrest-config-query'

const DEFAULT_EXPOSED_SCHEMA = 'public'

export const getTableKey = ({ schema, name }: { schema: string; name: string }) =>
  `${schema}.${name}`

export const getExposedSchemas = (dbSchema: string | null | undefined) => {
  const schemas = dbSchema ? parseDbSchemaString(dbSchema) : []
  return schemas.length > 0 ? schemas : [DEFAULT_EXPOSED_SCHEMA]
}

export const formatRlsDescription = (count: number) => {
  const isSingular = count === 1
  const noun = isSingular ? 'table' : 'tables'
  const verb = isSingular ? 'has' : 'have'
  const pronoun = isSingular ? 'its' : 'their'

  return `${count} ${noun} ${verb} RLS disabled which means anyone can access ${pronoun} data via the Data API.`
}

export const buildSecurityPromptMarkdown = (issueCount: number, tables: ProjectSecurityTable[]) => {
  const header = [
    '## Project security review',
    '',
    formatRlsDescription(issueCount),
    '',
    '### Tables',
    '',
    '| Table | Schema | Accessible via Data API | RLS |',
    '| --- | --- | --- | --- |',
  ]

  const rows = tables.map(
    (table) =>
      `| ${table.name} | ${table.schema} | ${table.dataApiAccessible ? 'Yes' : 'No'} | ${table.rlsEnabled ? 'Enabled' : 'Disabled'} |`
  )

  const footer = [
    '',
    '### Next step',
    '',
    'Help me enable RLS on these tables and suggest the minimum policies I should create.',
  ]

  return [...header, ...rows, ...footer].join('\n')
}

export const sortTables = (tables: ProjectSecurityTable[]) => {
  return [...tables].sort((a, b) => {
    const aPriority = a.hasRlsIssue ? 0 : a.rlsEnabled ? 2 : 1
    const bPriority = b.hasRlsIssue ? 0 : b.rlsEnabled ? 2 : 1

    if (aPriority !== bPriority) return aPriority - bPriority

    const schemaComparison = a.schema.localeCompare(b.schema)
    if (schemaComparison !== 0) return schemaComparison

    return a.name.localeCompare(b.name)
  })
}
