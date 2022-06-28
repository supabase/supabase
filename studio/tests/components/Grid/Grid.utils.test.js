import { formatSortURLParams, formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'

// Sort URL syntax: `column:order`
describe('SupabaseGrid.utils: formatSortURLParams', () => {
  test('should return an array of sort options based on URL params', () => {
    const mockInput = ['id:asc', 'name:desc']
    const output = formatSortURLParams(mockInput)
    expect(output).toStrictEqual([
      {
        column: 'id',
        ascending: true,
      },
      {
        column: 'name',
        ascending: false,
      },
    ])
  })
  test('should reject any malformed sort options based on URL params', () => {
    const mockInput = ['id', 'name:asc', ':asc']
    const output = formatSortURLParams(mockInput)
    expect(output).toStrictEqual([
      {
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
    expect(output[0]).toHaveProperty('id')
    expect(output[0]).toHaveProperty('column', 'id')
    expect(output[0]).toHaveProperty('operator', '>=')
    expect(output[0]).toHaveProperty('value', '20')
    expect(output[1]).toHaveProperty('id')
    expect(output[1]).toHaveProperty('column', 'id')
    expect(output[1]).toHaveProperty('operator', '<=')
    expect(output[1]).toHaveProperty('value', '40')
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
    expect(output[0]).toHaveProperty('column', 'id')
    expect(output[0]).toHaveProperty('operator', '~~*')
    expect(output[0]).toHaveProperty('value', '')
  })
})
