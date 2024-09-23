import {
  checkForWithClause,
  checkForILIKEClause,
  checkForWildcard,
} from 'components/interfaces/Settings/Logs/Logs.utils'

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

describe('checkForILIKEClause', () => {
  test('basic queries', () => {
    expect(checkForILIKEClause('SELECT * FROM table')).toBe(false)
    expect(checkForILIKEClause('SELECT * FROM table WHERE column ILIKE "%value%"')).toBe(true)
    expect(checkForILIKEClause('SELECT * FROM table WHERE column LIKE "%value%"')).toBe(false)
    expect(checkForILIKEClause('SELECT * FROM ilikesomething')).toBe(false)
  })

  test('case sensitivity', () => {
    expect(checkForILIKEClause('SELECT * FROM table WHERE column ilike "%value%"')).toBe(true)
    expect(checkForILIKEClause('SELECT * FROM table WHERE column IlIkE "%value%"')).toBe(true)
  })

  test('comments', () => {
    expect(checkForILIKEClause('SELECT * FROM table -- ILIKE clause')).toBe(false)
    expect(checkForILIKEClause('SELECT * FROM table /* ILIKE clause */')).toBe(false)
    expect(checkForILIKEClause('-- ILIKE clause\nSELECT * FROM table')).toBe(false)
    expect(checkForILIKEClause('/* ILIKE clause */\nSELECT * FROM table')).toBe(false)
  })

  test('string literals', () => {
    expect(checkForILIKEClause("SELECT 'ILIKE' FROM table")).toBe(false)
    expect(checkForILIKEClause("SELECT * FROM table WHERE column = 'ILIKE clause'")).toBe(false)
  })

  test('subqueries', () => {
    expect(
      checkForILIKEClause('SELECT * FROM (SELECT * FROM table WHERE column ILIKE "%value%")')
    ).toBe(true)
    expect(
      checkForILIKEClause(
        'SELECT * FROM table WHERE column IN (SELECT * FROM subtable WHERE column ILIKE "%value%")'
      )
    ).toBe(true)
  })
})

describe('checkForWildcard', () => {
  test('basic queries', () => {
    expect(checkForWildcard('SELECT * FROM table')).toBe(true)
    expect(checkForWildcard('SELECT column FROM table')).toBe(false)
  })

  test('comments', () => {
    expect(checkForWildcard('SELECT column FROM table -- *')).toBe(false)
    expect(checkForWildcard('SELECT column FROM table /* * */')).toBe(false)
    expect(checkForWildcard('-- *\nSELECT column FROM table')).toBe(false)
    expect(checkForWildcard('/* * */\nSELECT column FROM table')).toBe(false)
  })
})
