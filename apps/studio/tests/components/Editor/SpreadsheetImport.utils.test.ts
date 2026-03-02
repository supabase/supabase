import {
  inferColumnType,
  parseSpreadsheetText,
} from 'components/interfaces/TableGridEditor/SidePanelEditor/SpreadsheetImport/SpreadsheetImport.utils'
import { describe, test, expect } from 'vitest'

describe('SpreadsheedImport.utils: inferColumnType', () => {
  test('should default column type to text if no rows to infer from', () => {
    const mockData: any[] = []
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
    expect(type1).toBe('bool')

    const mockData2 = [{ name: 'bob', height: '161.72', isRetired: 'false' }]
    const type2 = inferColumnType('isRetired', mockData2)
    expect(type2).toBe('bool')
  })
  test('should infer boolean type for a supposed boolean column if one of the rows has a null value', () => {
    const mockData3 = [
      { name: 'bob', height: '161.72', isRetired: 'false' },
      { name: 'bob', height: '161.72', isRetired: 'true' },
      { name: 'bob', height: '161.72', isRetired: null },
    ]
    const type3 = inferColumnType('isRetired', mockData3)
    expect(type3).toBe('bool')
  })
  test('should infer objects as jsonb types correctly', () => {
    const mockData = [{ name: 'bob', metadata: '{}' }]
    const type = inferColumnType('metadata', mockData)
    expect(type).toBe('jsonb')
  })
  test('should infer date type correctly', () => {
    const mockData4 = [
      { event: 'christmas', date: '2022-12-25 17:45:23 UTC' },
      { event: 'christmas', date: '2022-12-25' },
      { event: 'christmas', date: '2022-12-25T12:03:40Z' },
      { event: 'christmas', date: new Date() },
      { event: 'christmas', date: new Date().toISOString() },
      { event: 'christmas', date: 1410715640579 },
      { event: 'christmas', date: '25 Dec 2022' },
      { event: 'christmas', date: 'Dec 25 2022' },
    ]
    const type4 = inferColumnType('date', mockData4)
    expect(type4).toBe('timestamptz')
  })
})

describe('SpreadsheetImport.utils: parseSpreadsheetText', () => {
  test('should keep empty cells as empty strings by default', async () => {
    const csv = `name,age\nJohn,25\nJane,`
    const { rows } = await parseSpreadsheetText(csv)
    expect(rows[1].age).toBe('')
  })

  test('should convert empty cells to null when treatEmptyAsNull is true', async () => {
    const csv = `name,age\nJohn,25\nJane,`
    const { rows } = await parseSpreadsheetText(csv, true)
    expect(rows[1].age).toBeNull()
  })

  test('should not affect non-empty values when treatEmptyAsNull is true', async () => {
    const csv = `name,age\nJohn,25\nJane,`
    const { rows } = await parseSpreadsheetText(csv, true)
    expect(rows[0].name).toBe('John')
    expect(rows[0].age).toBe('25')
  })

  test('should handle multiple empty cells across columns when treatEmptyAsNull is true', async () => {
    const csv = `name,age,city\nJohn,,\nJane,30,`
    const { rows } = await parseSpreadsheetText(csv, true)
    expect(rows[0].age).toBeNull()
    expect(rows[0].city).toBeNull()
    expect(rows[1].age).toBe('30')
    expect(rows[1].city).toBeNull()
  })

  test('should return correct headers regardless of treatEmptyAsNull', async () => {
    const csv = `name,age\nJohn,25`
    const { headers } = await parseSpreadsheetText(csv, true)
    expect(headers).toEqual(['name', 'age'])
  })
})
