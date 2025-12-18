import { describe, expect, it } from 'vitest'

import { buildGraphFromPlan } from './build-graph-from-plan'

const baseChildPlan = {
  'Node Type': 'Index Scan',
  'Actual Total Time': 4,
  'Actual Loops': 2,
  'Total Cost': 10,
  'Actual Rows': 5,
  'Shared Hit Blocks': 2,
  'Shared Read Blocks': 1,
  'Local Hit Blocks': 1,
  'Temp Read Blocks': 1,
} as const

describe('buildGraphFromPlan', () => {
  it('builds node hierarchy with exclusive metrics and edges', () => {
    const plan = {
      Plan: {
        'Node Type': 'Seq Scan',
        'Actual Total Time': 10,
        'Actual Loops': 2,
        'Actual Rows': 8,
        'Total Cost': 30,
        'Shared Hit Blocks': 5,
        'Shared Read Blocks': 3,
        'Local Hit Blocks': 2,
        'Temp Read Blocks': 2,
        Plans: [baseChildPlan],
      },
    }

    const { nodes, edges } = buildGraphFromPlan(plan, { executionTime: 25 })

    expect(nodes).toHaveLength(2)
    expect(edges).toEqual([
      expect.objectContaining({ id: 'root->root-0', source: 'root', target: 'root-0' }),
    ])

    const rootNode = nodes.find((n) => n.id === 'root')
    expect(rootNode?.data.label).toBe('Seq Scan')
    expect(rootNode?.data.actualLoops).toBe(2)
    expect(rootNode?.data.estActualTotalRows).toBe(16)
    expect(rootNode?.data.exclusiveTimeMs).toBe(12) // 20 - child(8)
    expect(rootNode?.data.exclusiveCost).toBe(20) // 30 - child(10)
    expect(rootNode?.data.exSharedHit).toBe(3) // 5 - 2
    expect(rootNode?.data.exTempRead).toBe(1) // 2 - 1

    const childNode = nodes.find((n) => n.id === 'root-0')
    expect(childNode?.data.label).toBe('Index Scan')
    expect(childNode?.data.exclusiveTimeMs).toBe(8)
    expect(childNode?.data.exclusiveCost).toBe(10)
    expect(childNode?.data.neverExecuted).toBeUndefined()
  })

  it('tracks subplan roots and flags never executed nodes', () => {
    const plan = {
      Plan: {
        'Node Type': 'Nested Loop',
        Plans: [
          {
            ...baseChildPlan,
            'Node Type': 'CTE Scan',
            'Subplan Name': 'CTE foo',
            'Plan Rows': 4,
            'Actual Rows': 0,
            'Actual Loops': 0,
          },
        ],
      },
      'Execution Time': 3,
    }

    const { nodes, subplanRoots } = buildGraphFromPlan(plan, { executionTime: 3 })

    expect(subplanRoots).toEqual([{ name: 'CTE foo', id: 'root-0' }])

    const subplanNode = nodes.find((n) => n.id === 'root-0')
    expect(subplanNode?.data.subplanName).toBe('CTE foo')
    expect(subplanNode?.data.estFactor).toBe(0)
    expect(subplanNode?.data.estDirection).toBe('over')
    expect(subplanNode?.data.neverExecuted).toBe(true)
  })

  it('normalizes child timing for gather nodes before computing self-time hints', () => {
    const plan = {
      Plan: {
        'Node Type': 'Gather Merge',
        'Actual Total Time': 12,
        'Actual Loops': 1,
        'Workers Planned': 2,
        Plans: [
          {
            'Node Type': 'Seq Scan',
            'Parent Relationship': 'Outer',
            'Actual Total Time': 6,
            'Actual Loops': 2,
          },
        ],
      },
      'Execution Time': 12,
    }

    const { nodes } = buildGraphFromPlan(plan, { executionTime: 12 })

    const gatherNode = nodes.find((n) => n.id === 'root')
    expect(gatherNode?.data.label).toBe('Gather Merge')
    expect(gatherNode?.data.exclusiveTimeMs).toBeCloseTo(8)
    expect(gatherNode?.data.slowHint?.severity).toBe('warn')

    const workerNode = nodes.find((n) => n.id === 'root-0')
    expect(workerNode?.data.exclusiveTimeMs).toBeCloseTo(4)
  })
})
