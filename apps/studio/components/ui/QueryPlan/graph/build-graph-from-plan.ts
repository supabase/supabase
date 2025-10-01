import type { Edge, Node } from 'reactflow'

import type { RawPlan, PlanRoot, PlanNodeData, Agg } from '../types'
import { NODE_TYPE } from '../constants'
import { toArray } from '../utils/formats'
import { percentile } from './utils'

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

const computeInclusiveBasics = (plan: RawPlan, workerMultiplier: number) => {
  const loops = plan['Actual Loops'] ?? 1
  const nodeTimeIncl = ((plan['Actual Total Time'] ?? 0) * loops) / workerMultiplier
  const nodeCostIncl = plan['Total Cost'] ?? 0
  const actualRowsPerLoop = plan['Actual Rows'] ?? 0
  const actualRowsTotal = actualRowsPerLoop * loops

  return { loops, nodeTimeIncl, nodeCostIncl, actualRowsTotal }
}

const extractBuffers = (plan: RawPlan) => ({
  nodeSharedHit: plan['Shared Hit Blocks'] ?? 0,
  nodeSharedRead: plan['Shared Read Blocks'] ?? 0,
  nodeSharedDirtied: plan['Shared Dirtied Blocks'] ?? 0,
  nodeSharedWritten: plan['Shared Written Blocks'] ?? 0,
  nodeLocalHit: plan['Local Hit Blocks'] ?? 0,
  nodeLocalRead: plan['Local Read Blocks'] ?? 0,
  nodeLocalDirtied: plan['Local Dirtied Blocks'] ?? 0,
  nodeLocalWritten: plan['Local Written Blocks'] ?? 0,
  nodeTempRead: plan['Temp Read Blocks'] ?? 0,
  nodeTempWritten: plan['Temp Written Blocks'] ?? 0,
})

const computeEstimation = (
  plan: RawPlan,
  actualRowsTotal: number
): { estFactor?: number; estDirection?: 'over' | 'under' | 'none' } => {
  const planRowsEst = plan['Plan Rows'] ?? 0
  if (planRowsEst <= 0) return {}

  const estFactor = actualRowsTotal / planRowsEst
  if (estFactor > 1) return { estFactor, estDirection: 'under' }
  if (estFactor < 1) return { estFactor, estDirection: 'over' }
  return { estFactor, estDirection: 'none' }
}

const computeExclusives = (
  inclusive: ReturnType<typeof computeInclusiveBasics> & ReturnType<typeof extractBuffers>,
  childAgg: Agg
) => ({
  exclusiveTimeMs: Math.max(inclusive.nodeTimeIncl - childAgg.timeIncl, 0),
  exclusiveCost: Math.max(inclusive.nodeCostIncl - childAgg.costIncl, 0),
  exSharedHit: Math.max(inclusive.nodeSharedHit - childAgg.sharedHit, 0),
  exSharedRead: Math.max(inclusive.nodeSharedRead - childAgg.sharedRead, 0),
  exSharedDirtied: Math.max(inclusive.nodeSharedDirtied - childAgg.sharedDirtied, 0),
  exSharedWritten: Math.max(inclusive.nodeSharedWritten - childAgg.sharedWritten, 0),
  exLocalHit: Math.max(inclusive.nodeLocalHit - childAgg.localHit, 0),
  exLocalRead: Math.max(inclusive.nodeLocalRead - childAgg.localRead, 0),
  exLocalDirtied: Math.max(inclusive.nodeLocalDirtied - childAgg.localDirtied, 0),
  exLocalWritten: Math.max(inclusive.nodeLocalWritten - childAgg.localWritten, 0),
  exTempRead: Math.max(inclusive.nodeTempRead - childAgg.tempRead, 0),
  exTempWritten: Math.max(inclusive.nodeTempWritten - childAgg.tempWritten, 0),
})

