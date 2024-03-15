import type { PostgresPolicy } from '@supabase/postgres-meta'
import { Message } from 'ai/react'
import { uuidv4 } from 'lib/helpers'

export type MessageWithDebug = Message & { isDebug: boolean }

export const generateThreadMessage = ({
  id,
  content,
  isDebug,
}: {
  id?: string
  content: string
  isDebug: boolean
}) => {
  const message: MessageWithDebug = {
    id: id ?? uuidv4(),
    role: 'assistant',
    content,
    createdAt: new Date(),
    isDebug: isDebug,
  }
  return message
}

export const generatePlaceholder = (policy?: PostgresPolicy) => {
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

export const generatePolicyDefinition = (policy: PostgresPolicy) => {
  return `
CREATE POLICY "${policy.name}" on "${policy.schema}"."${policy.table}"
AS ${policy.action} FOR ${policy.command}
TO ${policy.roles.join(', ')}
${policy.definition ? `USING (${policy.definition})` : ''}
${policy.check ? `WITH CHECK (${policy.check})` : ''}
;
`.trim()
}

export const generateQuery = ({
  name,
  schema,
  table,
  behaviour,
  command,
  roles,
  using,
  check,
}: {
  name: string
  schema: string
  table: string
  behaviour: string
  command: string
  roles: string
  using?: string
  check?: string
}) => {
  const querySkeleton = `create policy "${name}" on "${schema}"."${table}" as ${behaviour} for ${command} to ${roles}`
  const query =
    command === 'insert'
      ? `${querySkeleton} with check (${check});`
      : `${querySkeleton} using (${using})${(check ?? '').length > 0 ? `with check (${check});` : ';'}`
  return query
}
