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

export interface SelectorErrors {
  columns?: string
  types?: SelectorTypeError[]
  typeNotice?: SelectorTypeError[]
}

export interface SelectorTypeError {
  source: string
  sourceType: string
  target: string
  targetType: string
}
