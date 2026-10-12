import { describe, expect, it } from 'vitest'

import {
  buildOperatorItems,
  buildPropertyChangeItems,
  buildPropertyItems,
  buildValueItems,
} from './menuItems'
import { FilterGroup, FilterProperty } from './types'

const stringProperty: FilterProperty = {
  label: 'Name',
  name: 'name',
  type: 'string',
  options: [
    { label: 'Alice', value: 'alice' },
    { label: 'Bob', value: 'bob' },
  ],
  operators: [
    { value: '=', label: 'Equals', group: 'comparison' as const },
    { value: 'is', label: 'Is', group: 'setNull' as const },
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
    { value: '=', label: 'Equals', group: 'comparison' as const },
    { value: 'is', label: 'Is', group: 'setNull' as const },
  ],
}

const pathProperty: FilterProperty = {
  label: 'Pathname',
  name: 'pathname',
  type: 'string',
  options: [
    { label: '/auth/v1/health', value: '/auth/v1/health' },
    { label: '/rest-admin/v1/ready', value: '/rest-admin/v1/ready' },
  ],
  operators: [
    { value: '=', label: 'Equals', group: 'comparison' as const },
    { value: '~~*', label: 'iLike', group: 'pattern' as const },
    { value: '!~~*', label: 'Not iLike', group: 'pattern' as const },
  ],
}

const filterProperties: FilterProperty[] = [stringProperty, booleanProperty, pathProperty]

describe('consumer-controlled property availability', () => {
  it.each([true, false, undefined])(
    'respects isAvailable=%s in add and change menus',
    (isAvailable) => {
      const timeRange: FilterProperty = {
        label: 'Time range',
        name: 'date',
        type: 'date',
        isAvailable,
      }
      const params = { filterProperties: [...filterProperties, timeRange], inputValue: '' }
      const addItems = buildPropertyItems(params)
      const changeItems = buildPropertyChangeItems({ ...params, currentPropertyName: 'name' })
      expect(addItems.some((item) => item.value === 'date')).toBe(isAvailable !== false)
      expect(changeItems.some((item) => item.value === 'date')).toBe(isAvailable !== false)
      expect(addItems.some((item) => item.value === 'name')).toBe(true)
      const searchItems = buildPropertyItems({
        ...params,
        inputValue: 'range',
        freeformDefaultProperty: timeRange,
      })
      expect(searchItems.some((item) => item.isFreeformSearch)).toBe(isAvailable !== false)
    }
  )
})

describe('buildOperatorItems', () => {
  it('returns matching operators for operator draft text', () => {
    const filters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'name', operator: '', value: '' }],
    }

    const items = buildOperatorItems(
      { type: 'operator', path: [0] },
      filters,
      filterProperties,
      true,
      'is'
    )

    expect(items).toEqual([{ value: 'is', label: 'Is', group: 'setNull', operatorSymbol: 'is' }])
  })

  it('adds an equals fallback when operator draft does not match', () => {
    const filters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'name', operator: '', value: '' }],
    }

    const items = buildOperatorItems(
      { type: 'operator', path: [0] },
      filters,
      filterProperties,
      true,
      'abc'
    )

    expect(items).toEqual([
      {
        value: '=',
        label: 'Equals: "abc"',
        operatorSymbol: '=',
        isDefaultOperator: true,
        defaultValue: 'abc',
      },
    ])
  })
})

