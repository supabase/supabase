export interface ForeignKey {
  id?: number | string
  schema: string
  table: string
  columns: { source: string; target: string }[]
  deletionAction: string
  updateAction: string
}
