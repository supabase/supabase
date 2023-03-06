export interface ForeignKey {
  schema: string
  table: string
  column?: string
  enableCascadeDelete: boolean
}
