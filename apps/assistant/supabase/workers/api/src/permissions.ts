import { z } from 'zod'

export const projectPermissionLevelSchema = z.enum([
  'disabled',
  'schema',
  'schema_and_log',
  'schema_and_log_and_data',
])
export type ProjectPermissionLevel = z.infer<typeof projectPermissionLevelSchema>

export const ASSISTANT_NO_DATA_PERMISSIONS =
  'The query was executed and the user has viewed the results but decided not to share in the conversation due to permission levels. Continue with your plan unless instructed to interpret the result.'

export const ASSISTANT_MCP_TOOLS = {
  search_docs: 'disabled',
  list_tables: 'schema',
  list_extensions: 'schema',
  list_edge_functions: 'schema',
  list_branches: 'schema',
  get_advisors: 'schema_and_log',
  query_logs: 'schema_and_log',
} as const satisfies Record<string, ProjectPermissionLevel>

export function canShareAssistantData(
  level: ProjectPermissionLevel,
  minimum: ProjectPermissionLevel
) {
  return (
    projectPermissionLevelSchema.options.indexOf(level) >=
    projectPermissionLevelSchema.options.indexOf(minimum)
  )
}

export function assistantSqlModelOutput(output: unknown, level: ProjectPermissionLevel) {
  return level === 'schema_and_log_and_data' ? output : ASSISTANT_NO_DATA_PERMISSIONS
}

export const ASSISTANT_CONSENT_VERSION = 1

const permissionChoices = [
  {
    value: 'disabled',
    label: 'No project data',
    description: 'Get general help without sharing database information.',
  },
  {
    value: 'schema',
    label: 'Schema',
    description: 'Share table names, columns, data types, and relationships.',
  },
  {
    value: 'schema_and_log',
    label: 'Schema and logs',
    description:
      'Also share project logs, which may contain personal information or database data.',
  },
  {
    value: 'schema_and_log_and_data',
    label: 'Schema, logs, and query results',
    description: 'Also share the results of SQL queries you approve.',
  },
] satisfies { value: ProjectPermissionLevel; label: string; description: string }[]

/** Public settings representation: the host renders choices without interpreting their values. */
export function presentProjectPermissions(permissions: {
  level: ProjectPermissionLevel
  hasConsented: boolean
  consentVersion: number
}) {
  return {
    selection: permissions.level,
    hasConsented: permissions.hasConsented,
    consentVersion: permissions.consentVersion,
    options: permissionChoices.map((choice) => ({
      ...choice,
      disabled: false,
    })),
    capabilities: { includeContext: permissions.hasConsented && permissions.level !== 'disabled' },
  }
}
