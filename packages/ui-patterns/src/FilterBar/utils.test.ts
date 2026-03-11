import * as React from 'react'
import { describe, expect, it } from 'vitest'

import { buildPropertyChangeItems } from './menuItems'
import { FilterGroup, FilterProperty, MenuItem } from './types'
import {
  addFilterToGroup,
  addGroupToGroup,
  buildFilterPlaceholder,
  findConditionByPath,
  findGroupByPath,
  getActionItemLabel,
  groupMenuItemsByOperator,
  isAsyncOptionsFunction,
  isCustomOptionObject,
  isFilterOptionObject,
  isSyncOptionsFunction,
  removeFromGroup,
  resolvePropertyChange,
  truncateText,
  updateNestedLogicalOperator,
  updateNestedOperator,
  updateNestedPropertyName,
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

  describe('updateNestedPropertyName', () => {
    it('updates property name at root path', () => {
      const result = updateNestedPropertyName(sampleFilterGroup, [0], 'email')
      expect(result.conditions[0]).toEqual({
        propertyName: 'email',
        value: 'test',
        operator: '=',
      })
    })

    it('updates property name at nested path', () => {
      const result = updateNestedPropertyName(sampleFilterGroup, [1, 0], 'role')
      const nestedGroup = result.conditions[1] as FilterGroup
      expect(nestedGroup.conditions[0]).toEqual({
        propertyName: 'role',
        value: 'active',
        operator: '=',
      })
    })

    it('updates property name and resets operator and value', () => {
      const result = updateNestedPropertyName(sampleFilterGroup, [0], 'email', '', '')
      expect(result.conditions[0]).toEqual({
        propertyName: 'email',
        value: '',
        operator: '',
      })
    })

    it('updates property name and preserves compatible operator', () => {
      const result = updateNestedPropertyName(sampleFilterGroup, [0], 'email', '=', 'test')
      expect(result.conditions[0]).toEqual({
        propertyName: 'email',
        value: 'test',
        operator: '=',
      })
    })

    it('does not modify other conditions', () => {
      const result = updateNestedPropertyName(sampleFilterGroup, [0], 'email')
      expect(result.conditions[1]).toEqual(sampleFilterGroup.conditions[1])
    })
  })

  describe('resolvePropertyChange', () => {
    const stringProperty: FilterProperty = {
      label: 'Email',
      name: 'email',
      type: 'string',
      operators: [
        { value: '=', label: 'Equals', group: 'comparison' },
        { value: '<>', label: 'Not equal', group: 'comparison' },
        { value: '~~', label: 'Like', group: 'pattern' },
      ],
    }

    const booleanProperty: FilterProperty = {
      label: 'Active',
      name: 'active',
      type: 'boolean',
      options: [
        { label: 'true', value: 'true' },
        { label: 'false', value: 'false' },
      ],
      operators: [
        { value: '=', label: 'Equals', group: 'comparison' },
        { value: '<>', label: 'Not equal', group: 'comparison' },
      ],
    }

    const noOperatorsProperty: FilterProperty = {
      label: 'Raw',
      name: 'raw',
      type: 'string',
    }

    it('preserves compatible operator and free-form value', () => {
      const result = resolvePropertyChange('=', 'hello', stringProperty)
      expect(result).toEqual({ operator: '=', value: 'hello', focusTarget: 'value' })
    })

    it('resets operator when incompatible with new property', () => {
      const result = resolvePropertyChange('in', 'something', stringProperty)
      expect(result).toEqual({ operator: '', value: '', focusTarget: 'operator' })
    })

    it('preserves operator but resets value when fixed options do not match', () => {
      const result = resolvePropertyChange('=', 'hello', booleanProperty)
      expect(result).toEqual({ operator: '=', value: '', focusTarget: 'value' })
    })

    it('preserves operator and value when fixed options match', () => {
      const result = resolvePropertyChange('=', 'true', booleanProperty)
      expect(result).toEqual({ operator: '=', value: 'true', focusTarget: 'value' })
    })

    it('resets everything when current operator is empty', () => {
      const result = resolvePropertyChange('', 'hello', stringProperty)
      expect(result).toEqual({ operator: '', value: '', focusTarget: 'operator' })
    })

    it('resets everything when new property has no operators', () => {
      const result = resolvePropertyChange('=', 'hello', noOperatorsProperty)
      expect(result).toEqual({ operator: '', value: '', focusTarget: 'operator' })
    })

    it('preserves operator with empty value', () => {
      const result = resolvePropertyChange('=', '', stringProperty)
      expect(result).toEqual({ operator: '=', value: '', focusTarget: 'value' })
    })

    it('handles string-based operators (not FilterOperatorObject)', () => {
      const simpleOpProperty: FilterProperty = {
        label: 'Simple',
        name: 'simple',
        type: 'string',
        operators: ['=', '!='],
      }
      const result = resolvePropertyChange('=', 'test', simpleOpProperty)
      expect(result).toEqual({ operator: '=', value: 'test', focusTarget: 'value' })
    })

    it('handles string-based fixed options', () => {
      const stringOptionsProperty: FilterProperty = {
        label: 'Status',
        name: 'status',
        type: 'string',
        options: ['active', 'inactive'],
        operators: ['='],
      }
      const result = resolvePropertyChange('=', 'active', stringOptionsProperty)
      expect(result).toEqual({ operator: '=', value: 'active', focusTarget: 'value' })
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

  describe('truncateText', () => {
    it('returns text unchanged if under max length', () => {
      expect(truncateText('hello', 10)).toBe('hello')
    })

    it('returns text unchanged if exactly max length', () => {
      expect(truncateText('hello', 5)).toBe('hello')
    })

    it('truncates text and adds ellipsis if over max length', () => {
      expect(truncateText('hello world', 5)).toBe('hello...')
    })

    it('handles empty string', () => {
      expect(truncateText('', 10)).toBe('')
    })
  })

  describe('getActionItemLabel', () => {
    it('returns original label for non-action items', () => {
      const item: MenuItem = { value: 'test', label: 'Test Label' }
      expect(getActionItemLabel(item)).toBe('Test Label')
    })

    it('returns original label for action items without input value', () => {
      const item: MenuItem = { value: 'ai', label: 'Filter by AI', isAction: true }
      expect(getActionItemLabel(item)).toBe('Filter by AI')
    })

    it('returns formatted label for action items with input value', () => {
      const item: MenuItem = {
        value: 'ai',
        label: 'Filter by AI',
        isAction: true,
        actionInputValue: 'Find users',
      }
      expect(getActionItemLabel(item)).toBe('Ask AI: "Find users"')
    })

    it('truncates long input values at 30 characters', () => {
      const item: MenuItem = {
        value: 'ai',
        label: 'Filter by AI',
        isAction: true,
        actionInputValue: 'Find all users who registered in the last 30 days',
      }
      expect(getActionItemLabel(item)).toBe('Ask AI: "Find all users who registered ..."')
    })
  })

  describe('buildFilterPlaceholder', () => {
    it('returns default message for empty properties without actions', () => {
      expect(buildFilterPlaceholder([])).toBe('Add filters...')
    })

    it('returns default message with AI mention when actions exist', () => {
      expect(buildFilterPlaceholder([], { hasActions: true })).toBe('Add filters or ask AI...')
    })

    it('shows single property name without actions', () => {
      const props = [{ label: 'Name', name: 'name', type: 'string' as const }]
      expect(buildFilterPlaceholder(props)).toBe('Filter by Name')
    })

    it('shows single property name with AI suffix when actions exist', () => {
      const props = [{ label: 'Name', name: 'name', type: 'string' as const }]
      expect(buildFilterPlaceholder(props, { hasActions: true })).toBe('Filter by Name or ask AI')
    })

    it('shows multiple property names up to max', () => {
      const props = [
        { label: 'Name', name: 'name', type: 'string' as const },
        { label: 'Status', name: 'status', type: 'string' as const },
        { label: 'Created At', name: 'created_at', type: 'date' as const },
      ]
      expect(buildFilterPlaceholder(props)).toBe('Filter by Name, Status, Created At')
    })

    it('truncates with ellipsis when more than max properties', () => {
      const props = [
        { label: 'Name', name: 'name', type: 'string' as const },
        { label: 'Status', name: 'status', type: 'string' as const },
        { label: 'Created At', name: 'created_at', type: 'date' as const },
        { label: 'Updated At', name: 'updated_at', type: 'date' as const },
      ]
      expect(buildFilterPlaceholder(props)).toBe('Filter by Name, Status, Created At...')
    })

    it('truncates with ellipsis and AI suffix when actions exist', () => {
      const props = [
        { label: 'Name', name: 'name', type: 'string' as const },
        { label: 'Status', name: 'status', type: 'string' as const },
        { label: 'Created At', name: 'created_at', type: 'date' as const },
        { label: 'Updated At', name: 'updated_at', type: 'date' as const },
      ]
      expect(buildFilterPlaceholder(props, { hasActions: true })).toBe(
        'Filter by Name, Status, Created At... or ask AI'
      )
    })

    it('respects custom maxProperties parameter', () => {
      const props = [
        { label: 'Name', name: 'name', type: 'string' as const },
        { label: 'Status', name: 'status', type: 'string' as const },
      ]
      expect(buildFilterPlaceholder(props, { maxProperties: 1 })).toBe('Filter by Name...')
    })

    it('does not add ellipsis when properties equal maxProperties', () => {
      const props = [
        { label: 'Name', name: 'name', type: 'string' as const },
        { label: 'Status', name: 'status', type: 'string' as const },
      ]
      expect(buildFilterPlaceholder(props, { maxProperties: 2 })).toBe('Filter by Name, Status')
    })
  })

  describe('buildPropertyChangeItems', () => {
    const testProperties: FilterProperty[] = [
      { label: 'Name', name: 'name', type: 'string' },
      { label: 'Status', name: 'status', type: 'string' },
      { label: 'Count', name: 'count', type: 'number' },
    ]

    it('returns all properties except the current one', () => {
      const items = buildPropertyChangeItems({
        filterProperties: testProperties,
        currentPropertyName: 'name',
        inputValue: '',
      })
      expect(items).toHaveLength(2)
      expect(items.map((i) => i.value)).toEqual(['status', 'count'])
    })

    it('filters by input value', () => {
      const items = buildPropertyChangeItems({
        filterProperties: testProperties,
        currentPropertyName: 'name',
        inputValue: 'sta',
      })
      expect(items).toHaveLength(1)
      expect(items[0].value).toBe('status')
    })

    it('returns empty array when no matches', () => {
      const items = buildPropertyChangeItems({
        filterProperties: testProperties,
        currentPropertyName: 'name',
        inputValue: 'xyz',
      })
      expect(items).toHaveLength(0)
    })

    it('is case insensitive', () => {
      const items = buildPropertyChangeItems({
        filterProperties: testProperties,
        currentPropertyName: 'name',
        inputValue: 'STA',
      })
      expect(items).toHaveLength(1)
      expect(items[0].value).toBe('status')
    })

    it('returns items with label and value', () => {
      const items = buildPropertyChangeItems({
        filterProperties: testProperties,
        currentPropertyName: 'count',
        inputValue: '',
      })
      expect(items[0]).toEqual({ value: 'name', label: 'Name' })
      expect(items[1]).toEqual({ value: 'status', label: 'Status' })
    })
  })
})
