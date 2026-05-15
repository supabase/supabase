import type { PGPolicy } from '@supabase/pg-meta'
import { ident, keyword, safeSql, type SafeSqlFragment } from '@supabase/pg-meta/src/pg-format'
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
