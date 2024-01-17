import SchemaFlowHandler from './SchemaFlowHandler'
import { ThreadPageProps } from './[message_id]/page'
import { getMessage } from './getMessage'

export async function SchemaFlow({ params }: ThreadPageProps) {
  const { message_id } = params
  const code = await getMessage(message_id)
  const strippedCode = code.replace('```sql\n', '').replace('\n```', '')

  return <SchemaFlowHandler content={strippedCode} />
}
