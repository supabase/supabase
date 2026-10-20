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
