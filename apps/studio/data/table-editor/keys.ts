export const tableEditorKeys = {
  tableEditor: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'table-editor', id].filter(Boolean),
  entityId: (projectRef: string | undefined, schema?: string, name?: string) =>
    ['projects', projectRef, 'table-editor', 'entity-id', schema, name] as const,
}
