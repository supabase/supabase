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
  tableRowsCount: (projectRef?: string, { table, ...args }: any = {}) =>
    ['projects', projectRef, 'table-rows', table?.id, 'count', args] as const,
  tableRowsAndCount: (projectRef?: string, tableId?: number) =>
    ['projects', projectRef, 'table-rows', tableId] as const,
}