const createPlanNodeData = (
  plan: RawPlan,
  label: string,
  inclusive: ReturnType<typeof computeInclusiveBasics>,
  buffers: ReturnType<typeof extractBuffers>,
  exclusives: ReturnType<typeof computeExclusives>,
  est: ReturnType<typeof computeEstimation>,
  subName: string | undefined,
  opts?: { executionTime?: number }
): PlanNodeData => {
  let estDirection: 'over' | 'under' | 'none' | undefined = est.estDirection
  const estFactor = est.estFactor

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
    estActualTotalRows: inclusive.actualRowsTotal,
    rowsRemovedByFilter: plan['Rows Removed by Filter'],
    rowsRemovedByJoinFilter: plan['Rows Removed by Join Filter'],
    rowsRemovedByIndexRecheck: plan['Rows Removed by Index Recheck'],
    heapFetches: plan['Heap Fetches'],
    outputCols: plan['Output'],
    // BUFFERS (inclusive values kept as-is for reference if needed)
    sharedHit: buffers.nodeSharedHit,
    sharedRead: buffers.nodeSharedRead,
    sharedDirtied: buffers.nodeSharedDirtied,
    sharedWritten: buffers.nodeSharedWritten,
    localHit: buffers.nodeLocalHit,
    localRead: buffers.nodeLocalRead,
    localDirtied: buffers.nodeLocalDirtied,
    localWritten: buffers.nodeLocalWritten,
    tempRead: buffers.nodeTempRead,
    tempWritten: buffers.nodeTempWritten,
    ioReadTime: plan['I/O Read Time'],
    ioWriteTime: plan['I/O Write Time'],
    // Workers
    workersPlanned: plan['Workers Planned'],
    workersLaunched: plan['Workers Launched'],
    // Exclusive (derived)
    exclusiveTimeMs: exclusives.exclusiveTimeMs,
    exclusiveCost: exclusives.exclusiveCost,
    exSharedHit: exclusives.exSharedHit,
    exSharedRead: exclusives.exSharedRead,
    exSharedDirtied: exclusives.exSharedDirtied,
    exSharedWritten: exclusives.exSharedWritten,
    exLocalHit: exclusives.exLocalHit,
    exLocalRead: exclusives.exLocalRead,
    exLocalDirtied: exclusives.exLocalDirtied,
    exLocalWritten: exclusives.exLocalWritten,
    exTempRead: exclusives.exTempRead,
    exTempWritten: exclusives.exTempWritten,
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

  const isAnalyzeRun = opts?.executionTime !== undefined
  if (isAnalyzeRun && (plan['Actual Loops'] ?? undefined) === 0) {
    data.neverExecuted = true
  }

  if (subName && subName !== plan['Subplan Name']) {
    data.subplanName = subName
  }

  return data
}

const MIN_SELF_TIME_MS = 1
const annotateNodesWithHints = (
  nodes: Node<PlanNodeData>[],
  opts?: { executionTime?: number }
): void => {
  const fallbackTotalTime = nodes.reduce((sum, node) => sum + (node.data.exclusiveTimeMs ?? 0), 0)
  const execTime = opts?.executionTime && opts.executionTime > 0 ? opts.executionTime : undefined
  const totalSelfTime = execTime && execTime > 0 ? execTime : fallbackTotalTime

  const selfTimeValues = nodes
    .map((node) => node.data.exclusiveTimeMs ?? 0)
    .filter((value) => value > 0)

  const p90SelfTime = percentile(selfTimeValues, 0.9)
  const p95SelfTime = percentile(selfTimeValues, 0.95)

  const costValues = nodes.map((node) => node.data.exclusiveCost ?? 0).filter((value) => value > 0)
  const totalSelfCost = costValues.reduce((sum, value) => sum + value, 0)
  const p90Cost = percentile(costValues, 0.9)
  const p95Cost = percentile(costValues, 0.95)
  const maxTotalCost = nodes.reduce((max, node) => Math.max(max, node.data.totalCost ?? 0), 0)

  nodes.forEach((node) => {
    const data = node.data

    const selfTime = data.exclusiveTimeMs ?? 0
    if (selfTime >= MIN_SELF_TIME_MS && totalSelfTime > 0) {
      const share = selfTime / totalSelfTime
      let severity: 'warn' | 'alert' | undefined

      if (share >= 0.75) {
        severity = 'alert'
      } else if (share >= 0.35) {
        severity = 'warn'
      } else if (p95SelfTime >= MIN_SELF_TIME_MS && selfTime >= p95SelfTime) {
        severity = 'alert'
      } else if (p90SelfTime >= MIN_SELF_TIME_MS && selfTime >= p90SelfTime) {
        severity = 'warn'
      }

      if (severity) {
        data.slowHint = {
          severity,
          selfTimeMs: selfTime,
          selfTimeShare: share,
        }
      }
    }

    const selfCost = data.exclusiveCost ?? 0
    let costSeverity: 'warn' | 'alert' | undefined
    let selfCostShare: number | undefined
    let maxTotalCostShare: number | undefined

    const applySeverity = (newSeverity: 'warn' | 'alert' | undefined) => {
      if (!newSeverity) return
      if (!costSeverity) {
        costSeverity = newSeverity
        return
      }
      const rank = { warn: 1, alert: 2 } as const
      if (rank[newSeverity] > rank[costSeverity]) {
        costSeverity = newSeverity
      }
    }

    if (selfCost > 0) {
      if (totalSelfCost > 0) {
        const share = selfCost / totalSelfCost
        selfCostShare = share
        if (share >= 0.5) {
          applySeverity('alert')
        } else if (share >= 0.25) {
          applySeverity('warn')
        }
      }

      if (maxTotalCost > 0) {
        const percentOfMax = selfCost / maxTotalCost
        maxTotalCostShare = percentOfMax
        if (percentOfMax >= 0.9) {
          applySeverity('alert')
        } else if (percentOfMax >= 0.4) {
          applySeverity('warn')
        } else if (percentOfMax >= 0.1) {
          applySeverity('warn')
        }
      }

      if (!costSeverity) {
        if (p95Cost > 0 && selfCost >= p95Cost) {
          applySeverity('alert')
        } else if (p90Cost > 0 && selfCost >= p90Cost) {
          applySeverity('warn')
        }
      }
    }

    if (costSeverity) {
      data.costHint = {
        severity: costSeverity,
        selfCost,
        selfCostShare,
        maxTotalCostShare,
      }
    }
  })
}

