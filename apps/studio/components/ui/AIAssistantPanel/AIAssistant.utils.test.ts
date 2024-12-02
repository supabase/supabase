import { isReadOnlySelect } from './AIAssistant.utils'

describe('AIAssistant.utils.ts:isReadOnlySelect', () => {
  test('Should return true for SQL that only contains SELECT operation', () => {
    const sql = 'select * from countries where id > 100 order by id asc;'
    const result = isReadOnlySelect(sql)
    expect(result).toBe(true)
  })
  test('Should return false for SQL that contains INSERT operation', () => {
    const sql = `insert into countries (id, name) values (1, 'hello');`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains UPDATE operation', () => {
    const sql = `update countries set name = 'hello' where id = 2;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains DELETE operation', () => {
    const sql = `delete from countries where id = 2;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains ALTER operation', () => {
    const sql = `alter table countries drop column id if exists;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains DROP operation', () => {
    const sql = `drop table if exists countries;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains CREATE operation', () => {
    const sql = `create schema test_schema;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that contains REPLACE operation', () => {
    const sql = `create or replace view test_view as select * from countries where id > 500;`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return false for SQL that calls a function not whitelisted', () => {
    const sql = `select create_new_user();`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(false)
  })
  test('Should return true for SQL that calls a function that is whitelisted', () => {
    const sql = `select count(select * from countries);`
    const result = isReadOnlySelect(sql)
    expect(result).toBe(true)
  })
  test('Should return false for SQL that contains a write operation with a read operation', () => {
    const sql1 = `select count(select * from countries); create schema joshen;`
    const result1 = isReadOnlySelect(sql1)
    expect(result1).toBe(false)
    const sql2 = `create schema joshen; select count(select * from countries);`
    const result2 = isReadOnlySelect(sql2)
    expect(result2).toBe(false)
  })
})
