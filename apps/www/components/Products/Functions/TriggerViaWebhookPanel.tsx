import React from 'react'
import CodeWindow from '~/components/CodeWindow'

const code = `create trigger "my_webhook" after insert
on "public"."my_table" for each row
execute function "supabase_functions"."http_request"(
  'http://localhost:3000',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '1000'
);`

const TriggerViaWebhookPanel = () => (
  <CodeWindow
    className="[&_.synthax-highlighter]:md:!min-h-[300px]"
    code={code}
    lang="sql"
    showLineNumbers
  />
)

export default TriggerViaWebhookPanel
