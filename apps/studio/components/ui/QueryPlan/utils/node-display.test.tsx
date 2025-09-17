import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { PlanNodeData } from '../types'
import type { MetricsVisibility } from '../contexts'
import { DEFAULT_NODE_HEIGHT_CONSTANTS } from '../constants'
import {
  computeHeaderLines,
  countBodyRows,
  estimateNodeHeight,
  hasLocal,
  hasShared,
  hasTemp,
  localTooltip,
  removedPercentValue,
  sharedTooltip,
  tempTooltip,
} from './node-display'

const createNode = (overrides: Partial<PlanNodeData>): PlanNodeData => ({
  label: 'Node',
  ...overrides,
})

describe('computeHeaderLines', () => {
  it('formats header lines with context information', () => {
    const node = createNode({
      label: 'Index Scan',
      cteName: 'cte_sales',
      parallelAware: true,
      groupKey: ['(user_id)'],
      sortKey: ['(created_at)'],
      presortedKey: ['(created_at)'],
      hashCond: '(users.id = orders.user_id)',
      indexName: 'idx_users_id',
    })

    const lines = computeHeaderLines(node)

    render(
      <div>
        {lines.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>
    )

    expect(screen.getByText('[CTE] cte_sales')).toBeInTheDocument()
    expect(screen.getByText('[Parallel]')).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => element?.textContent === 'by user_id')
    ).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => element?.textContent === 'by created_at (presort)')
    ).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => element?.textContent === 'on users.id = orders.user_id')
    ).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => element?.textContent === 'using idx_users_id')
    ).toBeInTheDocument()
  })
})

describe('tooltip helpers', () => {
  const node = createNode({
    sharedHit: 1,
    sharedRead: 0,
    sharedDirtied: 2,
    sharedWritten: 3,
    exSharedHit: 4,
    exSharedRead: 5,
    exSharedDirtied: 6,
    exSharedWritten: 7,
    localHit: 2,
    localRead: 1,
    localDirtied: 0,
    localWritten: 3,
    exLocalHit: 4,
    exLocalRead: 5,
    exLocalDirtied: 6,
    exLocalWritten: 7,
    tempRead: 2,
    tempWritten: 1,
    exTempRead: 3,
    exTempWritten: 0,
  })

  it('returns formatted shared blocks tooltip', () => {
    expect(sharedTooltip(node)).toBe(
      'Shared Blocks\nincl: h=1 (8.0 KB), r=0 (0 B), d=2 (16.0 KB), w=3 (24.0 KB)\nself: h=4 (32.0 KB), r=5 (40.0 KB), d=6 (48.0 KB), w=7 (56.0 KB)'
    )
  })

  it('returns formatted local blocks tooltip', () => {
    expect(localTooltip(node)).toBe(
      'Local Blocks\nincl: h=2 (16.0 KB), r=1 (8.0 KB), d=0 (0 B), w=3 (24.0 KB)\nself: h=4 (32.0 KB), r=5 (40.0 KB), d=6 (48.0 KB), w=7 (56.0 KB)'
    )
  })

  it('returns formatted temp blocks tooltip', () => {
    expect(tempTooltip(node)).toBe(
      'Temp Blocks\nincl: r=2 (16.0 KB), w=1 (8.0 KB)\nself: r=3 (24.0 KB), w=0 (0 B)'
    )
  })
})

describe('removedPercentValue', () => {
  it('computes percentage using loops and actual rows', () => {
    const node = createNode({ actualRows: 5, actualLoops: 2 })
    expect(removedPercentValue(node, 5)).toBe(33)
  })

  it('returns undefined when denominator is zero', () => {
    const node = createNode({ actualRows: 0, actualLoops: 0 })
    expect(removedPercentValue(node, 0)).toBeUndefined()
  })
})

describe('buffer presence helpers', () => {
  it('detects shared/local/temp buffers based on exclusive metrics', () => {
    const node = createNode({
      exSharedHit: 1,
      exSharedRead: 0,
      exSharedWritten: 0,
      exSharedDirtied: 0,
      exLocalHit: 0,
      exLocalRead: 2,
      exLocalWritten: 0,
      exLocalDirtied: 0,
      exTempRead: 3,
      exTempWritten: 0,
    })

    expect(hasShared(node)).toBe(true)
    expect(hasLocal(node)).toBe(true)
    expect(hasTemp(node)).toBe(true)

    const empty = createNode({})
    expect(hasShared(empty)).toBe(false)
    expect(hasLocal(empty)).toBe(false)
    expect(hasTemp(empty)).toBe(false)
  })
})

describe('countBodyRows & estimateNodeHeight', () => {
  const visibility: MetricsVisibility = {
    time: true,
    rows: true,
    cost: true,
    buffers: true,
    output: true,
  }

  const node = createNode({
    label: 'Index Scan',
    cteName: 'cte_sales',
    parallelAware: true,
    groupKey: ['(user_id)'],
    sortKey: ['(created_at)'],
    presortedKey: ['(created_at)'],
    hashCond: '(users.id = orders.user_id)',
    indexName: 'idx_users_id',
    actualTotalTime: 10,
    exclusiveTimeMs: 5,
    actualRows: 4,
    planRows: 8,
    estFactor: 0.5,
    startupCost: 1,
    totalCost: 2,
    exclusiveCost: 1,
    planWidth: 3,
    rowsRemovedByFilter: 1,
    rowsRemovedByJoinFilter: 1,
    rowsRemovedByIndexRecheck: 1,
    heapFetches: 2,
    exSharedHit: 1,
    exSharedRead: 0,
    exSharedWritten: 0,
    exSharedDirtied: 0,
    exLocalHit: 1,
    exLocalRead: 0,
    exLocalWritten: 0,
    exLocalDirtied: 0,
    exTempRead: 1,
    exTempWritten: 0,
    outputCols: ['id'],
    ioReadTime: 1,
    ioWriteTime: 0,
  })

  it('counts rendered metric rows based on visibility and data', () => {
    expect(countBodyRows(node, visibility)).toBe(16)
  })

  it('estimates node height using fixed constants', () => {
    const height = estimateNodeHeight(node, visibility, 'time')
    const headerCount = computeHeaderLines(node).length
    const bodyCount = countBodyRows(node, visibility)

    const expected =
      DEFAULT_NODE_HEIGHT_CONSTANTS.HEADER_H +
      DEFAULT_NODE_HEIGHT_CONSTANTS.HEATMAP_H +
      headerCount * DEFAULT_NODE_HEIGHT_CONSTANTS.HEADER_LINE_H +
      bodyCount * DEFAULT_NODE_HEIGHT_CONSTANTS.ITEM_H +
      DEFAULT_NODE_HEIGHT_CONSTANTS.PADDING

    expect(height).toBe(expected)
  })
})
