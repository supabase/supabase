export function shouldLeaveOpenTableForSchema({
  entityId,
  nextSchema,
  currentSchema,
}: {
  entityId: number | undefined
  nextSchema: string
  currentSchema: string | undefined
}): boolean {
  const isViewingEntity = entityId !== undefined && Number.isInteger(entityId)
  const isSchemaChange = nextSchema !== currentSchema
  return isViewingEntity && isSchemaChange
}

export function buildTableEditorSchemaListPath({
  projectRef,
  schema,
  sidebar,
}: {
  projectRef: string
  schema: string
  sidebar?: string
}): string {
  const params = new URLSearchParams()
  params.set('schema', schema)

  if (sidebar) {
    params.set('sidebar', sidebar)
  }

  return `/project/${projectRef}/editor?${params.toString()}`
}
