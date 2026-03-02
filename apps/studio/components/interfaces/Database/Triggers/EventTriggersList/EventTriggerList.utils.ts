import type { DatabaseEventTrigger } from 'data/database-event-triggers/database-event-triggers-query'

const ensureSemicolon = (statement: string) => {
  const trimmed = statement.trim()
  return trimmed.endsWith(';') ? trimmed : `${trimmed};`
}

const escapeLiteral = (value: string) => value.replace(/'/g, "''")
const escapeIdentifier = (value: string) => value.replace(/"/g, '""')

export const generateEventTriggerCreateSQL = (trigger: DatabaseEventTrigger) => {
  const statements: string[] = []

  if (trigger.function_definition) {
    statements.push(ensureSemicolon(trigger.function_definition))
  }

  if (trigger.event && trigger.function_schema && trigger.function_name) {
    statements.push(`DROP EVENT TRIGGER IF EXISTS "${escapeIdentifier(trigger.name)}";`)
    statements.push(
      [
        `CREATE EVENT TRIGGER "${escapeIdentifier(trigger.name)}"`,
        `ON ${trigger.event}`,
        trigger.tags && trigger.tags.length > 0
          ? `WHEN TAG IN (${trigger.tags.map((tag) => `'${escapeLiteral(tag)}'`).join(', ')})`
          : null,
        `EXECUTE FUNCTION "${escapeIdentifier(trigger.function_schema)}"."${escapeIdentifier(
          trigger.function_name
        )}"();`,
      ]
        .filter(Boolean)
        .join('\n')
    )
  }

  return statements.filter(Boolean).join('\n\n').trim()
}
