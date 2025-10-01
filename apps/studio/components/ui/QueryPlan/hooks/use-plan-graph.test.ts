import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

import { usePlanGraph } from './use-plan-graph'
import { buildGraphFromPlan } from '../graph/build-graph-from-plan'

vi.mock('../graph/build-graph-from-plan', () => ({
  buildGraphFromPlan: vi.fn(),
}))

const mockGraph = vi.mocked(buildGraphFromPlan)

beforeEach(() => {
  mockGraph.mockReset()
})

const basePlan = [
  {
    Plan: {
      'Node Type': 'Seq Scan',
    },
    'Planning Time': 1.5,
    'Execution Time': 2.5,
    JIT: {
      Timing: {
        Total: 3.75,
      },
    },
  },
]

describe('usePlanGraph', () => {
  it('returns nodes, edges, and merged meta for a valid plan', () => {
    mockGraph.mockReturnValueOnce({
      nodes: [
        { id: 'root', data: { label: 'Seq Scan' }, position: { x: 0, y: 0 } },
        { id: 'root-0', data: { label: 'Index Scan' }, position: { x: 0, y: 0 } },
      ],
      edges: [{ id: 'root->root-0', source: 'root', target: 'root-0' }],
      subplanRoots: [{ name: 'Subplan A', id: 'root-0' }],
    })

    const { result } = renderHook(() => usePlanGraph(JSON.stringify(basePlan)))

    expect(mockGraph).toHaveBeenCalledWith(basePlan[0], {
      executionTime: 2.5,
    })
    expect(result.current.nodes).toHaveLength(2)
    expect(result.current.edges).toEqual([
      expect.objectContaining({ id: 'root->root-0', source: 'root', target: 'root-0' }),
    ])
    expect(result.current.meta).toMatchObject({
      planningTime: 1.5,
      executionTime: 2.5,
      jitTotalTime: 3.75,
      subplanRoots: [{ name: 'Subplan A', id: 'root-0' }],
    })
  })

  it('returns invalid plan error when graph has no nodes', () => {
    mockGraph.mockReturnValueOnce({ nodes: [], edges: [], subplanRoots: [] })

    const { result } = renderHook(() => usePlanGraph(JSON.stringify(basePlan)))

    expect(result.current.nodes).toHaveLength(0)
    expect(result.current.meta?.errorMessage).toBe('Invalid EXPLAIN JSON: Plan node not found.')
    expect(result.current.meta?.errorDetail).toContain(
      'The EXPLAIN (FORMAT JSON) result was invalid. The root should be an array and its first element must contain a "Plan" object.'
    )
  })

  it('returns parse error when JSON parsing fails', () => {
    const { result } = renderHook(() => usePlanGraph('not json'))

    expect(mockGraph).not.toHaveBeenCalled()
    expect(result.current.meta?.errorMessage).toBe('Failed to parse EXPLAIN JSON')
    expect(result.current.meta?.errorDetail).toContain(
      'The EXPLAIN (FORMAT JSON) result was not valid JSON.'
    )
  })
})
