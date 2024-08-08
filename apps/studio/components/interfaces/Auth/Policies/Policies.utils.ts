import type { PostgresPolicy } from '@supabase/postgres-meta'
import { has, isEmpty, isEqual } from 'lodash'
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
