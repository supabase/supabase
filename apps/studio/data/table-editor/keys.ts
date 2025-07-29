export const tableEditorKeys = {
  tableEditor: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'table-editor', id].filter(Boolean),
}
