import type { GetTableRowsArgs } from './table-rows-query'

type TableRowKeyArgs = Omit<GetTableRowsArgs, 'table'> & { table?: { id?: number } }

export const tableRowKeys = {
  tableRows: (projectRef?: string, { table, ...args }: TableRowKeyArgs = {}) =>
    ['projects', projectRef, 'table-rows', table?.id, 'rows', args] as const,
  tableRowsCount: (projectRef?: string, { table, ...args }: TableRowKeyArgs = {}) =>
    ['projects', projectRef, 'table-rows', table?.id, 'count', args] as const,
  tableRowsAndCount: (projectRef?: string, tableId?: number) =>
    ['projects', projectRef, 'table-rows', tableId] as const,
}
