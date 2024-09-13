import { checkForWithClause } from 'components/interfaces/Settings/Logs/Logs.utils'

describe('checkForWithClause', () => {
  test('basic queries', () => {
    expect(checkForWithClause('SELECT * FROM table')).toBe(false)
    expect(checkForWithClause('SELECT * FROM table WITH clause')).toBe(true)
    expect(checkForWithClause('WITH test AS (SELECT * FROM table) SELECT * FROM test')).toBe(true)
    expect(checkForWithClause('SELECT * FROM withsomething')).toBe(false)
  })

  test('case sensitivity', () => {
    expect(checkForWithClause('with test AS (SELECT * FROM table) SELECT * FROM test')).toBe(true)
    expect(checkForWithClause('WiTh test AS (SELECT * FROM table) SELECT * FROM test')).toBe(true)
  })

  test('comments', () => {
    expect(checkForWithClause('SELECT * FROM table -- WITH clause')).toBe(false)
    expect(checkForWithClause('SELECT * FROM table /* WITH clause */')).toBe(false)
    expect(checkForWithClause('-- WITH clause\nSELECT * FROM table')).toBe(false)
    expect(checkForWithClause('/* WITH clause */\nSELECT * FROM table')).toBe(false)
  })

  test('string literals', () => {
    expect(checkForWithClause("SELECT 'WITH' FROM table")).toBe(false)
    expect(checkForWithClause("SELECT * FROM table WHERE column = 'WITH clause'")).toBe(false)
  })

  test('subqueries', () => {
    expect(
      checkForWithClause('SELECT * FROM (WITH subquery AS (SELECT 1) SELECT * FROM subquery)')
    ).toBe(true)
    expect(
      checkForWithClause(
        'SELECT * FROM table WHERE column IN (WITH subquery AS (SELECT 1) SELECT * FROM subquery)'
      )
    ).toBe(true)
  })
})
