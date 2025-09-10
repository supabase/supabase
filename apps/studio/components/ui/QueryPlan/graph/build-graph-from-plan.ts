import type { Edge, Node } from 'reactflow'
import { NODE_TYPE } from '../constants'
import type { RawPlan, PlanRoot, PlanNodeData, Agg } from '../types'
import { toArray } from '../utils/formats'

const zeroAgg = (): Agg => ({
  timeIncl: 0,
  costIncl: 0,
  sharedHit: 0,
  sharedRead: 0,
  sharedDirtied: 0,
  sharedWritten: 0,
  localHit: 0,
  localRead: 0,
  localDirtied: 0,
  localWritten: 0,
  tempRead: 0,
  tempWritten: 0,
})

export const buildGraphFromPlan = (
  planJson: PlanRoot[],
  opts?: { executionTime?: number }
): {
  nodes: Node<PlanNodeData>[]
  edges: Edge[]
  subplanRoots: { name: string; id: string }[]
} => {
  const nodes: Node<PlanNodeData>[] = []
  const edges: Edge[] = []
  const subplanRoots: { name: string; id: string }[] = []

  // Helper: Recursively add plan nodes, propagating subplan context.
  const addPlan = (
    plan: RawPlan,
    parentId?: string,
    index: number = 0,
    currentSubplanName?: string
  ): Agg => {
    const id = parentId ? `${parentId}-${index}` : 'root'
    const label = plan['Node Type'] ?? 'Node'
    // Compute current subplan context for this node and descendants
    const subName = plan['Subplan Name'] ?? currentSubplanName

    // If this node is a subplan root, record it
    if (plan['Subplan Name']) {
      subplanRoots.push({ name: plan['Subplan Name'], id })
    }

    // Recurse first to get children aggregates for exclusive computation
    const children: RawPlan[] = plan['Plans'] ?? []
    let childAgg: Agg = zeroAgg()
    children.forEach((child, i) => {
      const agg = addPlan(child, id, i, subName)
      // create edge to child now that we know ids
      const childId = `${id}-${i}`
      edges.push({ id: `${id}->${childId}`, source: id, target: childId, animated: true })
      // accumulate child inclusive totals
      childAgg.timeIncl += agg.timeIncl
      childAgg.costIncl += agg.costIncl
      childAgg.sharedHit += agg.sharedHit
      childAgg.sharedRead += agg.sharedRead
      childAgg.sharedDirtied += agg.sharedDirtied
      childAgg.sharedWritten += agg.sharedWritten
      childAgg.localHit += agg.localHit
      childAgg.localRead += agg.localRead
      childAgg.localDirtied += agg.localDirtied
      childAgg.localWritten += agg.localWritten
      childAgg.tempRead += agg.tempRead
      childAgg.tempWritten += agg.tempWritten
    })

    // Inclusive values for this node (per Postgres: times/costs are inclusive)
    const loops = plan['Actual Loops'] ?? 1
    const nodeTimeIncl = (plan['Actual Total Time'] ?? 0) * loops
    const nodeCostIncl = plan['Total Cost'] ?? 0

    // Estimation factor calculation
    const actualRowsPerLoop = plan['Actual Rows'] ?? 0
    const actualRowsTotal = actualRowsPerLoop * loops
    const planRowsEst = plan['Plan Rows'] ?? 0
    const estFactorRaw = planRowsEst > 0 ? actualRowsTotal / planRowsEst : undefined
    let estDirection: 'over' | 'under' | 'none' | undefined = undefined
    let estFactor = estFactorRaw
    if (typeof estFactorRaw === 'number') {
      if (estFactorRaw > 1) {
        estDirection = 'under'
      } else if (estFactorRaw < 1) {
        estDirection = 'over'
      } else {
        estDirection = 'none'
      }
    }

    const nodeSharedHit = plan['Shared Hit Blocks'] ?? 0
    const nodeSharedRead = plan['Shared Read Blocks'] ?? 0
    const nodeSharedDirtied = plan['Shared Dirtied Blocks'] ?? 0
    const nodeSharedWritten = plan['Shared Written Blocks'] ?? 0
    const nodeLocalHit = plan['Local Hit Blocks'] ?? 0
    const nodeLocalRead = plan['Local Read Blocks'] ?? 0
    const nodeLocalDirtied = plan['Local Dirtied Blocks'] ?? 0
    const nodeLocalWritten = plan['Local Written Blocks'] ?? 0
    const nodeTempRead = plan['Temp Read Blocks'] ?? 0
    const nodeTempWritten = plan['Temp Written Blocks'] ?? 0

    // Exclusive (self) = node inclusive - sum(children inclusive)
    const exclusiveTimeMs = Math.max(nodeTimeIncl - childAgg.timeIncl, 0)
    const exclusiveCost = Math.max(nodeCostIncl - childAgg.costIncl, 0)
    const exSharedHit = Math.max(nodeSharedHit - childAgg.sharedHit, 0)
    const exSharedRead = Math.max(nodeSharedRead - childAgg.sharedRead, 0)
    const exSharedDirtied = Math.max(nodeSharedDirtied - childAgg.sharedDirtied, 0)
    const exSharedWritten = Math.max(nodeSharedWritten - childAgg.sharedWritten, 0)
    const exLocalHit = Math.max(nodeLocalHit - childAgg.localHit, 0)
    const exLocalRead = Math.max(nodeLocalRead - childAgg.localRead, 0)
    const exLocalDirtied = Math.max(nodeLocalDirtied - childAgg.localDirtied, 0)
    const exLocalWritten = Math.max(nodeLocalWritten - childAgg.localWritten, 0)
    const exTempRead = Math.max(nodeTempRead - childAgg.tempRead, 0)
    const exTempWritten = Math.max(nodeTempWritten - childAgg.tempWritten, 0)

    const data: PlanNodeData = {
      label,
      joinType: plan['Join Type'],
      startupCost: plan['Startup Cost'],
      totalCost: plan['Total Cost'],
      planRows: plan['Plan Rows'],
      planWidth: plan['Plan Width'],
      relationName: plan['Relation Name'],
      alias: plan['Alias'] ?? plan.Alias,
      filter: plan['Filter'],
      hashCond: plan['Hash Cond'],
      indexCond: plan['Index Cond'],
      recheckCond: plan['Recheck Cond'],
      mergeCond: plan['Merge Cond'],
      joinFilter: plan['Join Filter'],
      // Keys
      groupKey: toArray(plan['Group Key']),
      sortKey: toArray(plan['Sort Key']),
      presortedKey: toArray(plan['Presorted Key']),
      parallelAware: plan['Parallel Aware'],
      asyncCapable: plan['Async Capable'],
      parentRelationship: plan['Parent Relationship'],
      scanDirection: plan['Scan Direction'],
      indexName: plan['Index Name'],
      orderBy: plan['Order By'],
      // ANALYZE
      actualStartupTime: plan['Actual Startup Time'],
      actualTotalTime: plan['Actual Total Time'],
      actualRows: plan['Actual Rows'],
      actualLoops: plan['Actual Loops'],
      estFactor: estFactor,
      estDirection: estDirection,
      estActualTotalRows: actualRowsTotal,
      rowsRemovedByFilter: plan['Rows Removed by Filter'],
      rowsRemovedByJoinFilter: plan['Rows Removed by Join Filter'],
      rowsRemovedByIndexRecheck: plan['Rows Removed by Index Recheck'],
      heapFetches: plan['Heap Fetches'],
      outputCols: plan['Output'],
      // BUFFERS (inclusive values kept as-is for reference if needed)
      sharedHit: nodeSharedHit,
      sharedRead: nodeSharedRead,
      sharedDirtied: nodeSharedDirtied,
      sharedWritten: nodeSharedWritten,
      localHit: nodeLocalHit,
      localRead: nodeLocalRead,
      localDirtied: nodeLocalDirtied,
      localWritten: nodeLocalWritten,
      tempRead: nodeTempRead,
      tempWritten: nodeTempWritten,
      ioReadTime: plan['I/O Read Time'],
      ioWriteTime: plan['I/O Write Time'],
      // Workers
      workersPlanned: plan['Workers Planned'],
      workersLaunched: plan['Workers Launched'],
      // Exclusive (derived)
      exclusiveTimeMs,
      exclusiveCost,
      exSharedHit,
      exSharedRead,
      exSharedDirtied,
      exSharedWritten,
      exLocalHit,
      exLocalRead,
      exLocalDirtied,
      exLocalWritten,
      exTempRead,
      exTempWritten,
      // MISC
      sortMethod: plan['Sort Method'],
      sortSpaceUsed: plan['Sort Space Used'],
      sortSpaceType: plan['Sort Space Type'],
      // Subplan/CTE context
      subplanName: plan['Subplan Name'],
      cteName: plan['CTE Name'],
      // Raw JSON for detail panel
      raw: plan,
    }

    // Never executed flag.
    // Only set this when execution time is recorded (i.e. EXPLAIN ANALYZE).
    // Without ANALYZE, Actual fields may be missing/zero and would cause false positives.
    if (typeof opts?.executionTime === 'number') {
      if ((plan['Actual Loops'] ?? undefined) === 0) {
        data.neverExecuted = true
      }
    }

    // If a subplan context is inherited and not at the root, propagate it for badge display
    if (subName && subName !== plan['Subplan Name']) {
      data.subplanName = subName
    }
    nodes.push({ id, type: NODE_TYPE, data, position: { x: 0, y: 0 } })

    // Return this node's inclusive totals so that the parent can compute exclusives
    return {
      timeIncl: nodeTimeIncl,
      costIncl: nodeCostIncl,
      sharedHit: nodeSharedHit,
      sharedRead: nodeSharedRead,
      sharedDirtied: nodeSharedDirtied,
      sharedWritten: nodeSharedWritten,
      localHit: nodeLocalHit,
      localRead: nodeLocalRead,
      localDirtied: nodeLocalDirtied,
      localWritten: nodeLocalWritten,
      tempRead: nodeTempRead,
      tempWritten: nodeTempWritten,
    }
  }

  if (Array.isArray(planJson) && planJson.length > 0 && planJson[0].Plan) {
    addPlan(planJson[0].Plan)
  }

  return { nodes, edges, subplanRoots }
}
