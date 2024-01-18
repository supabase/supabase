import SchemaFlowHandler from '@/components/SchemaFlowHandler'

export async function SchemaFlow({ promisedMessage }: { promisedMessage: Promise<string> }) {
  const code = await promisedMessage
  const strippedCode = code.replace('```sql\n', '').replace('\n```', '')

  return <SchemaFlowHandler content={strippedCode} />
}
