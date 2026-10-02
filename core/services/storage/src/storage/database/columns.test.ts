import { SelectColumnPolicy, selectColumns } from './columns'

describe('selectColumns', () => {
  test.each([
    ['id,version,metadata', '"id", "version", "metadata"'],
    [' id, version, , metadata ', '"id", "version", "metadata"'],
    ['', '"id"'],
    [' , ', '"id"'],
    ['*,id', '*, "id"'],
  ])('compiles %j into a quoted SELECT list', (columns, expected) => {
    expect(selectColumns(columns)).toBe(expected)
  })

  test('caches distinct migration-filtered variants of the same column list', () => {
    const columns = 'id,user_metadata,metadata'

    expect(selectColumns(columns)).toBe('"id", "user_metadata", "metadata"')
    expect(selectColumns(columns, SelectColumnPolicy.objectWithoutUserMetadata)).toBe(
      '"id", "metadata"'
    )
    expect(selectColumns(columns, SelectColumnPolicy.multipartWithoutUserOrMultipartMetadata)).toBe(
      '"id"'
    )
    expect(selectColumns(columns)).toBe('"id", "user_metadata", "metadata"')
  })

  test('falls back to id when every requested bucket column is unavailable', () => {
    expect(selectColumns('type', SelectColumnPolicy.bucketWithoutType)).toBe('"id"')
  })

  test('keeps the existing synthetic bucket type at the end of the SELECT list', () => {
    expect(selectColumns('type,id,name', SelectColumnPolicy.syntheticBucket)).toBe(
      '"id", "name", \'STANDARD\' AS "type"'
    )
    expect(selectColumns('type', SelectColumnPolicy.syntheticBucket)).toBe('\'STANDARD\' AS "type"')
    expect(selectColumns('type,', SelectColumnPolicy.syntheticBucket)).toBe(
      '"id", \'STANDARD\' AS "type"'
    )
  })

  test('keeps equal column lists isolated by table and migration state', () => {
    const columns = 'id,user_metadata,metadata'

    expect(selectColumns(columns, SelectColumnPolicy.objectWithoutUserMetadata)).toBe(
      '"id", "metadata"'
    )
    expect(selectColumns(columns, SelectColumnPolicy.multipartWithoutMetadata)).toBe(
      '"id", "user_metadata"'
    )
  })

  test('still rejects invalid PostgreSQL identifiers', () => {
    expect(() => selectColumns('id,metadata->>key')).toThrow(
      'Invalid PostgreSQL identifier: metadata->>key'
    )
  })
})
