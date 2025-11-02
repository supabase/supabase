import { PostgresPolicy } from '@supabase/postgres-meta'

export const generatePolicyUpdateSQL = (policy: PostgresPolicy) => {
  let expression = ''
  if (policy.definition !== null && policy.definition !== undefined) {
    expression += `using (${policy.definition})${
      policy.check === null || policy.check === undefined ? ';' : ''
    }\n`
  }
  if (policy.check !== null && policy.check !== undefined) {
    expression += `with check (${policy.check});\n`
  }

  return `
alter policy "${policy.name}" 
on "${policy.schema}"."${policy.table}"
to ${policy.roles.join(', ')}
${expression}
`.trim()
}