describe('buildValueItems', () => {
  it('returns NULL and NOT NULL options when IS operator is selected', () => {
    const filters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'name', operator: 'is', value: '' }],
    }

    const items = buildValueItems(
      { type: 'value', path: [0] },
      filters,
      filterProperties,
      {},
      {},
      '',
      false
    )

    expect(items).toEqual([
      { value: 'null', label: 'NULL' },
      { value: 'not null', label: 'NOT NULL' },
    ])
  })

  it('includes TRUE and FALSE options for boolean properties with IS operator', () => {
    const filters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'active', operator: 'is', value: '' }],
    }

    const items = buildValueItems(
      { type: 'value', path: [0] },
      filters,
      filterProperties,
      {},
      {},
      '',
      false
    )

    expect(items).toEqual([
      { value: 'null', label: 'NULL' },
      { value: 'not null', label: 'NOT NULL' },
      { value: 'true', label: 'TRUE' },
      { value: 'false', label: 'FALSE' },
    ])
  })

  it('returns normal property options for non-IS operators', () => {
    const filters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'name', operator: '=', value: '' }],
    }

    const items = buildValueItems(
      { type: 'value', path: [0] },
      filters,
      filterProperties,
      {},
      {},
      '',
      false
    )

    expect(items).toEqual([
      { value: 'alice', label: 'Alice' },
      { value: 'bob', label: 'Bob' },
    ])
  })

  it('disables options already used by another condition on the same property', () => {
    const filters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [
        { propertyName: 'name', operator: '=', value: 'alice' },
        { propertyName: 'name', operator: '=', value: '' },
      ],
    }

    const items = buildValueItems(
      { type: 'value', path: [1] },
      filters,
      filterProperties,
      {},
      {},
      '',
      false
    )

    expect(items).toEqual([
      { value: 'alice', label: 'Alice', disabled: true },
      { value: 'bob', label: 'Bob' },
    ])
  })

  it.each(['~~*', '!~~*'])(
    'suppresses value suggestions for pattern-group operator `%s`',
    (operator) => {
      const filters: FilterGroup = {
        logicalOperator: 'AND',
        conditions: [{ propertyName: 'pathname', operator, value: '' }],
      }

      const items = buildValueItems(
        { type: 'value', path: [0] },
        filters,
        filterProperties,
        {},
        {},
        '',
        false
      )

      expect(items).toEqual([])
    }
  )

  it('still returns options for pathname with a comparison-group operator', () => {
    const filters: FilterGroup = {
      logicalOperator: 'AND',
      conditions: [{ propertyName: 'pathname', operator: '=', value: '' }],
    }

    const items = buildValueItems(
      { type: 'value', path: [0] },
      filters,
      filterProperties,
      {},
      {},
      '',
      false
    )

    expect(items).toEqual([
      { value: '/auth/v1/health', label: '/auth/v1/health' },
      { value: '/rest-admin/v1/ready', label: '/rest-admin/v1/ready' },
    ])
  })
})

describe('buildPropertyItems', () => {
  const properties: FilterProperty[] = [
    { label: 'Name', name: 'name', type: 'string', operators: ['='] },
    { label: 'Status', name: 'status', type: 'string', operators: ['='] },
  ]

  it('returns property items matching the input', () => {
    const items = buildPropertyItems({
      filterProperties: properties,
      inputValue: 'nam',
    })

    expect(items).toEqual([{ value: 'name', label: 'Name' }])
  })

  it('uses a sentinel value for the "New Group" action when supportsOperators is true', () => {
    const items = buildPropertyItems({
      filterProperties: properties,
      inputValue: '',
      supportsOperators: true,
    })

    const groupItem = items.find((item) => item.label === 'New Group')
    expect(groupItem).toBeDefined()
    expect(groupItem?.value).toBe('__new_group__')
  })

  it('does not include "New Group" when supportsOperators is false', () => {
    const items = buildPropertyItems({
      filterProperties: properties,
      inputValue: '',
      supportsOperators: false,
    })

    expect(items.find((item) => item.label === 'New Group')).toBeUndefined()
  })

  it('does not collide with a property named "group"', () => {
    const propertiesWithGroup: FilterProperty[] = [
      { label: 'group', name: 'group', type: 'string', operators: ['='] },
      { label: 'Name', name: 'name', type: 'string', operators: ['='] },
    ]

    const items = buildPropertyItems({
      filterProperties: propertiesWithGroup,
      inputValue: '',
      supportsOperators: true,
    })

    const groupPropertyItem = items.find((item) => item.label === 'group')
    const newGroupItem = items.find((item) => item.label === 'New Group')

    expect(groupPropertyItem).toBeDefined()
    expect(groupPropertyItem?.value).toBe('group')
    expect(newGroupItem).toBeDefined()
    expect(newGroupItem?.value).toBe('__new_group__')
    expect(groupPropertyItem?.value).not.toBe(newGroupItem?.value)
  })
})
