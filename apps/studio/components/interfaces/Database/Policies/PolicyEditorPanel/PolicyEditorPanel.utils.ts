import type { PGPolicy } from '@supabase/pg-meta'
import {
  ident,
  keyword,
  safeSql,
  untrustedSql,
  type SafeSqlFragment,
  type UntrustedSqlFragment,
} from '@supabase/pg-meta/src/pg-format'
import { isEqual } from 'lodash'

// [Joshen] Not used but keeping this for now in case we do an inline editor
export const generatePlaceholder = (policy?: PGPolicy) => {
  if (policy === undefined) {
    return `
-- Press tab to use this code\n
&nbsp;\n
CREATE POLICY *name* ON *table_name*\n
AS PERMISSIVE -- PERMISSIVE | RESTRICTIVE\n
FOR ALL -- ALL | SELECT | INSERT | UPDATE | DELETE\n
TO *role_name* -- Default: public\n
USING ( *using_expression* )\n
WITH CHECK ( *check_expression* );
`.trim()
  } else {
    let expression = ''
    if (policy.definition !== null && policy.definition !== undefined) {
      expression += `USING ( *${policy.definition}* )${
        policy.check === null || policy.check === undefined ? ';' : ''
      }\n`
    }
    if (policy.check !== null && policy.check !== undefined) {
      expression += `WITH CHECK ( *${policy.check}* );\n`
    }

    return `
-- Press tab to use this code\n
&nbsp;\n
BEGIN;\n
&nbsp;\n
-- To update your policy definition\n
ALTER POLICY "${policy.name}"\n
ON "${policy.schema}"."${policy.table}"\n
TO *${policy.roles.join(', ')}*\n
${expression}
&nbsp;\n
-- To rename your policy\n
ALTER POLICY "${policy.name}"\n
ON "${policy.schema}"."${policy.table}"\n
RENAME TO "*New Policy Name*";\n
&nbsp;\n
COMMIT;
`.trim()
  }
}

export const generateCreatePolicyQuery = ({
  name,
  schema,
  table,
  behavior,
  command,
  roles,
  using,
  check,
}: {
  name: string
  schema: string
  table: string
  behavior: string
  command: string
  roles: SafeSqlFragment
  using?: SafeSqlFragment
  check?: SafeSqlFragment
}): SafeSqlFragment => {
  const skeleton = safeSql`create policy ${ident(name)} on ${ident(schema)}.${ident(table)} as ${keyword(behavior)} for ${keyword(command)} to ${roles}`
  if (command === 'insert') {
    return safeSql`${skeleton} with check (${check ?? safeSql``});`
  }
  const withUsing = safeSql`${skeleton} using (${using ?? safeSql``})`
  if ((check ?? '').length > 0) {
    return safeSql`${withUsing} with check (${check ?? safeSql``});`
  }
  return safeSql`${withUsing};`
}

/**
 * Diffs the editor form against the stored policy and returns only the fields
 * that changed — an empty result means there is nothing to save. A stored
 * `null` definition/check (policy created without that clause) counts as
 * empty, so typing an expression into a previously empty editor is a change.
 * Empty form values never produce a payload field, because ALTER POLICY can
 * only replace an expression, not remove it.
 *
 * Expressions are returned as UntrustedSqlFragment — the caller promotes them
 * with acceptUntrustedSql in the submit handler.
 */
export const generateUpdatePolicyPayload = (
  selectedPolicy: Pick<PGPolicy, 'name' | 'roles' | 'command' | 'definition' | 'check'>,
  policyForm: {
    name: string
    roles: string[]
    using?: string
    check?: string
  }
): {
  name?: string
  roles?: string[]
  definition?: UntrustedSqlFragment
  check?: UntrustedSqlFragment
} => {
  const payload: {
    name?: string
    roles?: string[]
    definition?: UntrustedSqlFragment
    check?: UntrustedSqlFragment
  } = {}
  const usingVal = policyForm.using?.trim()
  const checkVal = policyForm.check?.trim()

  if (policyForm.name !== selectedPolicy.name) payload.name = policyForm.name
  if (!isEqual(selectedPolicy.roles, policyForm.roles)) payload.roles = policyForm.roles

  if (selectedPolicy.command === 'INSERT') {
    // For INSERT policies editor one holds the with check expression
    if (!!usingVal && usingVal !== selectedPolicy.check) payload.check = untrustedSql(usingVal)
  } else {
    if (!!usingVal && usingVal !== selectedPolicy.definition)
      payload.definition = untrustedSql(usingVal)
    if (!!checkVal && checkVal !== selectedPolicy.check) payload.check = untrustedSql(checkVal)
  }

  return payload
}

export const checkIfPolicyHasChanged = (
  selectedPolicy: PGPolicy,
  policyForm: {
    name: string
    roles: string[]
    check: string | null
    definition: string | null
  }
) => {
  if (selectedPolicy.command === 'INSERT' && selectedPolicy.check !== policyForm.check) {
    return true
  }
  if (
    selectedPolicy.command !== 'INSERT' &&
    (selectedPolicy.definition !== policyForm.definition ||
      selectedPolicy.check !== policyForm.check)
  ) {
    return true
  }
  if (selectedPolicy.name !== policyForm.name) {
    return true
  }
  if (!isEqual(selectedPolicy.roles, policyForm.roles)) {
    return true
  }
  return false
}
