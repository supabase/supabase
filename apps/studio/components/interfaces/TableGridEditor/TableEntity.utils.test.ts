import { formatTableRowsToSQL } from './TableEntity.utils'

describe('TableEntity.utils: formatTableRowsToSQL', () => {
  test('should format multiple rows into a single SQL statement', () => {
    const table = 'test'
    const rows = [
      { id: 1, name: 'Person 1' },
      { id: 2, name: 'Person 2' },
      { id: 3, name: 'Person 3' },
    ]
    const statement = formatTableRowsToSQL(table, rows)
    expect(statement).toStrictEqual(
      `INSERT INTO test ("id", "name") VALUES (1, 'Person 1'), (2, 'Person 2'), (3, 'Person 3');`
    )
  })
})
