export const tableRowKeys = {
  tableRows: (projectRef?: string, { table, roleImpersonationState, ...args }: any = {}) =>
    [
      'projects',
      projectRef,
      'table-rows',
      table?.id,
      'rows',
      { roleImpersonation: roleImpersonationState?.role, ...args },
    ] as const,
  rowLargeValues: (
    projectRef?: string,
    {
      table,
      columns,
      pkMatch,
      roleImpersonationState,
    }: {
      table?: { schema: string; name: string }
      columns?: string[]
      pkMatch?: object
      roleImpersonationState?: { role?: unknown }
    } = {}
  ) =>
    [
      'projects',
      projectRef,
      'table-rows',
      table?.schema,
      table?.name,
      'row-large-values',
      { columns, pkMatch, roleImpersonation: roleImpersonationState?.role },
    ] as const,
  tableRowsCount: (projectRef?: string, { table, ...args }: any = {}) =>
    ['projects', projectRef, 'table-rows', table?.id, 'count', args] as const,
  tableRowsAndCount: (projectRef?: string, tableId?: number) =>
    ['projects', projectRef, 'table-rows', tableId] as const,
}
