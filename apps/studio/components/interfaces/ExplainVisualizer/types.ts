export interface ExplainNode {
  operation: string
  details: string
  cost: { start: number; end: number } | null
  rows: number | null
  width: number | null
  actualTime: { start: number; end: number } | null
  actualRows: number | null
  level: number
  children: ExplainNode[]
  raw: string
  // Parsed detail fields
  rowsRemovedByFilter?: number
  // Assigned during rendering
  _stepNumber?: number
}

export interface QueryPlanRow {
  'QUERY PLAN': string
}
