import { PostgresPolicy } from '@supabase/postgres-meta'
import { uuidv4 } from 'lib/helpers'
import { ThreadMessage } from 'openai/resources/beta/threads/messages/messages'

export const generateThreadMessage = ({
  id,
  threadId,
  runId,
  content,
  metadata = {},
}: {
  id?: string
  threadId?: string
  runId?: string
  content: string
  metadata?: any
}) => {
  const message: ThreadMessage = {
    id: id ?? uuidv4(),
    object: 'thread.message',
    role: 'assistant',
    file_ids: [],
    metadata,
    content: [
      {
        type: 'text',
        text: { value: content, annotations: [] },
      },
    ],
    created_at: Math.floor(Number(new Date()) / 1000),
    assistant_id: null,
    thread_id: threadId ?? '',
    run_id: runId ?? '',
  }
  return message
}

export const generatePlaceholder = (policy?: PostgresPolicy) => {
  if (policy === undefined) {
    return `
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
