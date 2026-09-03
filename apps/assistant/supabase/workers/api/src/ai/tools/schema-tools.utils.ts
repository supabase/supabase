const SCHEMA_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/

export function validSchemaNames(schemas: string[] | undefined): string[] {
  return (schemas ?? []).filter((schema) => SCHEMA_NAME.test(schema))
}

export function asQueryRows(output: unknown): Record<string, unknown>[] {
  const rows = Array.isArray(output)
    ? output
    : output &&
        typeof output === 'object' &&
        'result' in output &&
        Array.isArray((output as { result: unknown }).result)
      ? (output as { result: unknown[] }).result
      : []

  return rows.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
}
