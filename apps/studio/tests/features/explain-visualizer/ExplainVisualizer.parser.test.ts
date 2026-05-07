import {
  calculateMaxCost,
  calculateSummary,
  parseExplainOutput,
  parseNodeDetails,
} from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.parser'
import type {
  ExplainNode,
  QueryPlanRow,
} from 'components/interfaces/ExplainVisualizer/ExplainVisualizer.types'
import { describe, expect, test } from 'vitest'

// Helper to create QueryPlanRow array from strings
const toQueryPlanRows = (lines: string[]): QueryPlanRow[] =>
  lines.map((line) => ({ 'QUERY PLAN': line }))

describe('parseExplainOutput', () => {
  describe('simple operations', () => {
    test('parses a simple Seq Scan', () => {
      const input = toQueryPlanRows(['Seq Scan on users  (cost=0.00..10.50 rows=100 width=36)'])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Seq Scan')
      expect(result[0].details).toBe('on users')
      expect(result[0].cost).toEqual({ start: 0, end: 10.5 })
      expect(result[0].rows).toBe(100)
      expect(result[0].width).toBe(36)
      expect(result[0].actualTime).toBeUndefined()
      expect(result[0].actualRows).toBeUndefined()
      expect(result[0].level).toBe(0)
      expect(result[0].children).toHaveLength(0)
    })

    test('parses an Index Scan', () => {
      const input = toQueryPlanRows([
        'Index Scan using users_pkey on users  (cost=0.29..8.30 rows=1 width=48)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      // Parser keeps "using indexname" as part of operation when "on tablename" is present
      expect(result[0].operation).toBe('Index Scan using users_pkey')
      expect(result[0].details).toBe('on users')
      expect(result[0].cost).toEqual({ start: 0.29, end: 8.3 })
      expect(result[0].rows).toBe(1)
      expect(result[0].width).toBe(48)
    })

    test('parses an Index Only Scan', () => {
      const input = toQueryPlanRows([
        'Index Only Scan using idx_users_email on users  (cost=0.15..4.17 rows=1 width=32)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      // Parser keeps "using indexname" as part of operation when "on tablename" is present
      expect(result[0].operation).toBe('Index Only Scan using idx_users_email')
      expect(result[0].details).toBe('on users')
    })

    test('parses Bitmap Index Scan and Bitmap Heap Scan', () => {
      const input = toQueryPlanRows([
        'Bitmap Heap Scan on users  (cost=4.18..13.65 rows=3 width=36)',
        '  ->  Bitmap Index Scan on idx_users_status  (cost=0.00..4.18 rows=3 width=0)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Bitmap Heap Scan')
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].operation).toBe('Bitmap Index Scan')
      expect(result[0].children[0].details).toBe('on idx_users_status')
    })
  })

  describe('EXPLAIN ANALYZE output', () => {
    test('parses actual time and actual rows from EXPLAIN ANALYZE', () => {
      const input = toQueryPlanRows([
        'Seq Scan on users  (cost=0.00..10.50 rows=100 width=36) (actual time=0.015..0.123 rows=85 loops=1)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].cost).toEqual({ start: 0, end: 10.5 })
      expect(result[0].rows).toBe(100) // estimated rows
      expect(result[0].actualTime).toEqual({ start: 0.015, end: 0.123 })
      expect(result[0].actualRows).toBe(85) // actual rows
    })

    test('skips Planning Time and Execution Time lines', () => {
      const input = toQueryPlanRows([
        'Seq Scan on users  (cost=0.00..10.50 rows=100 width=36) (actual time=0.015..0.123 rows=85 loops=1)',
        'Planning Time: 0.089 ms',
        'Execution Time: 0.156 ms',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Seq Scan')
    })
  })

  describe('nested operations', () => {
    test('parses nested Hash Join with children', () => {
      const input = toQueryPlanRows([
        'Hash Join  (cost=10.50..25.30 rows=50 width=72)',
        '  Hash Cond: (orders.user_id = users.id)',
        '  ->  Seq Scan on orders  (cost=0.00..12.00 rows=200 width=36)',
        '  ->  Hash  (cost=10.50..10.50 rows=100 width=36)',
        '        ->  Seq Scan on users  (cost=0.00..10.50 rows=100 width=36)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Hash Join')
      expect(result[0].details).toContain('Hash Cond:')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children[0].operation).toBe('Seq Scan')
      expect(result[0].children[0].details).toBe('on orders')
      expect(result[0].children[1].operation).toBe('Hash')
      expect(result[0].children[1].children).toHaveLength(1)
      expect(result[0].children[1].children[0].operation).toBe('Seq Scan')
    })

    test('parses Merge Join', () => {
      const input = toQueryPlanRows([
        'Merge Join  (cost=200.00..350.00 rows=1000 width=80)',
        '  Merge Cond: (a.id = b.a_id)',
        '  ->  Index Scan using a_pkey on a  (cost=0.29..50.00 rows=500 width=40)',
        '  ->  Sort  (cost=150.00..155.00 rows=2000 width=40)',
        '        Sort Key: b.a_id',
        '        ->  Seq Scan on b  (cost=0.00..30.00 rows=2000 width=40)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Merge Join')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children[1].operation).toBe('Sort')
      expect(result[0].children[1].details).toContain('Sort Key:')
    })

    test('parses Nested Loop', () => {
      const input = toQueryPlanRows([
        'Nested Loop  (cost=0.29..16.60 rows=1 width=72)',
        '  ->  Index Scan using users_pkey on users  (cost=0.29..8.30 rows=1 width=36)',
        '  ->  Index Scan using orders_user_id_idx on orders  (cost=0.00..8.28 rows=1 width=36)',
        '        Index Cond: (user_id = users.id)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Nested Loop')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children[1].details).toContain('Index Cond:')
    })
  })

  describe('aggregate operations', () => {
    test('parses Aggregate operation', () => {
      const input = toQueryPlanRows([
        'Aggregate  (cost=12.50..12.51 rows=1 width=8)',
        '  ->  Seq Scan on users  (cost=0.00..10.50 rows=100 width=0)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Aggregate')
      expect(result[0].children).toHaveLength(1)
    })

    test('parses HashAggregate with Group Key', () => {
      const input = toQueryPlanRows([
        'HashAggregate  (cost=15.00..17.00 rows=10 width=12)',
        '  Group Key: status',
        '  ->  Seq Scan on orders  (cost=0.00..12.00 rows=200 width=4)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('HashAggregate')
      expect(result[0].details).toContain('Group Key: status')
      expect(result[0].children).toHaveLength(1)
    })

    test('parses GroupAggregate with Sort', () => {
      const input = toQueryPlanRows([
        'GroupAggregate  (cost=20.00..25.00 rows=10 width=12)',
        '  Group Key: category',
        '  ->  Sort  (cost=18.00..19.00 rows=200 width=8)',
        '        Sort Key: category',
        '        ->  Seq Scan on products  (cost=0.00..15.00 rows=200 width=8)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('GroupAggregate')
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].operation).toBe('Sort')
      expect(result[0].children[0].children).toHaveLength(1)
    })
  })

  describe('sorting and limiting', () => {
    test('parses Sort operation with Sort Key', () => {
      const input = toQueryPlanRows([
        'Sort  (cost=25.00..27.50 rows=100 width=36)',
        '  Sort Key: created_at DESC',
        '  ->  Seq Scan on events  (cost=0.00..20.00 rows=100 width=36)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Sort')
      expect(result[0].details).toContain('Sort Key: created_at DESC')
      expect(result[0].children).toHaveLength(1)
    })

    test('parses Sort with Sort Method in EXPLAIN ANALYZE', () => {
      const input = toQueryPlanRows([
        'Sort  (cost=25.00..27.50 rows=100 width=36) (actual time=0.100..0.150 rows=100 loops=1)',
        '  Sort Key: created_at DESC',
        '  Sort Method: quicksort  Memory: 32kB',
        '  ->  Seq Scan on events  (cost=0.00..20.00 rows=100 width=36) (actual time=0.010..0.050 rows=100 loops=1)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].details).toContain('Sort Key: created_at DESC')
      expect(result[0].details).toContain('Sort Method: quicksort  Memory: 32kB')
    })

    test('parses Limit operation', () => {
      const input = toQueryPlanRows([
        'Limit  (cost=0.00..1.05 rows=10 width=36)',
        '  ->  Seq Scan on users  (cost=0.00..10.50 rows=100 width=36)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Limit')
      expect(result[0].children).toHaveLength(1)
    })
  })

  describe('filter conditions', () => {
    test('parses Filter detail', () => {
      const input = toQueryPlanRows([
        'Seq Scan on users  (cost=0.00..10.50 rows=50 width=36)',
        "  Filter: (status = 'active'::text)",
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].details).toContain("Filter: (status = 'active'::text)")
    })

    test('parses Rows Removed by Filter', () => {
      const input = toQueryPlanRows([
        'Seq Scan on users  (cost=0.00..10.50 rows=50 width=36) (actual time=0.010..0.100 rows=50 loops=1)',
        "  Filter: (status = 'active'::text)",
        '  Rows Removed by Filter: 50',
      ])

      const result = parseExplainOutput(input)
      parseNodeDetails(result[0])

      expect(result[0].details).toContain('Rows Removed by Filter: 50')
      expect(result[0].rowsRemovedByFilter).toBe(50)
    })

    test('parses Index Cond', () => {
      const input = toQueryPlanRows([
        'Index Scan using users_pkey on users  (cost=0.29..8.30 rows=1 width=48)',
        '  Index Cond: (id = 123)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].details).toContain('Index Cond: (id = 123)')
    })

    test('parses Recheck Cond for Bitmap scans', () => {
      const input = toQueryPlanRows([
        'Bitmap Heap Scan on users  (cost=4.18..13.65 rows=3 width=36)',
        "  Recheck Cond: (status = 'active'::text)",
        '  ->  Bitmap Index Scan on idx_users_status  (cost=0.00..4.18 rows=3 width=0)',
        "        Index Cond: (status = 'active'::text)",
      ])

      const result = parseExplainOutput(input)

      expect(result[0].details).toContain("Recheck Cond: (status = 'active'::text)")
      expect(result[0].children[0].details).toContain("Index Cond: (status = 'active'::text)")
    })
  })

  describe('subplans and CTEs', () => {
    test('parses CTE Scan', () => {
      const input = toQueryPlanRows([
        'CTE Scan on recent_users  (cost=10.50..12.50 rows=100 width=36)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('CTE Scan')
      expect(result[0].details).toBe('on recent_users')
    })

    test('parses SubPlan reference', () => {
      const input = toQueryPlanRows([
        'Seq Scan on orders  (cost=0.00..25.00 rows=100 width=36)',
        '  Filter: (total > (SubPlan 1))',
        '  SubPlan 1',
        '    ->  Aggregate  (cost=10.50..10.51 rows=1 width=8)',
        '          ->  Seq Scan on orders orders_1  (cost=0.00..10.50 rows=100 width=4)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].details).toContain('Filter: (total > (SubPlan 1))')
      expect(result[0].details).toContain('SubPlan 1')
    })

    test('parses InitPlan', () => {
      const input = toQueryPlanRows([
        'Result  (cost=10.51..10.52 rows=1 width=8)',
        '  InitPlan 1 (returns $0)',
        '    ->  Aggregate  (cost=10.50..10.51 rows=1 width=8)',
        '          ->  Seq Scan on users  (cost=0.00..10.50 rows=100 width=0)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Result')
      expect(result[0].details).toContain('InitPlan 1 (returns $0)')
    })
  })

  describe('set operations', () => {
    test('parses Append for UNION ALL', () => {
      const input = toQueryPlanRows([
        'Append  (cost=0.00..21.00 rows=200 width=36)',
        '  ->  Seq Scan on users_2023  (cost=0.00..10.50 rows=100 width=36)',
        '  ->  Seq Scan on users_2024  (cost=0.00..10.50 rows=100 width=36)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Append')
      expect(result[0].children).toHaveLength(2)
    })

    test('parses Unique for UNION (distinct)', () => {
      const input = toQueryPlanRows([
        'Unique  (cost=25.00..30.00 rows=150 width=36)',
        '  ->  Sort  (cost=25.00..26.00 rows=200 width=36)',
        '        Sort Key: id',
        '        ->  Append  (cost=0.00..21.00 rows=200 width=36)',
        '              ->  Seq Scan on users_2023  (cost=0.00..10.50 rows=100 width=36)',
        '              ->  Seq Scan on users_2024  (cost=0.00..10.50 rows=100 width=36)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Unique')
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].operation).toBe('Sort')
    })
  })

  describe('parallel queries', () => {
    test('parses Gather with parallel workers', () => {
      const input = toQueryPlanRows([
        'Gather  (cost=1000.00..15000.00 rows=100000 width=36)',
        '  Workers Planned: 2',
        '  ->  Parallel Seq Scan on large_table  (cost=0.00..14000.00 rows=41667 width=36)',
        "        Filter: (status = 'active'::text)",
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Gather')
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].operation).toBe('Parallel Seq Scan')
    })

    test('parses Gather Merge', () => {
      const input = toQueryPlanRows([
        'Gather Merge  (cost=5000.00..10000.00 rows=50000 width=36)',
        '  Workers Planned: 2',
        '  ->  Sort  (cost=4000.00..4125.00 rows=25000 width=36)',
        '        Sort Key: created_at DESC',
        '        ->  Parallel Seq Scan on events  (cost=0.00..3000.00 rows=25000 width=36)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Gather Merge')
    })
  })

  describe('buffer information', () => {
    test('parses Buffers information in EXPLAIN (ANALYZE, BUFFERS)', () => {
      const input = toQueryPlanRows([
        'Seq Scan on users  (cost=0.00..10.50 rows=100 width=36) (actual time=0.010..0.100 rows=100 loops=1)',
        '  Buffers: shared hit=5',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].details).toContain('Buffers: shared hit=5')
    })
  })

  describe('edge cases', () => {
    test('handles empty input', () => {
      const result = parseExplainOutput([])
      expect(result).toHaveLength(0)
    })

    test('handles input with only empty strings', () => {
      const input = toQueryPlanRows(['', '   ', ''])
      const result = parseExplainOutput(input)
      expect(result).toHaveLength(0)
    })

    test('handles malformed metric strings gracefully', () => {
      const input = toQueryPlanRows(['Seq Scan on users  (malformed metrics)'])
      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Seq Scan')
      expect(result[0].cost).toBeUndefined()
    })

    test('handles operation without metrics', () => {
      const input = toQueryPlanRows(['Seq Scan on users'])
      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Seq Scan')
      expect(result[0].details).toBe('on users')
      expect(result[0].cost).toBeUndefined()
    })

    test('handles deeply nested query plans', () => {
      const input = toQueryPlanRows([
        'Limit  (cost=100.00..100.10 rows=10 width=36)',
        '  ->  Sort  (cost=100.00..102.50 rows=1000 width=36)',
        '        Sort Key: total DESC',
        '        ->  Hash Join  (cost=50.00..80.00 rows=1000 width=36)',
        '              Hash Cond: (o.user_id = u.id)',
        '              ->  Seq Scan on orders o  (cost=0.00..20.00 rows=1000 width=20)',
        '              ->  Hash  (cost=40.00..40.00 rows=500 width=16)',
        '                    ->  Seq Scan on users u  (cost=0.00..40.00 rows=500 width=16)',
        '                          Filter: (active = true)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Limit')
      expect(result[0].children[0].operation).toBe('Sort')
      expect(result[0].children[0].children[0].operation).toBe('Hash Join')
      expect(result[0].children[0].children[0].children).toHaveLength(2)
      expect(result[0].children[0].children[0].children[1].children[0].operation).toBe('Seq Scan')
    })

    test('handles One-Time Filter', () => {
      const input = toQueryPlanRows([
        'Result  (cost=0.00..0.01 rows=1 width=0)',
        '  One-Time Filter: false',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].details).toContain('One-Time Filter: false')
    })

    test('handles Output detail line', () => {
      const input = toQueryPlanRows([
        'Seq Scan on users  (cost=0.00..10.50 rows=100 width=36)',
        '  Output: id, name, email',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].details).toContain('Output: id, name, email')
    })

    test('handles invalid cost values gracefully', () => {
      const input = toQueryPlanRows([
        'Seq Scan on users  (cost=invalid..notanumber rows=100 width=36)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Seq Scan')
      // Should not parse invalid cost at all
      expect(result[0].cost).toBeUndefined()
    })

    test('handles invalid rows value gracefully', () => {
      const input = toQueryPlanRows([
        'Seq Scan on users  (cost=0.00..10.50 rows=notanumber width=36)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Seq Scan')
      // Should not parse invalid rows at all (regex won't match)
      expect(result[0].rows).toBeUndefined()
    })

    test('handles invalid actual time values gracefully', () => {
      const input = toQueryPlanRows([
        'Seq Scan on users  (cost=0.00..10.50 rows=100 width=36) (actual time=invalid..notanumber rows=85 loops=1)',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      // Should not parse invalid actual time at all
      expect(result[0].actualTime).toBeUndefined()
    })

    test('handles invalid rowsRemovedByFilter value gracefully', () => {
      const input = toQueryPlanRows([
        'Seq Scan on users  (cost=0.00..10.50 rows=100 width=36)',
        "  Filter: (status = 'active')",
        '  Rows Removed by Filter: notanumber',
      ])

      const result = parseExplainOutput(input)
      parseNodeDetails(result[0])

      expect(result).toHaveLength(1)
      // Should not parse invalid value at all (regex won't match)
      expect(result[0].rowsRemovedByFilter).toBeUndefined()
    })

    test('parsed numeric fields are finite for valid input', () => {
      const input = toQueryPlanRows([
        'Seq Scan on users  (cost=0.00..10.50 rows=100 width=36) (actual time=0.015..0.123 rows=85 loops=1)',
        "  Filter: (status = 'active')",
        '  Rows Removed by Filter: 15',
      ])

      const result = parseExplainOutput(input)
      parseNodeDetails(result[0])

      expect(result).toHaveLength(1)
      const node = result[0]

      // Verify all numeric values are finite
      if (node.cost) {
        expect(Number.isFinite(node.cost.start)).toBe(true)
        expect(Number.isFinite(node.cost.end)).toBe(true)
      }
      if (node.actualTime) {
        expect(Number.isFinite(node.actualTime.start)).toBe(true)
        expect(Number.isFinite(node.actualTime.end)).toBe(true)
      }
      if (node.rows !== undefined) {
        expect(Number.isFinite(node.rows)).toBe(true)
      }
      if (node.actualRows !== undefined) {
        expect(Number.isFinite(node.actualRows)).toBe(true)
      }
      if (node.width !== undefined) {
        expect(Number.isFinite(node.width)).toBe(true)
      }
      if (node.rowsRemovedByFilter !== undefined) {
        expect(Number.isFinite(node.rowsRemovedByFilter)).toBe(true)
      }
    })
  })

  describe('complex real-world queries', () => {
    test('parses a complex analytical query', () => {
      const input = toQueryPlanRows([
        'Limit  (cost=1500.00..1500.05 rows=20 width=48) (actual time=15.234..15.240 rows=20 loops=1)',
        '  ->  Sort  (cost=1500.00..1525.00 rows=10000 width=48) (actual time=15.232..15.235 rows=20 loops=1)',
        '        Sort Key: (sum(o.total)) DESC',
        '        Sort Method: top-N heapsort  Memory: 27kB',
        '        ->  HashAggregate  (cost=1200.00..1300.00 rows=10000 width=48) (actual time=12.456..14.789 rows=8543 loops=1)',
        '              Group Key: u.id',
        '              Batches: 1  Memory Usage: 1169kB',
        '              ->  Hash Join  (cost=125.00..950.00 rows=50000 width=20) (actual time=1.234..8.567 rows=50000 loops=1)',
        '                    Hash Cond: (o.user_id = u.id)',
        '                    ->  Seq Scan on orders o  (cost=0.00..750.00 rows=50000 width=12) (actual time=0.012..3.456 rows=50000 loops=1)',
        '                    ->  Hash  (cost=100.00..100.00 rows=2000 width=8) (actual time=1.111..1.111 rows=2000 loops=1)',
        '                          Buckets: 2048  Batches: 1  Memory Usage: 95kB',
        '                          ->  Seq Scan on users u  (cost=0.00..100.00 rows=2000 width=8) (actual time=0.008..0.567 rows=2000 loops=1)',
        '                                Filter: (active = true)',
        '                                Rows Removed by Filter: 500',
      ])

      const result = parseExplainOutput(input)

      expect(result).toHaveLength(1)
      expect(result[0].operation).toBe('Limit')
      expect(result[0].actualTime).toEqual({ start: 15.234, end: 15.24 })
      expect(result[0].actualRows).toBe(20)

      // Navigate to the deepest Seq Scan on users
      const hashJoin = result[0].children[0].children[0].children[0]
      expect(hashJoin.operation).toBe('Hash Join')
      const hash = hashJoin.children[1]
      expect(hash.operation).toBe('Hash')
      const usersScan = hash.children[0]
      expect(usersScan.operation).toBe('Seq Scan')
      expect(usersScan.details).toContain('Filter: (active = true)')
      expect(usersScan.details).toContain('Rows Removed by Filter: 500')
    })
  })
})

describe('parseNodeDetails', () => {
  test('parses Rows Removed by Filter from node details', () => {
    const node: ExplainNode = {
      operation: 'Seq Scan',
      details: "on users\nFilter: (status = 'active')\nRows Removed by Filter: 150",
      cost: { start: 0, end: 10.5 },
      rows: 100,
      width: 36,

      level: 0,
      children: [],
      raw: '',
    }

    parseNodeDetails(node)

    expect(node.rowsRemovedByFilter).toBe(150)
  })

  test('handles node without Rows Removed by Filter', () => {
    const node: ExplainNode = {
      operation: 'Seq Scan',
      details: 'on users',
      cost: { start: 0, end: 10.5 },
      rows: 100,
      width: 36,
      level: 0,
      children: [],
      raw: '',
    }

    parseNodeDetails(node)

    expect(node.rowsRemovedByFilter).toBeUndefined()
  })

  test('recursively parses details for children', () => {
    const node: ExplainNode = {
      operation: 'Hash Join',
      details: '',
      cost: { start: 0, end: 50 },
      rows: 100,
      width: 72,
      level: 0,
      children: [
        {
          operation: 'Seq Scan',
          details: 'on orders\nRows Removed by Filter: 200',
          cost: { start: 0, end: 20 },
          rows: 50,
          width: 36,

          level: 1,
          children: [],
          raw: '',
        },
        {
          operation: 'Seq Scan',
          details: 'on users\nRows Removed by Filter: 75',
          cost: { start: 0, end: 15 },
          rows: 25,
          width: 36,

          level: 1,
          children: [],
          raw: '',
        },
      ],
      raw: '',
    }

    parseNodeDetails(node)

    expect(node.children[0].rowsRemovedByFilter).toBe(200)
    expect(node.children[1].rowsRemovedByFilter).toBe(75)
  })
})

describe('calculateMaxCost', () => {
  test('returns 0 for empty tree', () => {
    const result = calculateMaxCost([])
    expect(result).toBe(0)
  })

  test('returns cost.end for single node', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Seq Scan',
        details: 'on users',
        cost: { start: 0, end: 25.5 },
        rows: 100,
        width: 36,
        level: 0,
        children: [],
        raw: '',
      },
    ]

    const result = calculateMaxCost(tree)
    expect(result).toBe(25.5)
  })

  test('prefers cost.end over actualTime.end (uses actualTime as fallback)', () => {
    // When both cost and actualTime are present, cost takes precedence
    const treeWithBoth: ExplainNode[] = [
      {
        operation: 'Seq Scan',
        details: 'on users',
        cost: { start: 0, end: 10.5 },
        rows: 100,
        width: 36,
        actualTime: { start: 0.01, end: 50.123 },
        actualRows: 100,
        level: 0,
        children: [],
        raw: '',
      },
    ]

    expect(calculateMaxCost(treeWithBoth)).toBe(10.5)

    // When only actualTime is present, it's used as fallback
    const treeOnlyActualTime: ExplainNode[] = [
      {
        operation: 'Seq Scan',
        details: 'on users',

        rows: 100,
        width: 36,
        actualTime: { start: 0.01, end: 50.123 },
        actualRows: 100,
        level: 0,
        children: [],
        raw: '',
      },
    ]

    expect(calculateMaxCost(treeOnlyActualTime)).toBe(50.123)
  })

  test('finds maximum across nested children', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Limit',
        details: '',
        cost: { start: 0, end: 100 },
        rows: 10,
        width: 36,
        level: 0,
        children: [
          {
            operation: 'Sort',
            details: '',
            cost: { start: 0, end: 250 }, // This is the maximum
            rows: 1000,
            width: 36,
            level: 1,
            children: [
              {
                operation: 'Seq Scan',
                details: 'on users',
                cost: { start: 0, end: 150 },
                rows: 1000,
                width: 36,
                level: 2,
                children: [],
                raw: '',
              },
            ],
            raw: '',
          },
        ],
        raw: '',
      },
    ]

    const result = calculateMaxCost(tree)
    expect(result).toBe(250)
  })

  test('handles multiple root nodes', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Seq Scan',
        details: 'on users',
        cost: { start: 0, end: 30 },
        rows: 100,
        width: 36,
        level: 0,
        children: [],
        raw: '',
      },
      {
        operation: 'Seq Scan',
        details: 'on orders',
        cost: { start: 0, end: 75 },
        rows: 200,
        width: 36,
        level: 0,
        children: [],
        raw: '',
      },
    ]

    const result = calculateMaxCost(tree)
    expect(result).toBe(75)
  })

  test('handles nodes without cost or actualTime', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Result',
        details: '',
        level: 0,
        children: [],
        raw: '',
      },
    ]

    const result = calculateMaxCost(tree)
    expect(result).toBe(0)
  })
})

describe('calculateSummary', () => {
  test('returns default values for empty tree', () => {
    const result = calculateSummary([])

    expect(result).toEqual({
      totalTime: 0,
      totalCost: 0,
      maxCost: 0,
      hasSeqScan: false,
      seqScanTables: [],
      hasIndexScan: false,
    })
  })

  test('calculates totalCost from root node cost.end', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Seq Scan',
        details: 'on users',
        cost: { start: 0, end: 45.5 },
        rows: 100,
        width: 36,
        level: 0,
        children: [],
        raw: '',
      },
    ]

    const result = calculateSummary(tree)
    expect(result.totalCost).toBe(45.5)
  })

  test('calculates maxCost from maximum cost across all nodes', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Limit',
        details: '',
        cost: { start: 0, end: 100 },
        rows: 10,
        width: 36,
        level: 0,
        children: [
          {
            operation: 'Sort',
            details: '',
            cost: { start: 0, end: 250 }, // This is the maximum
            rows: 1000,
            width: 36,
            level: 1,
            children: [
              {
                operation: 'Seq Scan',
                details: 'on users',
                cost: { start: 0, end: 150 },
                rows: 1000,
                width: 36,
                level: 2,
                children: [],
                raw: '',
              },
            ],
            raw: '',
          },
        ],
        raw: '',
      },
    ]

    const result = calculateSummary(tree)
    expect(result.totalCost).toBe(100) // Root node cost
    expect(result.maxCost).toBe(250) // Maximum across all nodes
  })

  test('calculates totalTime from actualTime.end', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Seq Scan',
        details: 'on users',
        cost: { start: 0, end: 10.5 },
        rows: 100,
        width: 36,
        actualTime: { start: 0.01, end: 123.456 },
        actualRows: 100,
        level: 0,
        children: [],
        raw: '',
      },
    ]

    const result = calculateSummary(tree)
    expect(result.totalTime).toBe(123.456)
  })

  test('detects Seq Scan and extracts table name', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Seq Scan',
        details: 'on users',
        cost: { start: 0, end: 10.5 },
        rows: 100,
        width: 36,
        level: 0,
        children: [],
        raw: '',
      },
    ]

    const result = calculateSummary(tree)
    expect(result.hasSeqScan).toBe(true)
    expect(result.seqScanTables).toEqual(['users'])
  })

  test('detects multiple Seq Scans on different tables', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Hash Join',
        details: '',
        cost: { start: 0, end: 50 },
        rows: 100,
        width: 72,
        level: 0,
        children: [
          {
            operation: 'Seq Scan',
            details: 'on orders',
            cost: { start: 0, end: 20 },
            rows: 100,
            width: 36,
            level: 1,
            children: [],
            raw: '',
          },
          {
            operation: 'Seq Scan',
            details: 'on users',
            cost: { start: 0, end: 15 },
            rows: 50,
            width: 36,
            level: 1,
            children: [],
            raw: '',
          },
        ],
        raw: '',
      },
    ]

    const result = calculateSummary(tree)
    expect(result.hasSeqScan).toBe(true)
    expect(result.seqScanTables).toEqual(['orders', 'users'])
  })

  test('detects Index Scan', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Index Scan using users_pkey',
        details: 'on users',
        cost: { start: 0.29, end: 8.3 },
        rows: 1,
        width: 48,
        level: 0,
        children: [],
        raw: '',
      },
    ]

    const result = calculateSummary(tree)
    expect(result.hasIndexScan).toBe(true)
    expect(result.hasSeqScan).toBe(false)
  })

  test('detects Index Only Scan', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Index Only Scan',
        details: 'using idx_users_email on users',
        cost: { start: 0.15, end: 4.17 },
        rows: 1,
        width: 32,
        level: 0,
        children: [],
        raw: '',
      },
    ]

    const result = calculateSummary(tree)
    expect(result.hasIndexScan).toBe(true)
  })

  test('detects Bitmap Index Scan', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Bitmap Heap Scan',
        details: 'on users',
        cost: { start: 4.18, end: 13.65 },
        rows: 3,
        width: 36,
        level: 0,
        children: [
          {
            operation: 'Bitmap Index Scan',
            details: 'on idx_users_status',
            cost: { start: 0, end: 4.18 },
            rows: 3,
            width: 0,
            level: 1,
            children: [],
            raw: '',
          },
        ],
        raw: '',
      },
    ]

    const result = calculateSummary(tree)
    expect(result.hasIndexScan).toBe(true)
  })

  test('handles complex query with both seq and index scans', () => {
    const tree: ExplainNode[] = [
      {
        operation: 'Hash Join',
        details: '',
        cost: { start: 10.5, end: 35.8 },
        rows: 50,
        width: 72,
        actualTime: { start: 0.5, end: 2.345 },
        actualRows: 48,
        level: 0,
        children: [
          {
            operation: 'Seq Scan',
            details: 'on orders',
            cost: { start: 0, end: 20 },
            rows: 100,
            width: 36,
            actualTime: { start: 0.01, end: 0.5 },
            actualRows: 95,
            level: 1,
            children: [],
            raw: '',
          },
          {
            operation: 'Index Scan using users_pkey',
            details: 'on users',
            cost: { start: 0.29, end: 8.3 },
            rows: 1,
            width: 36,
            actualTime: { start: 0.005, end: 0.015 },
            actualRows: 1,
            level: 1,
            children: [],
            raw: '',
          },
        ],
        raw: '',
      },
    ]

    const result = calculateSummary(tree)
    expect(result.totalCost).toBe(35.8) // Root node cost
    expect(result.maxCost).toBe(35.8) // Maximum cost across all nodes (root is highest)
    expect(result.totalTime).toBe(2.345)
    expect(result.hasSeqScan).toBe(true)
    expect(result.hasIndexScan).toBe(true)
    expect(result.seqScanTables).toEqual(['orders'])
  })
})
