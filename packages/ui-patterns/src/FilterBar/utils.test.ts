import * as React from 'react'
import { describe, expect, it } from 'vitest'

import { FilterGroup, FilterProperty } from './types'
import {
  addFilterToGroup,
  addGroupToGroup,
  findConditionByPath,
  findGroupByPath,
  isAsyncOptionsFunction,
  isCustomOptionObject,
  isFilterOptionObject,
  isSyncOptionsFunction,
  removeFromGroup,
  updateNestedLogicalOperator,
  updateNestedOperator,
  updateNestedValue,
} from './utils'

const mockProperty: FilterProperty = {
  label: 'Test Property',
  name: 'test',
  type: 'string',
  operators: ['=', '!='],
}

const sampleFilterGroup: FilterGroup = {
  logicalOperator: 'AND',
  conditions: [
    {
      propertyName: 'name',
      value: 'test',
      operator: '=',
    },
    {
      logicalOperator: 'OR',
      conditions: [
        {
          propertyName: 'status',
          value: 'active',
          operator: '=',
        },
      ],
    },
  ],
}

describe('FilterBar Utils', () => {
  describe('findGroupByPath', () => {
    it('returns root group for empty path', () => {
      const result = findGroupByPath(sampleFilterGroup, [])
      expect(result).toBe(sampleFilterGroup)
    })

    it('finds nested group by path', () => {
      const result = findGroupByPath(sampleFilterGroup, [1])
      expect(result).toEqual({
        logicalOperator: 'OR',
        conditions: [
          {
            propertyName: 'status',
            value: 'active',
            operator: '=',
          },
        ],
      })
    })

    it('returns null for invalid path', () => {
      const result = findGroupByPath(sampleFilterGroup, [5])
      expect(result).toBeNull()
    })

    it('returns null when path points to condition not group', () => {
      const result = findGroupByPath(sampleFilterGroup, [0])
      expect(result).toBeNull()
    })
  })

  describe('findConditionByPath', () => {
    it('finds condition at path', () => {
      const result = findConditionByPath(sampleFilterGroup, [0])
      expect(result).toEqual({
        propertyName: 'name',
        value: 'test',
        operator: '=',
      })
    })

    it('finds nested condition', () => {
      const result = findConditionByPath(sampleFilterGroup, [1, 0])
      expect(result).toEqual({
        propertyName: 'status',
        value: 'active',
        operator: '=',
      })
    })

    it('returns null for group path', () => {
      const result = findConditionByPath(sampleFilterGroup, [1])
      expect(result).toBeNull()
    })
  })

  describe('addFilterToGroup', () => {
    it('adds filter to root group', () => {
      const result = addFilterToGroup(sampleFilterGroup, [], mockProperty)
      expect(result.conditions).toHaveLength(3)
      expect(result.conditions[2]).toEqual({
        propertyName: 'test',
        value: '',
        operator: '',
      })
    })

    it('adds filter to nested group', () => {
      const result = addFilterToGroup(sampleFilterGroup, [1], mockProperty)
      const nestedGroup = result.conditions[1] as FilterGroup
      expect(nestedGroup.conditions).toHaveLength(2)
    })
  })

  describe('addGroupToGroup', () => {
    it('adds group to root', () => {
      const result = addGroupToGroup(sampleFilterGroup, [])
      expect(result.conditions).toHaveLength(3)
      expect(result.conditions[2]).toEqual({
        logicalOperator: 'AND',
        conditions: [],
      })
    })
  })

  describe('removeFromGroup', () => {
    it('removes condition from root group', () => {
      const result = removeFromGroup(sampleFilterGroup, [0])
      expect(result.conditions).toHaveLength(1)
      expect(result.conditions[0]).toEqual(sampleFilterGroup.conditions[1])
    })

    it('removes nested condition', () => {
      const result = removeFromGroup(sampleFilterGroup, [1, 0])
      const nestedGroup = result.conditions[1] as FilterGroup
      expect(nestedGroup.conditions).toHaveLength(0)
    })
  })

  describe('updateNestedValue', () => {
    it('updates value at path', () => {
      const result = updateNestedValue(sampleFilterGroup, [0], 'new value')
      expect(result.conditions[0]).toEqual({
        propertyName: 'name',
        value: 'new value',
        operator: '=',
      })
    })

    it('updates nested value', () => {
      const result = updateNestedValue(sampleFilterGroup, [1, 0], 'inactive')
      const nestedGroup = result.conditions[1] as FilterGroup
      expect(nestedGroup.conditions[0]).toEqual({
        propertyName: 'status',
        value: 'inactive',
        operator: '=',
      })
    })
  })

  describe('updateNestedOperator', () => {
    it('updates operator at path', () => {
      const result = updateNestedOperator(sampleFilterGroup, [0], '!=')
      expect(result.conditions[0]).toEqual({
        propertyName: 'name',
        value: 'test',
        operator: '!=',
      })
    })
  })

  describe('updateNestedLogicalOperator', () => {
    it('toggles root logical operator', () => {
      const result = updateNestedLogicalOperator(sampleFilterGroup, [])
      expect(result.logicalOperator).toBe('OR')
    })

    it('toggles nested logical operator', () => {
      const result = updateNestedLogicalOperator(sampleFilterGroup, [1])
      const nestedGroup = result.conditions[1] as FilterGroup
      expect(nestedGroup.logicalOperator).toBe('AND')
    })
  })

  describe('Type guards', () => {
    it('identifies custom option objects', () => {
      const customOption = { component: () => React.createElement('div', {}, 'test') }
      expect(isCustomOptionObject(customOption)).toBe(true)
      expect(isCustomOptionObject('string')).toBe(false)
      expect(isCustomOptionObject({ value: 'test', label: 'Test' })).toBe(false)
    })

    it('identifies filter option objects', () => {
      const filterOption = { value: 'test', label: 'Test' }
      expect(isFilterOptionObject(filterOption)).toBe(true)
      expect(isFilterOptionObject('string')).toBe(false)
      expect(
        isFilterOptionObject({ component: () => React.createElement('div', {}, 'test') })
      ).toBe(false)
    })

    it('identifies async functions', () => {
      const asyncFn = async () => ['test']
      const syncFn = () => ['test']
      const array = ['test']

      expect(isAsyncOptionsFunction(asyncFn)).toBe(true)
      expect(isAsyncOptionsFunction(syncFn)).toBe(false) // Should be false for sync functions when properly detected
      expect(isAsyncOptionsFunction(array)).toBe(false)
    })

    it('identifies sync functions', () => {
      const syncFn = () => ['test']
      const asyncFn = async () => ['test']
      const array = ['test']

      expect(isSyncOptionsFunction(syncFn)).toBe(true)
      expect(isSyncOptionsFunction(asyncFn)).toBe(true) // Both are functions
      expect(isSyncOptionsFunction(array)).toBe(false)
    })
  })
})
