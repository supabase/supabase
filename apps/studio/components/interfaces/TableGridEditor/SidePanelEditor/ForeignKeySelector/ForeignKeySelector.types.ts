export interface ForeignKey {
  schema: string
  table: string
  column?: string
  deletionAction: string
  updateAction: string
}
