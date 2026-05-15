import {
  acceptUntrustedSql,
  ident,
  safeSql,
  untrustedSql,
  type DisplayableSqlFragment,
  type SafeSqlFragment,
} from '@supabase/pg-meta'
import type { PGPolicy } from '@supabase/pg-meta'
import { has, isEmpty, isEqual } from 'lodash'

import {
  DraftPostgresPolicyCreatePayload,
  DraftPostgresPolicyUpdatePayload,
  PolicyFormField,
  PolicyForReview,
} from './Policies.types'
import { generateSqlPolicy } from '@/data/ai/sql-policy-mutation'
import type { CreatePolicyBody } from '@/data/database-policies/database-policy-create-mutation'
import type { ForeignKeyConstraint } from '@/data/database/foreign-key-constraints-query'

/**
 * Returns an array of SQL statements that will preview in the review step of the policy editor
 * @param {*} policyFormFields { name, using, check, command }
 */

export const createSQLPolicy = (
  policyFormFields: PolicyFormField,
  originalPolicyFormFields?: PGPolicy
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

  if (!originalPolicyFormFields || isEmpty(originalPolicyFormFields)) {
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

const createSQLStatementForUpdatePolicy = (
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

// These constructors return DRAFT payloads — `definition`/`check` are still
// `DisplayableSqlFragment`. Promotion to `SafeSqlFragment` must happen at the user gesture
// (the Save click in `PolicyEditorModal`), not here, since this module has no guarantee that
// it was reached via a deliberate user action.
export const createPayloadForCreatePolicy = (
  policyFormFields: PolicyFormField
): DraftPostgresPolicyCreatePayload => {
  const { name, schema, table, command, definition, check, roles } = policyFormFields
  return {
    name,
    schema,
    table,
    action: 'PERMISSIVE',
    command: command || undefined,
    definition: !definition ? undefined : untrustedSql(definition),
    check: !check ? undefined : untrustedSql(check),
    roles: roles.length > 0 ? roles : undefined,
  }
}

export const createPayloadForUpdatePolicy = (
  policyFormFields: PolicyFormField,
  originalPolicyFormFields: PGPolicy
): DraftPostgresPolicyUpdatePayload => {
  const { definition, check } = policyFormFields
  const formattedDefinition = definition ? definition.replace(/\s+/g, ' ').trim() : definition
  const formattedCheck = check ? check.replace(/\s+/g, ' ').trim() : check

  const payload: DraftPostgresPolicyUpdatePayload = { id: originalPolicyFormFields.id }

  if (!isEqual(policyFormFields.name, originalPolicyFormFields.name)) {
    payload.name = policyFormFields.name
  }
  if (!isEqual(formattedDefinition, originalPolicyFormFields.definition)) {
    payload.definition = !formattedDefinition ? undefined : untrustedSql(formattedDefinition)
  }
  if (!isEqual(formattedCheck, originalPolicyFormFields.check)) {
    payload.check = !formattedCheck ? undefined : untrustedSql(formattedCheck)
  }
  if (!isEqual(policyFormFields.roles, originalPolicyFormFields.roles)) {
    if (policyFormFields.roles.length === 0) payload.roles = ['public']
    else payload.roles = policyFormFields.roles || undefined
  }

  return payload
}

// --- Policy Generation ---

/**
 * A policy generated for display/staging in the table editor.
 * `definition`/`check` are `DisplayableSqlFragment` because generators have different provenance:
 * programmatic generation produces `SafeSqlFragment` (composed via `safeSql`), AI generation
 * produces `UntrustedSqlFragment` (third-party output). Consumers must promote via
 * `acceptUntrustedSql` at a user gesture before executing.
 */
export type GeneratedPolicy = Required<
  Pick<CreatePolicyBody, 'name' | 'table' | 'schema' | 'action' | 'roles'>
> &
  Pick<CreatePolicyBody, 'command'> & {
    definition?: DisplayableSqlFragment
    check?: DisplayableSqlFragment
    sql: string
  }

/**
 * A {@link GeneratedPolicy} whose `definition`/`check` have already been promoted to
 * `SafeSqlFragment`. Producing one of these is the contract that says: the user gesture
 * required to execute this SQL has already happened.
 */
export type AcceptedGeneratedPolicy = Omit<GeneratedPolicy, 'definition' | 'check'> & {
  definition?: SafeSqlFragment
  check?: SafeSqlFragment
}

/**
 * Promotes a {@link GeneratedPolicy} to an {@link AcceptedGeneratedPolicy}.
 * ONLY call from an event handler tied to a deliberate user action (e.g. the Save click
 * on the table editor). Never call from useEffect, render, or any path that runs without
 * a user gesture.
 */
export const acceptGeneratedPolicy = (policy: GeneratedPolicy): AcceptedGeneratedPolicy => ({
  ...policy,
  definition: policy.definition === undefined ? undefined : acceptUntrustedSql(policy.definition),
  check: policy.check === undefined ? undefined : acceptUntrustedSql(policy.check),
})

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
const getRelationshipsForTable = ({
  schema,
  table,
  fkConstraints,
}: {
  schema: string
  table: string
  fkConstraints: ForeignKeyConstraint[]
}): Relationship[] => {
  return fkConstraints
    .filter((fk) => fk.source_schema === schema && fk.source_table === table)
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
  const startRelationships = getRelationshipsForTable({
    schema: startTable.schema,
    table: startTable.name,
    fkConstraints: allForeignKeyConstraints,
  })

  const queue: { table: { schema: string; name: string }; path: Relationship[] }[] = [
    { table: startTable, path: [] },
  ]
  const visited = new Set<string>()
  visited.add(`${startTable.schema}.${startTable.name}`)

  while (queue.length > 0) {
    const queueItem = queue.shift()
    if (!queueItem) continue

    const { table, path } = queueItem
    if (path.length >= maxDepth) continue

    const relationships =
      path.length === 0
        ? startRelationships
        : getRelationshipsForTable({
            schema: table.schema,
            table: table.name,
            fkConstraints: allForeignKeyConstraints,
          })

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
      if (visited.has(targetId)) continue

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
const buildPolicyExpression = (path: Relationship[]): SafeSqlFragment => {
  if (path.length === 0) return safeSql``

  // Direct FK to auth.users
  if (path.length === 1) {
    return safeSql`(select auth.uid()) = ${ident(path[0].source_column_name)}`
  }

  // Indirect path - build EXISTS with JOINs
  const [first, ...rest] = path
  const firstTarget = safeSql`${ident(first.target_table_schema)}.${ident(first.target_table_name)}`
  const source = safeSql`${ident(first.source_schema)}.${ident(first.source_table_name)}`
  const last = path[path.length - 1]

  const joins = rest.slice(0, -1).reduce<SafeSqlFragment>(
    (acc, r) => {
      const targetSchema = ident(r.target_table_schema)
      const targetTable = ident(r.target_table_name)
      const targetColumn = ident(r.target_column_name)

      const sourceSchema = ident(r.source_schema)
      const sourceTable = ident(r.source_table_name)
      const sourceColumn = ident(r.source_column_name)
      const join = safeSql`join ${targetSchema}.${targetTable} on ${targetSchema}.${targetTable}.${targetColumn} = ${sourceSchema}.${sourceTable}.${sourceColumn}`
      return acc.length === 0 ? join : safeSql`${acc}\n  ${join}`
    },
    safeSql``
  )

  return safeSql`exists (
  select 1 from ${firstTarget}
  ${joins}
  where ${firstTarget}.${ident(first.target_column_name)} = ${source}.${ident(first.source_column_name)}
  and ${ident(last.source_schema)}.${ident(last.source_table_name)}.${ident(last.source_column_name)} = (select auth.uid())
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
    const name = `Enable ${command.toLowerCase()} access for users based on ${ident(targetCol)}`
    const base = `CREATE POLICY "${name}" ON ${ident(table.schema)}.${ident(table.name)} AS PERMISSIVE FOR ${command} TO authenticated`

    const sql =
      command === 'INSERT'
        ? `${base} WITH CHECK (${expression});`
        : command === 'UPDATE'
          ? `${base} USING (${expression}) WITH CHECK (${expression});`
          : `${base} USING (${expression});`

    // Structured data for mutation API
    const definition = command === 'INSERT' ? undefined : expression
    const check = command === 'SELECT' || command === 'DELETE' ? undefined : expression

    return {
      name,
      sql,
      command,
      table: table.name,
      schema: table.schema,
      definition,
      check,
      action: 'PERMISSIVE' as const,
      roles: ['authenticated'],
    }
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
    // Silently fail - caller will handle empty result
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
  if (!connectionString) return []

  try {
    return await generateSqlPolicy({
      tableName: table.name,
      schema: table.schema,
      columns: columns.map((col) => col.name.trim()),
      projectRef,
      connectionString: connectionString ?? '',
    })
  } catch (error) {
    console.log('AI policy generation failed:', error)
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
  enableAi,
}: {
  table: { name: string; schema: string }
  foreignKeyConstraints: ForeignKeyConstraint[]
  columns: { name: string }[]
  projectRef: string
  connectionString?: string | null
  enableAi: boolean
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
  if (enableAi) {
    return await generateAiPoliciesForTable({
      table,
      columns,
      projectRef,
      connectionString,
    })
  }

  return []
}
