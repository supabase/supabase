export type TableNodeData = {
  id: number
  schema: string
  name: string
  ref?: string
  isForeign: boolean
  description: string
  columns: {
    id: string
    isPrimary: boolean
    isNullable: boolean
    isUnique: boolean
    isIdentity: boolean
    name: string
    format: string
  }[]
}

export type EdgeData = {
  sourceName: string
  sourceSchemaName: string
  sourceColumnName: string
  targetName: string
  targetSchemaName: string
  targetColumnName: string
}
