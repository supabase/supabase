import { describe, it, expect, beforeEach, vi } from 'vitest'
import type * as Sentry from '@sentry/nextjs'
import {
  MIRRORED_BREADCRUMBS,
  getMirroredBreadcrumbs,
  takeBreadcrumbSnapshot,
  getOwnershipOfBreadcrumbSnapshot,
} from './breadcrumbs'

describe('breadcrumbs', () => {
  beforeEach(() => {
    while (MIRRORED_BREADCRUMBS.length > 0) {
      MIRRORED_BREADCRUMBS.popFront()
    }
    getOwnershipOfBreadcrumbSnapshot()
  })

  describe('getMirroredBreadcrumbs', () => {
    it('should return empty array when no breadcrumbs are added', () => {
      expect(getMirroredBreadcrumbs()).toEqual([])
    })

    it('should return all breadcrumbs that were added', () => {
      const breadcrumb1: Sentry.Breadcrumb = {
        message: 'test1',
        level: 'info',
        timestamp: Date.now() / 1000,
      }
      const breadcrumb2: Sentry.Breadcrumb = {
        message: 'test2',
        level: 'warning',
        timestamp: Date.now() / 1000,
      }

      MIRRORED_BREADCRUMBS.pushBack(breadcrumb1)
      MIRRORED_BREADCRUMBS.pushBack(breadcrumb2)

      const result = getMirroredBreadcrumbs()
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(breadcrumb1)
      expect(result[1]).toEqual(breadcrumb2)
    })
  })

  describe('takeBreadcrumbSnapshot', () => {
    it('should capture current breadcrumbs', () => {
      const breadcrumb: Sentry.Breadcrumb = {
        message: 'test',
        level: 'info',
        timestamp: Date.now() / 1000,
      }

      MIRRORED_BREADCRUMBS.pushBack(breadcrumb)
      takeBreadcrumbSnapshot()

      const snapshot = getOwnershipOfBreadcrumbSnapshot()
      expect(snapshot).toHaveLength(1)
      expect(snapshot?.[0]).toEqual(breadcrumb)
    })

    it('should capture empty array when no breadcrumbs exist', () => {
      takeBreadcrumbSnapshot()

      const snapshot = getOwnershipOfBreadcrumbSnapshot()
      expect(snapshot).toEqual([])
    })

    it('should capture breadcrumbs at the time of snapshot, not after', () => {
      const breadcrumb1: Sentry.Breadcrumb = {
        message: 'test1',
        level: 'info',
        timestamp: Date.now() / 1000,
      }
      const breadcrumb2: Sentry.Breadcrumb = {
        message: 'test2',
        level: 'info',
        timestamp: Date.now() / 1000,
      }

      MIRRORED_BREADCRUMBS.pushBack(breadcrumb1)
      takeBreadcrumbSnapshot()
      MIRRORED_BREADCRUMBS.pushBack(breadcrumb2)

      const snapshot = getOwnershipOfBreadcrumbSnapshot()
      expect(snapshot).toHaveLength(1)
      expect(snapshot?.[0]).toEqual(breadcrumb1)
    })
  })

  describe('getOwnershipOfBreadcrumbSnapshot', () => {
    it('should return the snapshot and clear it', () => {
      const breadcrumb: Sentry.Breadcrumb = {
        message: 'test',
        level: 'info',
        timestamp: Date.now() / 1000,
      }

      MIRRORED_BREADCRUMBS.pushBack(breadcrumb)
      takeBreadcrumbSnapshot()

      const snapshot1 = getOwnershipOfBreadcrumbSnapshot()
      expect(snapshot1).toHaveLength(1)

      const snapshot2 = getOwnershipOfBreadcrumbSnapshot()
      expect(snapshot2).toBeNull()
    })

    it('should return null when no snapshot exists', () => {
      const snapshot = getOwnershipOfBreadcrumbSnapshot()
      expect(snapshot).toBeNull()
    })

    it('should return independent array that can be modified without affecting original', () => {
      const breadcrumb: Sentry.Breadcrumb = {
        message: 'test',
        level: 'info',
        timestamp: Date.now() / 1000,
      }

      MIRRORED_BREADCRUMBS.pushBack(breadcrumb)
      takeBreadcrumbSnapshot()

      const snapshot = getOwnershipOfBreadcrumbSnapshot()
      expect(snapshot).toHaveLength(1)

      if (snapshot) {
        snapshot.push({
          message: 'modified',
          level: 'error',
          timestamp: Date.now() / 1000,
        })

        const result = getMirroredBreadcrumbs()
        expect(result).toHaveLength(1)
        expect(result[0].message).toBe('test')
      }
    })
  })
})

