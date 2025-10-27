import { formatFilterURLParams, formatSortURLParams } from 'components/grid/SupabaseGrid.utils'
import { describe, test, expect } from 'vitest'

// Sort URL syntax: `column:order`
describe('SupabaseGrid.utils: formatSortURLParams', () => {
  test('should return an array of sort options based on URL params', () => {
    const mockInput = ['id:asc', 'name:desc']
    const output = formatSortURLParams('fakeTable', mockInput)
    expect(output).toStrictEqual([
      { table: 'fakeTable', column: 'id', ascending: true },
      { table: 'fakeTable', column: 'name', ascending: false },
    ])
  })
  test('should reject any malformed sort options based on URL params', () => {
    const mockInput = ['id', 'name:asc', ':asc']
    const output = formatSortURLParams('fakeTable', mockInput)
    expect(output).toStrictEqual([
      {
        table: 'fakeTable',
        column: 'name',
        ascending: true,
      },
    ])
  })
})

// Filter URL syntax: `column:operatorAbbreviation:value`
describe('SupabaseGrid.utils: formatFilterURLParams', () => {
  test('should return an array of filter options based on URL params', () => {
    const mockInput = ['id:gte:20', 'id:lte:40']
    const output = formatFilterURLParams(mockInput)
    expect(output).toHaveLength(2)
    expect(output[0]).toStrictEqual({
      column: 'id',
      operator: '>=',
      value: '20',
    })
    expect(output[1]).toStrictEqual({
      column: 'id',
      operator: '<=',
      value: '40',
    })
  })
  test('should format filters for timestamps correctly', () => {
    const mockInput = ['created_at:gte:2022-05-30 03:00:00']
    const output = formatFilterURLParams(mockInput)
    expect(output[0]).toStrictEqual({
      column: 'created_at',
      operator: '>=',
      value: '2022-05-30 03:00:00',
    })
  })
  test('should reject any malformed filter options based on URL params', () => {
    const mockInput = ['id', ':gte', ':50', 'id:eq:10']
    const output = formatFilterURLParams(mockInput)
    expect(output).toHaveLength(1)
  })
  test('should reject any filter options with unrecognized operator', () => {
    const mockInput = ['id:meme:40', 'name:eq:town']
    const output = formatFilterURLParams(mockInput)
    expect(output).toHaveLength(1)
  })
  test('should allow filter options to have empty value based on URL params', () => {
    const mockInput = ['id:ilike:']
    const output = formatFilterURLParams(mockInput)
    expect(output).toHaveLength(1)
    expect(output[0]).toStrictEqual({
      column: 'id',
      operator: '~~*',
      value: '',
    })
  })
})
