import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getMirroredBreadcrumbs,
  getOwnershipOfBreadcrumbSnapshot,
  MIRRORED_BREADCRUMBS,
  takeBreadcrumbSnapshot,
} from './breadcrumbs'

describe('breadcrumbs', () => {
  beforeEach(() => {
    // Clear the ring buffer by popping all items
    while (MIRRORED_BREADCRUMBS.length > 0) {
      MIRRORED_BREADCRUMBS.popFront()
    }
  })

  describe('getMirroredBreadcrumbs', () => {
    it('should return an array of breadcrumbs from the ring buffer', () => {
      const result = getMirroredBreadcrumbs()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array when no breadcrumbs exist', () => {
      const result = getMirroredBreadcrumbs()
      expect(result).toHaveLength(0)
    })

    it('should return breadcrumbs after they are added to ring buffer', () => {
      const mockBreadcrumb = { message: 'test', timestamp: Date.now() } as any
      MIRRORED_BREADCRUMBS.pushBack(mockBreadcrumb)

      const result = getMirroredBreadcrumbs()
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockBreadcrumb)
    })
  })

  describe('takeBreadcrumbSnapshot', () => {
    it('should capture current breadcrumbs into a snapshot', () => {
      const mockBreadcrumb = { message: 'test', timestamp: Date.now() } as any
      MIRRORED_BREADCRUMBS.pushBack(mockBreadcrumb)

      takeBreadcrumbSnapshot()
      const snapshot = getOwnershipOfBreadcrumbSnapshot()

      expect(snapshot).toHaveLength(1)
      expect(snapshot?.[0]).toEqual(mockBreadcrumb)
    })

    it('should update snapshot when called multiple times', () => {
      const mockBreadcrumb1 = { message: 'first', timestamp: Date.now() } as any
      const mockBreadcrumb2 = { message: 'second', timestamp: Date.now() } as any

      MIRRORED_BREADCRUMBS.pushBack(mockBreadcrumb1)
      takeBreadcrumbSnapshot()

      MIRRORED_BREADCRUMBS.pushBack(mockBreadcrumb2)
      takeBreadcrumbSnapshot()

      const snapshot = getOwnershipOfBreadcrumbSnapshot()
      expect(snapshot).toHaveLength(2)
    })
  })

  describe('getOwnershipOfBreadcrumbSnapshot', () => {
    it('should return null initially when no snapshot has been taken', () => {
      const snapshot = getOwnershipOfBreadcrumbSnapshot()
      expect(snapshot).toBeNull()
    })

    it('should return the snapshot after takeBreadcrumbSnapshot is called', () => {
      const mockBreadcrumb = { message: 'test', timestamp: Date.now() } as any
      MIRRORED_BREADCRUMBS.pushBack(mockBreadcrumb)

      takeBreadcrumbSnapshot()
      const snapshot = getOwnershipOfBreadcrumbSnapshot()

      expect(snapshot).not.toBeNull()
      expect(snapshot).toHaveLength(1)
    })

    it('should clear the snapshot after returning it', () => {
      const mockBreadcrumb = { message: 'test', timestamp: Date.now() } as any
      MIRRORED_BREADCRUMBS.pushBack(mockBreadcrumb)

      takeBreadcrumbSnapshot()
      const firstSnapshot = getOwnershipOfBreadcrumbSnapshot()
      const secondSnapshot = getOwnershipOfBreadcrumbSnapshot()

      expect(firstSnapshot).not.toBeNull()
      expect(secondSnapshot).toBeNull()
    })

    it('should take ownership and prevent subsequent calls from getting the same snapshot', () => {
      takeBreadcrumbSnapshot()

      const snapshot1 = getOwnershipOfBreadcrumbSnapshot()
      const snapshot2 = getOwnershipOfBreadcrumbSnapshot()

      expect(snapshot1).not.toBe(snapshot2)
      expect(snapshot2).toBeNull()
    })
  })
})
