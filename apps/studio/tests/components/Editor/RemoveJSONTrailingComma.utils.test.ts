import { removeJSONTrailingComma } from 'lib/helpers'

describe('removeJSONTrailingComma', () => {
  it('should handle an empty object', () => {
    const jsonString = '{}'
    expect(removeJSONTrailingComma(jsonString)).toEqual(jsonString)
  })

  it('should handle an empty array', () => {
    const jsonString = '[]'
    expect(removeJSONTrailingComma(jsonString)).toEqual(jsonString)
  })

  it('should handle a JSON string without a trailing comma', () => {
    const jsonString = '{"name": "John", "age": 25}'
    expect(removeJSONTrailingComma(jsonString)).toEqual(jsonString)
  })

  it('should remove a trailing comma for JSON object', () => {
    const jsonString = '{"name": "John", "age": 25,}'
    const expectedOutput = '{"name": "John", "age": 25}'
    expect(removeJSONTrailingComma(jsonString)).toEqual(expectedOutput)
  })

  it('should remove a trailing commas in an array of objects', () => {
    const jsonString = '[{"fruit1": "apple","fruit2": "banana",}]'
    const expectedOutput = '[{"fruit1": "apple","fruit2": "banana"}]'
    expect(removeJSONTrailingComma(jsonString)).toEqual(expectedOutput)
  })

  it('should remove all trailing commas in an array of objects', () => {
    const jsonString = '[{"fruit1": "apple","fruit2": "banana",},]'
    const expectedOutput = '[{"fruit1": "apple","fruit2": "banana"}]'
    expect(removeJSONTrailingComma(jsonString)).toEqual(expectedOutput)
  })
})
