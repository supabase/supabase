import { formatTableRowsToSQL } from './TableEntity.utils'

describe('TableEntity.utils: formatTableRowsToSQL', () => {
  it('should format rows into a single SQL INSERT statement', () => {
    const table = 'people'
    const rows = [
      { id: 1, name: 'Person 1' },
      { id: 2, name: 'Person 2' },
      { id: 3, name: 'Person 3' },
    ]

    const result = formatTableRowsToSQL(table, rows)
    const expected =
      "INSERT INTO people (\"id\", \"name\") VALUES ('1', 'Person 1'), ('2', 'Person 2'), ('3', 'Person 3');"

    expect(result).toBe(expected)
  })

  it('should not stringify null values', () => {
    const table = 'people'
    const rows = [
      { id: 1, name: 'Person 1' },
      { id: 2, name: null },
      { id: 3, name: 'Person 3' },
    ]

    const result = formatTableRowsToSQL(table, rows)
    const expected =
      "INSERT INTO people (\"id\", \"name\") VALUES ('1', 'Person 1'), ('2', null), ('3', 'Person 3');"

    expect(result).toBe(expected)
  })

  it('should return an empty string for empty rows', () => {
    const result = formatTableRowsToSQL('people', [])
    expect(result).toBe('')
  })

  it('should remove the idx property', () => {
    const table = 'people'
    const rows = [
      { idx: 0, id: 1, name: 'Person 1' },
      { idx: 1, id: 2, name: 'Person 2' },
    ]

    const result = formatTableRowsToSQL(table, rows)
    const expected =
      "INSERT INTO people (\"id\", \"name\") VALUES ('1', 'Person 1'), ('2', 'Person 2');"

    expect(result).toBe(expected)
  })
})
