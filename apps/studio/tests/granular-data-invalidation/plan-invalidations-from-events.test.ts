import { describe, it, expect } from 'vitest'

import type { InvalidationEvent } from '../../lib/granular-data-invalidation'
import { planInvalidationsFromEvents } from '../../lib/granular-data-invalidation/plan-invalidations-from-events'

describe('planInvalidationsFromEvents', () => {
  const projectRef = 'test-project-123'

  describe('table events', () => {
    it('should plan invalidations for CREATE TABLE with schema', () => {
      const events: InvalidationEvent[] = [
        {
          entityType: 'table',
          schema: 'public',
          table: 'users',
          entityName: 'users',
          projectRef,
        },
      ]

      const result = planInvalidationsFromEvents(events)

      expect(result).toHaveLength(4)

      expect(result[0]).toEqual({
        key: ['projects', projectRef, 'tables', 'public', true],
        exact: true,
      })
      expect(result[1]).toEqual({
        key: ['projects', projectRef, 'tables', 'public'],
        exact: true,
      })

      expect(result[2]).toEqual({
        key: ['projects', projectRef, 'tables', 'public', 'users'],
        refetchType: 'active',
      })

      expect(result[3]).toEqual({
        key: ['projects', projectRef, 'entity-types'],
        exact: false,
      })
    })

    it('should plan invalidations for DROP TABLE without specific table details', () => {
      const events: InvalidationEvent[] = [
        {
          entityType: 'table',
          schema: 'public',
          entityName: 'users',
          projectRef,
        },
      ]

      const result = planInvalidationsFromEvents(events)

      expect(result).toHaveLength(3)

      expect(result[0]).toEqual({
        key: ['projects', projectRef, 'tables', 'public', true],
        exact: true,
      })
      expect(result[1]).toEqual({
        key: ['projects', projectRef, 'tables', 'public'],
        exact: true,
      })

      expect(result[2]).toEqual({
        key: ['projects', projectRef, 'entity-types'],
        exact: false,
      })
    })

    it('should plan broad invalidation when no schema specified', () => {
      const events: InvalidationEvent[] = [
        {
          entityType: 'table',
          entityName: 'users',
          projectRef,
        },
      ]

      const result = planInvalidationsFromEvents(events)

      expect(result).toHaveLength(2)

      expect(result[0]).toEqual({
        key: ['projects', projectRef, 'tables'],
        exact: false,
      })

      // Should invalidate entity types list
      expect(result[1]).toEqual({
        key: ['projects', projectRef, 'entity-types'],
        exact: false,
      })
    })
  })

  describe('function events', () => {
    it('should plan invalidations for function operations', () => {
      const events: InvalidationEvent[] = [
        {
          entityType: 'function',
          schema: 'public',
          entityName: 'calculate_total',
          projectRef,
        },
      ]

      const result = planInvalidationsFromEvents(events)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        key: ['projects', projectRef, 'database-functions'],
        refetchType: 'active',
      })
    })
  })

  describe('cron events', () => {
    it('should plan invalidations for cron operations', () => {
      const events: InvalidationEvent[] = [
        {
          entityType: 'cron',
          entityName: 'schedule',
          projectRef,
        },
      ]

      const result = planInvalidationsFromEvents(events)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        key: ['projects', projectRef, 'cron-jobs'],
        exact: false,
        refetchType: 'active',
      })
    })
  })

  describe('multiple events', () => {
    it('should handle mixed entity types', () => {
      const events: InvalidationEvent[] = [
        {
          entityType: 'table',
          schema: 'public',
          table: 'users',
          entityName: 'users',
          projectRef,
        },
        {
          entityType: 'function',
          schema: 'public',
          entityName: 'calculate_total',
          projectRef,
        },
        {
          entityType: 'cron',
          entityName: 'schedule',
          projectRef,
        },
      ]

      const result = planInvalidationsFromEvents(events)

      // Should have actions for table (4) + function (1) + cron (1) = 6
      expect(result).toHaveLength(6)

      const actionKeys = result.map((action) => action.key[2])
      expect(actionKeys).toContain('tables')
      expect(actionKeys).toContain('entity-types')
      expect(actionKeys).toContain('database-functions')
      expect(actionKeys).toContain('cron-jobs')
    })

    it('should return empty array for no events', () => {
      const result = planInvalidationsFromEvents([])
      expect(result).toEqual([])
    })
  })
})
