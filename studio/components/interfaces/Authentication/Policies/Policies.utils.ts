import { has, isEmpty, isEqual } from 'lodash'

/**
 * Returns an array of SQL statements that will preview in the review step of the policy editor
 * @param {*} policyFormFields { name, using, check, command }
 */

export const createSQLPolicy = (policyFormFields: any, originalPolicyFormFields: any = {}) => {
  const { definition, check } = policyFormFields
  const formattedPolicyFormFields = {
    ...policyFormFields,
    definition: definition ? definition.replace(/\s+/g, ' ').trim() : definition,
    check: check ? check.replace(/\s+/g, ' ').trim() : check,
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

  if (!isEmpty(fieldsToUpdate)) {
    return createSQLStatementForUpdatePolicy(formattedPolicyFormFields, fieldsToUpdate)
  }

  return { description: 'hello', statement: 'hello' }
}

export const createSQLStatementForCreatePolicy = (policyFormFields: any) => {
  const { name, definition, check, command, schema, table } = policyFormFields
  const description = `Add policy for the ${command} operation under the policy "${name}"`
  const statement =
    `
    CREATE POLICY "${name}" ON ${schema}.${table} FOR ${command}
    ${definition ? `USING (${definition})` : ''}
    ${check ? `WITH CHECK (${check})` : ''}
  `
      .replace(/\s+/g, ' ')
      .trim() + ';'
  return { description, statement }
}

export const createSQLStatementForUpdatePolicy = (
  policyFormFields: any = {},
  fieldsToUpdate: any = {}
) => {
  const { name, schema, table } = policyFormFields

  const definitionChanged = has(fieldsToUpdate, ['definition'])
  const checkChanged = has(fieldsToUpdate, ['check'])
  const nameChanged = has(fieldsToUpdate, ['name'])

  let description = `
    ${
      definitionChanged || checkChanged
        ? `Update policy's ${definitionChanged ? 'USING expression' : ''} ${
            definitionChanged && checkChanged ? ' and' : ''
          } ${checkChanged ? ' WITH CHECK expression.' : ''}`
        : ''
    }
    ${nameChanged ? `Rename policy to ${fieldsToUpdate.name}.` : ''}
  `
  // Need to figure out a way to derive description: name, definition and check can change

  const definitionOrCheckUpdateStatement =
    definitionChanged || checkChanged
      ? `
          ALTER POLICY "${name}" ON ${schema}.${table} ${
          definitionChanged ? `USING (${fieldsToUpdate.definition})` : ''
        } ${checkChanged ? `WITH CHECK (${fieldsToUpdate.check})` : ''};
        `
          .replace(/\s+/g, ' ')
          .trim()
      : ''

  const renameStatement = nameChanged
    ? `ALTER POLICY "${name}" ON ${schema}.${table} RENAME TO "${fieldsToUpdate.name}";`
    : ''

  const statement = definitionOrCheckUpdateStatement + renameStatement

  return { description, statement }
}

export const createPayloadForCreatePolicy = (policyFormFields: any = {}) => {
  const { definition, check } = policyFormFields
  return {
    ...policyFormFields,
    action: 'PERMISSIVE',
    definition: definition || undefined,
    check: check || undefined,
  }
}

export const createPayloadForUpdatePolicy = (
  policyFormFields: any = {},
  originalPolicyFormFields: any = {}
) => {
  const { definition, check } = policyFormFields
  const formattedPolicyFormFields = {
    ...policyFormFields,
    definition: definition ? definition.replace(/\s+/g, ' ').trim() : definition,
    check: check ? check.replace(/\s+/g, ' ').trim() : check,
  }

  const payload: any = { id: originalPolicyFormFields.id }

  if (!isEqual(formattedPolicyFormFields.name, originalPolicyFormFields.name)) {
    payload.name = formattedPolicyFormFields.name
  }
  if (!isEqual(formattedPolicyFormFields.definition, originalPolicyFormFields.definition)) {
    payload.definition = formattedPolicyFormFields.definition || undefined
  }
  if (!isEqual(formattedPolicyFormFields.check, originalPolicyFormFields.check)) {
    payload.check = formattedPolicyFormFields.check || undefined
  }

  return payload
}
