export type RawPlan = Readonly<{
  // Basic Plan Node Properties
  ['Node Type']?: string
  ['Parallel Aware']?: boolean
  ['Async Capable']?: boolean
  ['Relation Name']?: string
  Alias?: string
  ['Join Type']?: string
  // Cost Estimates
  ['Startup Cost']?: number
  ['Total Cost']?: number
  ['Plan Rows']?: number
  ['Plan Width']?: number
  // Conditions and Filters
  Filter?: string
  ['Hash Cond']?: string
  ['Index Cond']?: string
  ['Recheck Cond']?: string
  ['Merge Cond']?: string
  ['Join Filter']?: string
  // Keys
  ['Group Key']?: string[] | string
  ['Sort Key']?: string[] | string
  ['Presorted Key']?: string[] | string
  // Plan Structure / Hierarchy
  ['Parent Relationship']?: string
  ['Scan Direction']?: string
  ['Index Name']?: string
  ['Order By']?: string
  Plans?: RawPlan[]
  // ANALYZE (actuals)
  ['Actual Startup Time']?: number
  ['Actual Total Time']?: number
  ['Actual Rows']?: number
  ['Actual Loops']?: number
  ['Rows Removed by Filter']?: number
  ['Rows Removed by Join Filter']?: number
  ['Rows Removed by Index Recheck']?: number
  ['Heap Fetches']?: number
  Output?: string[]
  // BUFFERS
  ['Shared Hit Blocks']?: number
  ['Shared Read Blocks']?: number
  ['Shared Dirtied Blocks']?: number
  ['Shared Written Blocks']?: number
  ['Local Hit Blocks']?: number
  ['Local Read Blocks']?: number
  ['Local Dirtied Blocks']?: number
  ['Local Written Blocks']?: number
  ['Temp Read Blocks']?: number
  ['Temp Written Blocks']?: number
  ['I/O Read Time']?: number
  ['I/O Write Time']?: number
  // Misc node-specific extras (optional but useful)
  ['Sort Method']?: string
  ['Sort Space Used']?: number
  ['Sort Space Type']?: string
  // Parallel workers
  ['Workers Planned']?: number
  ['Workers Launched']?: number
  // Subplan/CTE names
  ['Subplan Name']?: string
  ['CTE Name']?: string
}>

export type PlanRoot = Readonly<{
  Plan: RawPlan
  ['Planning Time']?: number
  ['Execution Time']?: number
  JIT?: {
    Timing?: {
      Total?: number
    }
  }
}>

export type ExplainPlanRow = Readonly<{
  'QUERY PLAN': PlanRoot[]
}>

export type PlanMeta = Readonly<{
  planningTime?: number
  executionTime?: number
  jitTotalTime?: number
  subplanRoots?: { name: string; id: string }[]
  errorMessage?: string
  errorDetail?: string
}>

export type PlanNodeData = {
  label: string
  joinType?: string
  startupCost?: number
  totalCost?: number
  planRows?: number
  planWidth?: number
  relationName?: string
  alias?: string
  filter?: string
  hashCond?: string
  indexCond?: string
  recheckCond?: string
  mergeCond?: string
  joinFilter?: string
  // Keys
  groupKey?: string[]
  sortKey?: string[]
  presortedKey?: string[]
  parallelAware?: boolean
  asyncCapable?: boolean
  parentRelationship?: string
  scanDirection?: string
  indexName?: string
  orderBy?: string
  // ANALYZE actuals
  actualStartupTime?: number
  actualTotalTime?: number
  actualRows?: number
  actualLoops?: number
  // Estimation
  estFactor?: number
  estDirection?: 'over' | 'under' | 'none'
  estActualTotalRows?: number
  rowsRemovedByFilter?: number
  rowsRemovedByJoinFilter?: number
  rowsRemovedByIndexRecheck?: number
  heapFetches?: number
  outputCols?: string[]
  // BUFFERS
  sharedHit?: number
  sharedRead?: number
  sharedDirtied?: number
  sharedWritten?: number
  localHit?: number
  localRead?: number
  localDirtied?: number
  localWritten?: number
  tempRead?: number
  tempWritten?: number
  ioReadTime?: number
  ioWriteTime?: number
  // Workers
  workersPlanned?: number
  workersLaunched?: number
  // Exclusive (derived)
  exclusiveTimeMs?: number
  exclusiveCost?: number
  exSharedHit?: number
  exSharedRead?: number
  exSharedDirtied?: number
  exSharedWritten?: number
  exLocalHit?: number
  exLocalRead?: number
  exLocalDirtied?: number
  exLocalWritten?: number
  exTempRead?: number
  exTempWritten?: number
  // Misc
  sortMethod?: string
  sortSpaceUsed?: number
  sortSpaceType?: string
  // Performance hints
  slowHint?: {
    severity: 'warn' | 'alert'
    selfTimeMs: number
    selfTimeShare: number
  }
  costHint?: {
    severity: 'warn' | 'alert'
    selfCost: number
    selfCostShare?: number
  }
  // Raw JSON for detail panel
  raw?: RawPlan
  // Subplan/CTE context
  subplanName?: string
  cteName?: string
  subplanOf?: string
  // Execution flags
  neverExecuted?: boolean
}

export type Agg = {
  timeIncl: number
  costIncl: number
  sharedHit: number
  sharedRead: number
  sharedDirtied: number
  sharedWritten: number
  localHit: number
  localRead: number
  localDirtied: number
  localWritten: number
  tempRead: number
  tempWritten: number
}
