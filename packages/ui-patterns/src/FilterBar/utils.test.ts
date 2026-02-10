import * as React from 'react'
import { describe, expect, it } from 'vitest'

import { FilterGroup, FilterProperty, MenuItem } from './types'
import {
  addFilterToGroup,
  addGroupToGroup,
  findConditionByPath,
  findGroupByPath,
  groupMenuItemsByOperator,
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

  describe('groupMenuItemsByOperator', () => {
    it('returns empty array for empty input', () => {
      expect(groupMenuItemsByOperator([])).toEqual([])
    })

    it('groups items by their group property', () => {
      const items: MenuItem[] = [
        { value: '=', label: 'Equals', group: 'comparison' },
        { value: '~~', label: 'Like', group: 'pattern' },
        { value: '<>', label: 'Not equal', group: 'comparison' },
      ]
      const result = groupMenuItemsByOperator(items)

      expect(result).toHaveLength(2)
      expect(result[0].group).toBe('comparison')
      expect(result[0].items).toHaveLength(2)
      expect(result[1].group).toBe('pattern')
      expect(result[1].items).toHaveLength(1)
    })

    it('maintains original indices for keyboard navigation', () => {
      const items: MenuItem[] = [
        { value: '=', label: 'Equals', group: 'comparison' },
        { value: '~~', label: 'Like', group: 'pattern' },
      ]
      const result = groupMenuItemsByOperator(items)

      expect(result[0].items[0].index).toBe(0)
      expect(result[1].items[0].index).toBe(1)
    })

    it('respects GROUP_ORDER for group ordering', () => {
      const items: MenuItem[] = [
        { value: 'in', label: 'In list', group: 'setNull' },
        { value: '~~', label: 'Like', group: 'pattern' },
        { value: '=', label: 'Equals', group: 'comparison' },
      ]
      const result = groupMenuItemsByOperator(items)

      expect(result[0].group).toBe('comparison')
      expect(result[1].group).toBe('pattern')
      expect(result[2].group).toBe('setNull')
    })

    it('places uncategorized items at the end', () => {
      const items: MenuItem[] = [
        { value: 'custom', label: 'Custom', group: 'uncategorized' },
        { value: '=', label: 'Equals', group: 'comparison' },
      ]
      const result = groupMenuItemsByOperator(items)

      expect(result).toHaveLength(2)
      expect(result[0].group).toBe('comparison')
      expect(result[1].group).toBe('uncategorized')
    })

    it('treats items without a group as uncategorized', () => {
      const items: MenuItem[] = [
        { value: 'custom', label: 'Custom' },
        { value: '=', label: 'Equals', group: 'comparison' },
      ]
      const result = groupMenuItemsByOperator(items)

      expect(result).toHaveLength(2)
      expect(result[0].group).toBe('comparison')
      expect(result[1].group).toBe('uncategorized')
      expect(result[1].items[0].item.value).toBe('custom')
    })

    it('handles single group scenario', () => {
      const items: MenuItem[] = [
        { value: '=', label: 'Equals', group: 'comparison' },
        { value: '<>', label: 'Not equal', group: 'comparison' },
      ]
      const result = groupMenuItemsByOperator(items)

      expect(result).toHaveLength(1)
      expect(result[0].group).toBe('comparison')
      expect(result[0].items).toHaveLength(2)
    })

    it('preserves item order within groups', () => {
      const items: MenuItem[] = [
        { value: '=', label: 'Equals', group: 'comparison' },
        { value: '<>', label: 'Not equal', group: 'comparison' },
        { value: '>', label: 'Greater than', group: 'comparison' },
      ]
      const result = groupMenuItemsByOperator(items)

      expect(result[0].items[0].item.value).toBe('=')
      expect(result[0].items[1].item.value).toBe('<>')
      expect(result[0].items[2].item.value).toBe('>')
    })

    it('handles all items being uncategorized', () => {
      const items: MenuItem[] = [
        { value: 'a', label: 'A', group: 'uncategorized' },
        { value: 'b', label: 'B', group: 'uncategorized' },
      ]
      const result = groupMenuItemsByOperator(items)

      expect(result).toHaveLength(1)
      expect(result[0].group).toBe('uncategorized')
      expect(result[0].items).toHaveLength(2)
    })
  })
})
