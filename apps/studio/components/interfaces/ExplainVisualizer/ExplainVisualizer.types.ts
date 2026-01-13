export interface ExplainNode {
  operation: string
  details: string
  cost?: { start: number; end: number }
  rows?: number
  width?: number
  actualTime?: { start: number; end: number }
  actualRows?: number
  level: number
  children: ExplainNode[]
  raw: string
  // Parsed detail fields
  rowsRemovedByFilter?: number
}

export interface QueryPlanRow {
  'QUERY PLAN': string
}
