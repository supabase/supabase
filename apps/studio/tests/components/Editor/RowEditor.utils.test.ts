import { RowField } from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.types'
import {
  generateRowObjectFromFields,
  parseValue,
} from 'components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/RowEditor.utils'
import { describe, expect, it, vi } from 'vitest'

describe('parseValue', () => {
  it('should return null when originalValue is null', () => {
    const originalValue = null
    const format = 'some format'
    expect(parseValue(originalValue, format)).toBeNull()
  })

  it('should return originalValue when it is 0', () => {
    const originalValue = 0
    const format = 'some format'
    expect(parseValue(originalValue, format)).toEqual(originalValue)
  })

  it('should return originalValue when it is an empty string', () => {
    const originalValue = ''
    const format = 'some format'
    expect(parseValue(originalValue, format)).toEqual(originalValue)
  })

  it('should return originalValue when it is a number and format is not provided', () => {
    const originalValue = 42
    const format = ''
    expect(parseValue(originalValue, format)).toEqual(originalValue)
  })

  it('should return JSON string representation when originalValue is an empty array', () => {
    const originalValue: any[] = []
    const format = 'some format'
    const expectedValue = JSON.stringify(originalValue)
    expect(parseValue(originalValue, format)).toEqual(expectedValue)
  })

  it('should return JSON string representation when originalValue is an empty object', () => {
    const originalValue = {}
    const format = 'some format'
    const expectedValue = JSON.stringify(originalValue)
    expect(parseValue(originalValue, format)).toEqual(expectedValue)
  })

  it('should return JSON string representation when originalValue is an object', () => {
    const originalValue = { key: 'value' }
    const format = 'some format'
    expect(parseValue(originalValue, format)).toEqual(JSON.stringify(originalValue))
  })

  it('should handle complex nested object with titles correctly', () => {
    const originalValue = {
      glossary: {
        title: 'parent title',
        subItem: {
          title: 'subItem title',
          items: ['item1', 'item2'],
        },
      },
    }
    const format = 'some format'
    const expectedValue = JSON.stringify(originalValue)
    expect(parseValue(originalValue, format)).toEqual(expectedValue)
  })

  it('should handle object with all values set to 0 correctly', () => {
    const originalValue = {
      width: 0,
      height: 0,
      length: 0,
      weight: 0,
    }
    const format = 'some format'
    const expectedValue = JSON.stringify(originalValue)
    expect(parseValue(originalValue, format)).toEqual(expectedValue)
  })
  it('should return string representation of originalValue when it is a boolean', () => {
    const originalValue = true
    const format = 'some format'
    expect(parseValue(originalValue, format)).toEqual(originalValue.toString())
  })

  it('should return originalValue for other cases', () => {
    const originalValue = 'some value'
    const format = 'some format'
    expect(parseValue(originalValue, format)).toEqual(originalValue)
  })

  it('should return originalValue even when an error occurs', () => {
    const originalValue = 'some value'
    const format = 'some format'
    // Mocking an error occurring during parsing
    JSON.stringify = vi.fn(() => {
      throw new Error('Mocked error')
    })
    expect(parseValue(originalValue, format)).toEqual(originalValue)
  })
})

describe('generateRowObjectFromFields', () => {
  it('should not force NULL values', () => {
    const sampleRowFields: RowField[] = [
      {
        id: '1',
        name: 'id',
        value: '',
        comment: '',
        defaultValue: null,
        format: 'int8',
        enums: [],
        isNullable: false,
        isIdentity: false,
        isPrimaryKey: false,
      },
      {
        id: '2',
        name: 'time_not_null',
        value: '',
        comment: '',
        defaultValue: 'now()',
        format: 'timestamptz',
        isNullable: false,
        enums: [],
        isIdentity: false,
        isPrimaryKey: false,
      },
      {
        id: '3',
        name: 'time_nullable',
        value: '',
        comment: '',
        defaultValue: 'now()',
        format: 'timestamptz',
        isNullable: true,
        enums: [],
        isIdentity: false,
        isPrimaryKey: false,
      },
    ]
    const result = generateRowObjectFromFields(sampleRowFields)
    expect(result).toEqual({})
  })
  it('should discern EMPTY values for text', () => {
    const sampleRowFields: RowField[] = [
      {
        id: '1',
        name: 'id',
        value: '',
        comment: '',
        defaultValue: null,
        format: 'int8',
        enums: [],
        isNullable: false,
        isIdentity: false,
        isPrimaryKey: false,
      },
      {
        id: '2',
        name: 'name',
        value: '',
        comment: '',
        defaultValue: null,
        format: 'text',
        enums: [],
        isNullable: false,
        isIdentity: false,
        isPrimaryKey: false,
      },
    ]
    const result = generateRowObjectFromFields(sampleRowFields)
    expect(result).toEqual({ name: '' })
  })
  it('should discern NULL values for text', () => {
    const sampleRowFields: RowField[] = [
      {
        id: '1',
        name: 'id',
        value: '',
        comment: '',
        defaultValue: null,
        format: 'int8',
        enums: [],
        isNullable: false,
        isIdentity: false,
        isPrimaryKey: false,
      },
      {
        id: '2',
        name: 'name',
        value: null,
        comment: '',
        defaultValue: null,
        format: 'text',
        enums: [],
        isNullable: false,
        isIdentity: false,
        isPrimaryKey: false,
      },
    ]
    const result = generateRowObjectFromFields(sampleRowFields)
    expect(result).toEqual({})
  })
  it('should discern NULL values for booleans', () => {
    const sampleRowFields: RowField[] = [
      {
        id: '1',
        name: 'id',
        value: '',
        comment: '',
        defaultValue: null,
        format: 'int8',
        enums: [],
        isNullable: false,
        isIdentity: false,
        isPrimaryKey: false,
      },
      {
        id: '2',
        name: 'bool-test',
        value: null,
        comment: '',
        defaultValue: null,
        format: 'bool',
        enums: [],
        isNullable: false,
        isIdentity: false,
        isPrimaryKey: false,
      },
    ]
    const result = generateRowObjectFromFields(sampleRowFields)
    expect(result).toEqual({})
  })
})
