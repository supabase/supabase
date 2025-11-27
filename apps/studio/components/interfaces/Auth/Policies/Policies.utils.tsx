import type { PostgresPolicy } from '@supabase/postgres-meta'
import { has, isEmpty, isEqual } from 'lodash'
import Link from 'next/link'
import { toast } from 'sonner'

import { PolicyList } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/RLSManagement/PolicyList'
import { generateSqlPolicy } from 'data/ai/sql-policy-mutation'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import type { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'
import { getForeignKeyConstraints } from 'data/database/foreign-key-constraints-query'
import { getProjectDetail } from 'data/projects/project-detail-query'
import { getQueryClient } from 'data/query-client'
import { executeSql } from 'data/sql/execute-sql-query'
import { getTables } from 'data/tables/tables-query'
import { Button } from 'ui'
import {
  PolicyFormField,
  PolicyForReview,
  PostgresPolicyCreatePayload,
  PostgresPolicyUpdatePayload,
} from './Policies.types'

/**
 * Returns an array of SQL statements that will preview in the review step of the policy editor
 * @param {*} policyFormFields { name, using, check, command }
 */

export const createSQLPolicy = (
  policyFormFields: PolicyFormField,
  originalPolicyFormFields: PostgresPolicy
) => {
  const { definition, check } = policyFormFields
  const formattedPolicyFormFields = {
    ...policyFormFields,
    definition: definition
      ? definition.replace(/\s+/g, ' ').trim()
      : definition === undefined
        ? null
        : definition,
    check: check ? check.replace(/\s+/g, ' ').trim() : check === undefined ? null : check,
  }

  if (isEmpty(originalPolicyFormFields)) {
    return createSQLStatementForCreatePolicy(formattedPolicyFormFields)
  }

  // If there are no changes, return an empty object
  if (isEqual(policyFormFields, originalPolicyFormFields)) {
    return {}
  }

  // Extract out all the fields that updated
  const fieldsToUpdate: any = {}
  if (!isEqual(formattedPolicyFormFields.name, originalPolicyFormFields.name)) {
    fieldsToUpdate.name = formattedPolicyFormFields.name
  }
  if (!isEqual(formattedPolicyFormFields.definition, originalPolicyFormFields.definition)) {
    fieldsToUpdate.definition = formattedPolicyFormFields.definition
  }
  if (!isEqual(formattedPolicyFormFields.check, originalPolicyFormFields.check)) {
    fieldsToUpdate.check = formattedPolicyFormFields.check
  }
  if (!isEqual(formattedPolicyFormFields.roles, originalPolicyFormFields.roles)) {
    fieldsToUpdate.roles = formattedPolicyFormFields.roles
  }

  if (!isEmpty(fieldsToUpdate)) {
    return createSQLStatementForUpdatePolicy(formattedPolicyFormFields, fieldsToUpdate)
  }

  return {}
}

const createSQLStatementForCreatePolicy = (policyFormFields: PolicyFormField): PolicyForReview => {
  const { name, definition, check, command, schema, table } = policyFormFields
  const roles = policyFormFields.roles.length === 0 ? ['public'] : policyFormFields.roles
  const description = `Add policy for the ${command} operation under the policy "${name}"`
  const statement = [
    `CREATE POLICY "${name}" ON "${schema}"."${table}"`,
    `AS PERMISSIVE FOR ${command}`,
    `TO ${roles.join(', ')}`,
    `${definition ? `USING (${definition})` : ''}`,
    `${check ? `WITH CHECK (${check})` : ''}`,
  ].join('\n')

  return { description, statement }
}

export const createSQLStatementForUpdatePolicy = (
  policyFormFields: PolicyFormField,
  fieldsToUpdate: Partial<PolicyFormField>
): PolicyForReview => {
  const { name, schema, table } = policyFormFields

  const definitionChanged = has(fieldsToUpdate, ['definition'])
  const checkChanged = has(fieldsToUpdate, ['check'])
  const nameChanged = has(fieldsToUpdate, ['name'])
  const rolesChanged = has(fieldsToUpdate, ['roles'])

  const parameters = Object.keys(fieldsToUpdate)
  const description = `Update policy's ${
    parameters.length === 1
      ? parameters[0]
      : `${parameters.slice(0, parameters.length - 1).join(', ')} and ${
          parameters[parameters.length - 1]
        }`
  } `
  const roles =
    (fieldsToUpdate?.roles ?? []).length === 0 ? ['public'] : (fieldsToUpdate.roles as string[])

  const alterStatement = `ALTER POLICY "${name}" ON "${schema}"."${table}"`
  const statement = [
    'BEGIN;',
    ...(definitionChanged ? [`  ${alterStatement} USING (${fieldsToUpdate.definition});`] : []),
    ...(checkChanged ? [`  ${alterStatement} WITH CHECK (${fieldsToUpdate.check});`] : []),
    ...(rolesChanged ? [`  ${alterStatement} TO ${roles.join(', ')};`] : []),
    ...(nameChanged ? [`  ${alterStatement} RENAME TO "${fieldsToUpdate.name}";`] : []),
    'COMMIT;',
  ].join('\n')

  return { description, statement }
}

export const createPayloadForCreatePolicy = (
  policyFormFields: PolicyFormField
): PostgresPolicyCreatePayload => {
  const { command, definition, check, roles } = policyFormFields
  return {
    ...policyFormFields,
    action: 'PERMISSIVE',
    command: command || undefined,
    definition: definition || undefined,
    check: check || undefined,
    roles: roles.length > 0 ? roles : undefined,
  }
}

export const createPayloadForUpdatePolicy = (
  policyFormFields: PolicyFormField,
  originalPolicyFormFields: PostgresPolicy
): PostgresPolicyUpdatePayload => {
  const { definition, check } = policyFormFields
  const formattedPolicyFormFields = {
    ...policyFormFields,
    definition: definition ? definition.replace(/\s+/g, ' ').trim() : definition,
    check: check ? check.replace(/\s+/g, ' ').trim() : check,
  }

  const payload: PostgresPolicyUpdatePayload = { id: originalPolicyFormFields.id }

  if (!isEqual(formattedPolicyFormFields.name, originalPolicyFormFields.name)) {
    payload.name = formattedPolicyFormFields.name
  }
  if (!isEqual(formattedPolicyFormFields.definition, originalPolicyFormFields.definition)) {
    payload.definition = formattedPolicyFormFields.definition || undefined
  }
  if (!isEqual(formattedPolicyFormFields.check, originalPolicyFormFields.check)) {
    payload.check = formattedPolicyFormFields.check || undefined
  }
  if (!isEqual(formattedPolicyFormFields.roles, originalPolicyFormFields.roles)) {
    if (formattedPolicyFormFields.roles.length === 0) payload.roles = ['public']
    else payload.roles = formattedPolicyFormFields.roles || undefined
  }

  return payload
}

// --- Policy Generation ---

export type GeneratedPolicy = {
  name: string
  sql: string
  command?: string
}

type Relationship = {
  source_schema: string
  source_table_name: string
  source_column_name: string
  target_table_schema: string
  target_table_name: string
  target_column_name: string
}

/**
 * Gets relationships for a specific table from FK constraints.
 * Returns relationships where the table is the source.
 */
const getRelationshipsForTable = (
  schema: string,
  tableName: string,
  allForeignKeyConstraints: ForeignKeyConstraint[]
): Relationship[] => {
  return allForeignKeyConstraints
    .filter((fk) => fk.source_schema === schema && fk.source_table === tableName)
    .flatMap((fk) =>
      fk.source_columns.map((sourceCol, i) => ({
        source_schema: fk.source_schema,
        source_table_name: fk.source_table,
        source_column_name: sourceCol,
        target_table_schema: fk.target_schema,
        target_table_name: fk.target_table,
        target_column_name: fk.target_columns[i],
      }))
    )
}

/**
 * BFS to find shortest path from table to auth.users via foreign key relationships.
 * Returns null if no path exists within maxDepth.
 */
const findPathToAuthUsers = (
  startTable: { schema: string; name: string },
  allForeignKeyConstraints: ForeignKeyConstraint[],
  maxDepth = 3
): Relationship[] | null => {
  const startRelationships = getRelationshipsForTable(
    startTable.schema,
    startTable.name,
    allForeignKeyConstraints
  )

  const queue: { table: { schema: string; name: string }; path: Relationship[] }[] = [
    { table: startTable, path: [] },
  ]
  const visited = new Set<string>()
  visited.add(`${startTable.schema}.${startTable.name}`)

  while (queue.length > 0) {
    const { table, path } = queue.shift()!

    if (path.length >= maxDepth) {
      continue
    }

    const relationships =
      path.length === 0
        ? startRelationships
        : getRelationshipsForTable(table.schema, table.name, allForeignKeyConstraints)

    for (const rel of relationships) {
      // Found path to auth.users
      if (
        rel.target_table_schema === 'auth' &&
        rel.target_table_name === 'users' &&
        rel.target_column_name === 'id'
      ) {
        return [...path, rel]
      }

      const targetId = `${rel.target_table_schema}.${rel.target_table_name}`
      if (visited.has(targetId)) {
        continue
      }

      // Add target table to queue for further exploration
      queue.push({
        table: { schema: rel.target_table_schema, name: rel.target_table_name },
        path: [...path, rel],
      })
      visited.add(targetId)
    }
  }

  return null
}

/** Generates SQL expression for RLS policy based on FK path to auth.users */
const buildPolicyExpression = (path: Relationship[]): string => {
  if (path.length === 0) return ''

  // Direct FK to auth.users
  if (path.length === 1) {
    return `(select auth.uid()) = ${path[0].source_column_name}`
  }

  // Indirect path - build EXISTS with JOINs
  const [first, ...rest] = path
  const firstTarget = `${first.target_table_schema}.${first.target_table_name}`
  const source = `${first.source_schema}.${first.source_table_name}`
  const last = path[path.length - 1]

  const joins = rest
    .slice(0, -1)
    .map(
      (r) =>
        `join ${r.target_table_schema}.${r.target_table_name} on ${r.target_table_schema}.${r.target_table_name}.${r.target_column_name} = ${r.source_schema}.${r.source_table_name}.${r.source_column_name}`
    )
    .join('\n  ')

  return `exists (
  select 1 from ${firstTarget}
  ${joins}
  where ${firstTarget}.${first.target_column_name} = ${source}.${first.source_column_name}
  and ${last.source_schema}.${last.source_table_name}.${last.source_column_name} = (select auth.uid())
)`
}

/** Builds policy SQL for all CRUD operations */
const buildPoliciesForPath = (
  table: { name: string; schema: string },
  path: Relationship[]
): GeneratedPolicy[] => {
  const expression = buildPolicyExpression(path)
  const targetCol = path[0].source_column_name

  return (['SELECT', 'INSERT', 'UPDATE', 'DELETE'] as const).map((command) => {
    const name = `Enable ${command.toLowerCase()} access for users based on ${targetCol}`
    const base = `CREATE POLICY "${name}" ON "${table.schema}"."${table.name}" AS PERMISSIVE FOR ${command} TO public`

    const sql =
      command === 'INSERT'
        ? `${base} WITH CHECK (${expression});`
        : command === 'UPDATE'
          ? `${base} USING (${expression}) WITH CHECK (${expression});`
          : `${base} USING (${expression});`

    return { name, sql, command }
  })
}

/**
 * Generates RLS policies programmatically based on FK relationships to auth.users.
 */
export const generateProgrammaticPoliciesForTable = ({
  table,
  foreignKeyConstraints,
}: {
  table: { name: string; schema: string }
  foreignKeyConstraints: ForeignKeyConstraint[]
}): GeneratedPolicy[] => {
  try {
    const path = findPathToAuthUsers(table, foreignKeyConstraints)
    if (path?.length) {
      return buildPoliciesForPath(table, path)
    }
  } catch (error) {
    console.error('Programmatic policy generation failed:', error)
  }

  return []
}

/**
 * Generates RLS policies using AI.
 */
export const generateAiPoliciesForTable = async ({
  table,
  columns,
  projectRef,
  connectionString,
}: {
  table: { name: string; schema: string }
  columns: { name: string }[]
  projectRef: string
  connectionString?: string | null
}): Promise<GeneratedPolicy[]> => {
  if (!connectionString) {
    return []
  }

  try {
    const aiPolicies = await generateSqlPolicy({
      tableName: table.name,
      schema: table.schema,
      columns: columns.map((col) => col.name.trim()),
      projectRef,
      connectionString,
    })
    return aiPolicies.map((p) => ({ ...p, command: undefined }))
  } catch (error) {
    console.error('AI policy generation failed:', error)
    return []
  }
}

/**
 * Generates RLS policies for a table.
 * First tries programmatic generation based on FK relationships to auth.users.
 * Falls back to AI generation if no path exists.
 */
export const generateStartingPoliciesForTable = async ({
  table,
  foreignKeyConstraints,
  columns,
  projectRef,
  connectionString,
}: {
  table: { name: string; schema: string }
  foreignKeyConstraints: ForeignKeyConstraint[]
  columns: { name: string }[]
  projectRef: string
  connectionString?: string | null
}): Promise<GeneratedPolicy[]> => {
  // Try programmatic generation first
  const programmaticPolicies = generateProgrammaticPoliciesForTable({
    table,
    foreignKeyConstraints,
  })

  if (programmaticPolicies.length > 0) {
    return programmaticPolicies
  }

  // Fall back to AI generation
  return await generateAiPoliciesForTable({
    table,
    columns,
    projectRef,
    connectionString,
  })
}

/** Creates policies in the database. Returns successfully created policies. */
export const createGeneratedPolicies = async ({
  policies,
  projectRef,
  connectionString,
}: {
  policies: GeneratedPolicy[]
  projectRef: string
  connectionString?: string | null
}): Promise<GeneratedPolicy[]> => {
  if (policies.length === 0) {
    return []
  }

  // Combine all policy SQL statements into a single transaction
  const combinedSql = ['BEGIN;', ...policies.map((policy) => policy.sql), 'COMMIT;'].join('\n\n')

  try {
    await executeSql({ projectRef, connectionString, sql: combinedSql })
    // If successful, return all policies
    return policies
  } catch (error) {
    console.error('Failed to create policies:', error)
    // If batch creation fails, return empty array (no policies were created)
    return []
  }
}

/**
 * Generates and creates RLS policies for a table.
 * Fetches project details, table columns, and FK constraints directly from the database.
 */
export const generateAndCreatePoliciesForTable = async ({
  projectRef,
  schema,
  tableName,
}: {
  projectRef: string
  schema: string
  tableName: string
}): Promise<void> => {
  const toastId = toast.loading('Generating policies...')

  try {
    // Fetch project details to get connection string
    const project = await getProjectDetail({ ref: projectRef })
    const connectionString = project.connectionString

    if (!connectionString) {
      toast.error('Connection string not available', { id: toastId })
      return
    }

    // Fetch table data and FK constraints in parallel
    const [tables, foreignKeyConstraints] = await Promise.all([
      getTables({
        projectRef,
        connectionString,
        schema,
        includeColumns: true,
      }),
      getForeignKeyConstraints({
        projectRef,
        connectionString,
        schema,
      }),
    ])

    // Find the specific table to get its columns
    const tableData = tables.find((t) => t.schema === schema && t.name === tableName)
    const tableColumns =
      tableData && 'columns' in tableData && Array.isArray(tableData.columns)
        ? (tableData.columns as { name: string }[])
        : undefined

    if (!tableData || !tableColumns) {
      toast.error(`Table ${tableName} not found or has no columns`, { id: toastId })
      return
    }

    const columns = tableColumns.map((col) => ({ name: col.name }))

    // Generate policies
    const generatedPolicies = await generateStartingPoliciesForTable({
      table: { name: tableName, schema },
      foreignKeyConstraints: foreignKeyConstraints ?? [],
      columns,
      projectRef,
      connectionString,
    })

    if (generatedPolicies.length === 0) {
      toast.dismiss(toastId)
      return
    }

    // Create policies in the database
    toast.loading('Creating policies...', { id: toastId })
    const policiesCreated = await createGeneratedPolicies({
      policies: generatedPolicies,
      projectRef,
      connectionString,
    })

    // Invalidate queries so UI updates
    const queryClient = getQueryClient()
    await queryClient.invalidateQueries({
      queryKey: databasePoliciesKeys.list(projectRef),
    })

    // Show success toast with policy list
    if (policiesCreated.length > 0) {
      toast.success(
        <div className="flex flex-col gap-2">
          <p>
            {policiesCreated.length} {policiesCreated.length === 1 ? 'policy' : 'policies'}{' '}
            {policiesCreated.length === 1 ? 'has' : 'have'} been created for table {tableName}
          </p>
          <PolicyList policies={policiesCreated} className="border-l-0 border-r-0 rounded-none" />
          <Button type="default" asChild>
            <Link
              href={`/project/${projectRef}/auth/policies?search=${tableName}&schema=${schema}`}
            >
              Manage policies
            </Link>
          </Button>
        </div>,
        { id: toastId, duration: 20000 }
      )
    } else {
      toast.error(
        <div className="flex flex-col gap-1">
          <p>No policies were generated</p>
          <Link
            href={`/project/${projectRef}/auth/policies?search=${tableName}&schema=${schema}`}
            className="text-foreground underline"
          >
            Manage policies
          </Link>
        </div>,
        { id: toastId }
      )
    }
  } catch (error: any) {
    toast.error(
      `Failed to generate policies for table ${tableName}: ${error.message ?? 'Unknown error'}`,
      { id: toastId }
    )
    throw error
  }
}
