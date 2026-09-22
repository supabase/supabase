import type { PGPolicy } from '@supabase/pg-meta'
import { untrustedSql } from '@supabase/pg-meta'
import { has, isEmpty, isEqual } from 'lodash'

import {
  DraftPostgresPolicyCreatePayload,
  DraftPostgresPolicyUpdatePayload,
  PolicyFormField,
  PolicyForReview,
} from './StoragePolicies.types'

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
