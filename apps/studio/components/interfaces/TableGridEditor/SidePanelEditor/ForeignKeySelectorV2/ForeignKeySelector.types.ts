export interface ForeignKey {
  id?: number | string
  name?: string
  tableId?: number

  schema: string
  table: string
  columns: { source: string; target: string }[]
  deletionAction: string
  updateAction: string
  toRemove?: boolean
}
