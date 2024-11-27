import { PostgresPolicy } from '@supabase/postgres-meta'

export const generatePolicyCreateSQL = (policy: PostgresPolicy) => {
  let expression = ''
  if (policy.definition !== null && policy.definition !== undefined) {
    expression += `USING (${policy.definition})${
      policy.check === null || policy.check === undefined ? ';' : ''
    }\n`
  }
  if (policy.check !== null && policy.check !== undefined) {
    expression += `WITH CHECK (${policy.check});\n`
  }

  return `
CREATE POLICY "${policy.name}" 
ON "${policy.schema}"."${policy.table}"
AS ${policy.action}
FOR ${policy.command}
TO ${policy.roles.join(', ')}
${expression}
`.trim()
}