export const buildGraphFromPlan = (
  planJson: PlanRoot,
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
    currentSubplanName?: string,
    gatherWorkers?: number
  ): Agg => {
    const id = parentId ? `${parentId}-${index}` : 'root'
    const label = plan['Node Type'] ?? 'Node'
    const subName = plan['Subplan Name'] ?? currentSubplanName

    if (plan['Subplan Name']) {
      subplanRoots.push({ name: plan['Subplan Name'], id })
    }

    const children: RawPlan[] = plan['Plans'] ?? []
    const nodeType = plan['Node Type'] ?? ''

    let gatherWorkersForChildren = gatherWorkers
    if (nodeType === 'Gather' || nodeType === 'Gather Merge') {
      const planned = plan['Workers Planned']
      const launched = plan['Workers Launched']
      if (typeof planned === 'number' && planned > 0) {
        gatherWorkersForChildren = planned
      } else if (typeof launched === 'number' && launched > 0) {
        gatherWorkersForChildren = launched
      }
    }

    let childAgg: Agg = zeroAgg()
    children.forEach((child, i) => {
      const relationship = child['Parent Relationship']
      const shouldPropagateGather =
        gatherWorkersForChildren !== undefined &&
        relationship !== 'InitPlan' &&
        relationship !== 'SubPlan'

      const childGatherWorkers = shouldPropagateGather ? gatherWorkersForChildren : undefined
      const agg = addPlan(child, id, i, subName, childGatherWorkers)
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

    const workerMultiplier = (gatherWorkers ?? 0) + 1
    const inclusiveBasics = computeInclusiveBasics(plan, workerMultiplier)
    const buffers = extractBuffers(plan)

    const est = computeEstimation(plan, inclusiveBasics.actualRowsTotal)

    // Exclusive (self) = node inclusive - sum(children inclusive)
    const exclusives = computeExclusives({ ...inclusiveBasics, ...buffers }, childAgg)

    const data = createPlanNodeData(
      plan,
      label,
      inclusiveBasics,
      buffers,
      exclusives,
      est,
      subName,
      opts
    )
    nodes.push({ id, type: NODE_TYPE, data, position: { x: 0, y: 0 } })

    return {
      timeIncl: inclusiveBasics.nodeTimeIncl,
      costIncl: inclusiveBasics.nodeCostIncl,
      sharedHit: buffers.nodeSharedHit,
      sharedRead: buffers.nodeSharedRead,
      sharedDirtied: buffers.nodeSharedDirtied,
      sharedWritten: buffers.nodeSharedWritten,
      localHit: buffers.nodeLocalHit,
      localRead: buffers.nodeLocalRead,
      localDirtied: buffers.nodeLocalDirtied,
      localWritten: buffers.nodeLocalWritten,
      tempRead: buffers.nodeTempRead,
      tempWritten: buffers.nodeTempWritten,
    }
  }

  addPlan(planJson.Plan)
  annotateNodesWithHints(nodes, opts)

  return { nodes, edges, subplanRoots }
}
