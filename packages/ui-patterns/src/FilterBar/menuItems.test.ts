import { describe, expect, it } from 'vitest'

import { buildOperatorItems, buildValueItems } from './menuItems'
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

const filterProperties: FilterProperty[] = [stringProperty, booleanProperty]

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
})
