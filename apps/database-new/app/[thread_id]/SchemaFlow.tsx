import SchemaFlowHandler from './SchemaFlowHandler'

interface SchemaFlowProps {
  code: string
}
export async function SchemaFlow({ code }: SchemaFlowProps) {
  const strippedCode = code.replace('```sql\n', '').replace('\n```', '')

  return <SchemaFlowHandler content={strippedCode} />
}
