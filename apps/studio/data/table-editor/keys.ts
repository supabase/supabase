export const tableEditorKeys = {
  tableEditor: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'table-editor', id] as const,
}
