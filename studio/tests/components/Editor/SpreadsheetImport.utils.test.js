import { inferColumnType } from 'components/interfaces/TableGridEditor/SidePanelEditor/TableEditor/SpreadsheetImport/SpreadsheetImport.utils'

describe('SpreadsheedImport.utils: inferColumnType', () => {
  test('should default column type to text if no rows to infer from', () => {
    const mockData = []
    const type = inferColumnType('id', mockData)
    expect(type).toBe('text')
  })
  test('should default column type to text if the first row has no data to infer from', () => {
    const mockData = [{ name: 'bob', age: '42' }]
    const type = inferColumnType('id', mockData)
    expect(type).toBe('text')
  })
  test('should default column type to text if the first row data value is null', () => {
    const mockData = [{ id: 'null', name: 'bob', age: '42' }]
    const type = inferColumnType('id', mockData)
    expect(type).toBe('text')
  })
  test('should infer integer types correctly', () => {
    const mockData = [{ name: 'bob', age: '42' }]
    const type = inferColumnType('age', mockData)
    expect(type).toBe('int8')
  })
  test('should infer float types correctly', () => {
    const mockData = [{ name: 'bob', height: '161.72' }]
    const type = inferColumnType('height', mockData)
    expect(type).toBe('float8')
  })
  test('should infer boolean types correctly', () => {
    const mockData1 = [{ name: 'bob', height: '161.72', isWorking: 'true' }]
    const type1 = inferColumnType('isWorking', mockData1)
    expect(type1).toBe('boolean')

    const mockData2 = [{ name: 'bob', height: '161.72', isRetired: 'false' }]
    const type2 = inferColumnType('isRetired', mockData2)
    expect(type2).toBe('boolean')
  })
  test('should infer objects as jsonb types correctly', () => {
    const mockData = [{ name: 'bob', metadata: '{}' }]
    const type = inferColumnType('metadata', mockData)
    expect(type).toBe('jsonb')
  })
})
