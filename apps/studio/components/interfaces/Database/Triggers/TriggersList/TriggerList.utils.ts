interface PostgresTrigger {
  activation: string
  condition: string | null
  enabled_mode: string
  events: string[]
  function_args: string[]
  function_name: string
  function_schema: string
  id: number
  name: string
  orientation: string
  schema: string
  table: string
  table_id: number
}

export const generateTriggerCreateSQL = (trigger: PostgresTrigger) => {
  const events = trigger.events.join(' OR ')
  const args = trigger.function_args.length > 0 ? `(${trigger.function_args.join(', ')})` : '()'

  let sql = `
CREATE TRIGGER "${trigger.name}"
${trigger.activation} ${events}
ON "${trigger.schema}"."${trigger.table}"
FOR EACH ${trigger.orientation}
`

  if (trigger.condition) {
    sql += `WHEN (${trigger.condition})\n`
  }

  sql += `EXECUTE FUNCTION "${trigger.function_schema}"."${trigger.function_name}"${args};`

  return sql.trim()
}
