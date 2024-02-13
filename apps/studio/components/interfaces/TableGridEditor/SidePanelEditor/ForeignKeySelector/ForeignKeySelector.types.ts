export interface ForeignKey {
  id?: number | string
  name?: string
  tableId?: number

  schema: string
  table: string
  columns: { source: string; sourceType?: string; target: string; targetType?: string }[]
  deletionAction: string
  updateAction: string
  toRemove?: boolean
}
