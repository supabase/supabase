import { expect, test, describe, beforeAll, afterAll } from 'vitest'
import { Query } from '../../src/query/Query'
import { createTestDatabase, cleanupRoot } from '../db/utils'

// This is the type that represents our test database connection
type TestDb = Awaited<ReturnType<typeof createTestDatabase>>

/**
 * Helper function to validate SQL by executing it against a real database
 */
async function validateSql(db: TestDb, sql: string): Promise<void> {
  try {
    await db.executeQuery(sql)
    // If we reach here, the SQL is valid
  } catch (error) {
    throw new Error(`Invalid SQL generated: ${sql}\nError: ${error}`)
  }
}

/**
 * Helper function to execute tests with a database connection
 */
const withTestDatabase = (name: string, fn: (db: TestDb) => Promise<void>) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      // Setup test tables with special characters, spaces, and quotes
      await db.executeQuery(`
        CREATE TABLE "public"."normal_table" (
          id SERIAL PRIMARY KEY,
          name TEXT
        );
        
        CREATE TABLE "public"."table with spaces" (
          id SERIAL PRIMARY KEY,
          "column with spaces" TEXT,
          "quoted""column" TEXT,
          "quoted'column" TEXT,
          "camelCaseColumn" TEXT,
          "special#$%^&Column" TEXT
        );
        
        CREATE TABLE "public"."quoted""table" (
          id SERIAL PRIMARY KEY,
          name TEXT
        );
        
        CREATE TABLE "public"."quoted'table" (
          id SERIAL PRIMARY KEY,
          name TEXT
        );
        
        CREATE TABLE "public"."camelCaseTable" (
          id SERIAL PRIMARY KEY,
          name TEXT
        );
        
        CREATE TABLE "public"."special#$%^&Table" (
          id SERIAL PRIMARY KEY,
          name TEXT
        );
      `)

      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

describe('Advanced Query Tests', () => {
  beforeAll(async () => {
    // Any global setup if needed
  })

  afterAll(async () => {
    await cleanupRoot()
  })

  describe('Special Table and Column Names', () => {
    withTestDatabase('should handle tables with spaces', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('*').toSql()

      expect(sql).toMatchInlineSnapshot('"select * from public."table with spaces";"')
      await validateSql(db, sql)
    })

    withTestDatabase('should handle tables with double quotes', async (db) => {
      const query = new Query()
      const sql = query.from('quoted"table', 'public').select('*').toSql()

      expect(sql).toMatchInlineSnapshot('"select * from public."quoted""table";"')
      await validateSql(db, sql)
    })

    withTestDatabase('should handle tables with single quotes', async (db) => {
      const query = new Query()
      const sql = query.from("quoted'table", 'public').select('*').toSql()

      expect(sql).toMatchInlineSnapshot('"select * from public."quoted\'table";"')
      await validateSql(db, sql)
    })

    withTestDatabase('should handle camelCase table names', async (db) => {
      const query = new Query()
      const sql = query.from('camelCaseTable', 'public').select('*').toSql()

      expect(sql).toMatchInlineSnapshot('"select * from public."camelCaseTable";"')
      await validateSql(db, sql)
    })

    withTestDatabase('should handle tables with special characters', async (db) => {
      const query = new Query()
      const sql = query.from('special#$%^&Table', 'public').select('*').toSql()

      expect(sql).toMatchInlineSnapshot('"select * from public."special#$%^&Table";"')
      await validateSql(db, sql)
    })

    withTestDatabase('should handle columns with spaces', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('"column with spaces"').toSql()

      expect(sql).toMatchInlineSnapshot(
        '"select "column with spaces" from public."table with spaces";"'
      )
      await validateSql(db, sql)
    })

    withTestDatabase('should handle columns with double quotes', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('"quoted""column"').toSql()

      expect(sql).toMatchInlineSnapshot(
        '"select "quoted""column" from public."table with spaces";"'
      )
      await validateSql(db, sql)
    })

    withTestDatabase('should handle columns with single quotes', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('"quoted\'column"').toSql()

      expect(sql).toMatchInlineSnapshot(
        '"select "quoted\'column" from public."table with spaces";"'
      )
      await validateSql(db, sql)
    })

    withTestDatabase('should handle camelCase column names', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('"camelCaseColumn"').toSql()

      expect(sql).toMatchInlineSnapshot(
        '"select "camelCaseColumn" from public."table with spaces";"'
      )
      await validateSql(db, sql)
    })

    withTestDatabase('should handle columns with special characters', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('"special#$%^&Column"').toSql()

      expect(sql).toMatchInlineSnapshot(
        '"select "special#$%^&Column" from public."table with spaces";"'
      )
      await validateSql(db, sql)
    })
  })

  describe('Complex Queries with Special Names', () => {
    withTestDatabase('should handle filtering on columns with spaces', async (db) => {
      // First ensure the table exists with the right column
      await db.executeQuery(`
        DROP TABLE IF EXISTS "public"."table with spaces";
        CREATE TABLE "public"."table with spaces" (
          id SERIAL PRIMARY KEY,
          "column with spaces" TEXT
        );
      `)

      const query = new Query()

      // Specify the column name without extra quotes in the filter
      // The Query class handles the proper quoting
      const sql = query
        .from('table with spaces', 'public')
        .select('*')
        .filter('column with spaces', '=', 'test value')
        .toSql()

      // Test with an inline snapshot for clear expectations
      expect(sql).toMatchInlineSnapshot(
        '"select * from public."table with spaces" where "column with spaces" = \'test value\';"'
      )

      // Validate the generated SQL directly against the database
      await validateSql(db, sql)
    })

    withTestDatabase('should handle filtering with values containing quotes', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .select('*')
        .filter('name', '=', "O'Reilly")
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        "\"select * from public.normal_table where name = 'O''Reilly';\""
      )
      await validateSql(db, sql)
    })

    withTestDatabase('should handle updating with values containing quotes', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .update({ name: "John O'Reilly" }, { returning: true })
        .filter('id', '=', 1)
        .toSql()

      // Check that the SQL query contains the name value, but don't expect specific format
      expect(sql).toContain("O''Reilly")
      await validateSql(db, sql)
    })

    withTestDatabase('should handle inserting with values containing quotes', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .insert([{ name: "John O'Reilly" }], { returning: true })
        .toSql()

      // Check that the SQL query contains the name value, but don't expect specific format
      expect(sql).toContain("O''Reilly")
      await validateSql(db, sql)
    })
  })

  describe('Advanced SQL Generation and Validation', () => {
    withTestDatabase(
      'should generate valid select with multiple filters and sorting',
      async (db) => {
        const query = new Query()
        const sql = query
          .from('normal_table', 'public')
          .select('id, name')
          .filter('id', '>', 10)
          .filter('name', '~~', '%John%')
          .order('normal_table', 'name', true, false)
          .range(0, 9)
          .toSql()

        expect(sql).toMatchInlineSnapshot(
          '"select id, name from public.normal_table where id > 10 and name ~~ \'%John%\' order by normal_table.name asc nulls last limit 10 offset 0;"'
        )
        await validateSql(db, sql)
      }
    )

    withTestDatabase('should generate valid insert with returning clause', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .insert([{ name: 'John Doe' }], { returning: true })
        .toSql()

      // Use partial matching since the exact format is complex
      expect(sql).toContain('insert into public.normal_table')
      expect(sql).toContain('returning *')
      await validateSql(db, sql)
    })

    withTestDatabase('should generate valid update with filtering', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .update({ name: 'Updated Name' }, { returning: true })
        .filter('id', '=', 1)
        .toSql()

      // Use partial matching since the exact format is complex
      expect(sql).toContain('update public.normal_table set')
      expect(sql).toContain('Updated Name')
      expect(sql).toContain('where id = 1')
      expect(sql).toContain('returning *')
      await validateSql(db, sql)
    })

    withTestDatabase('should generate valid delete with filtering', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .delete({ returning: true })
        .filter('id', '=', 1)
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        '"delete from public.normal_table where id = 1 returning *;"'
      )
      await validateSql(db, sql)
    })

    withTestDatabase('should generate valid count with filtering', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .count()
        .filter('name', '~~', '%John%')
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        '"select count(*) from public.normal_table where name ~~ \'%John%\';"'
      )
      await validateSql(db, sql)
    })

    withTestDatabase('should generate valid truncate query', async (db) => {
      const query = new Query()
      const sql = query.from('normal_table', 'public').truncate().toSql()

      expect(sql).toMatchInlineSnapshot('"truncate public.normal_table;"')
      await validateSql(db, sql)
    })
  })

  describe('Corner Cases and Error Handling', () => {
    withTestDatabase('should throw error for delete without filters', async () => {
      const query = new Query()
      const action = query.from('normal_table', 'public').delete({ returning: true })

      expect(() => action.toSql()).toThrow(/no filters/)
    })

    withTestDatabase('should throw error for update without filters', async () => {
      const query = new Query()
      const action = query.from('normal_table', 'public').update({ name: 'Updated Name' })

      expect(() => action.toSql()).toThrow(/no filters/)
    })

    withTestDatabase('should throw error for insert without values', async () => {
      const query = new Query()
      // We're passing an empty array to test the runtime error
      const action = query.from('normal_table', 'public').insert([] as any, { returning: true })

      expect(() => action.toSql()).toThrow(/no value to insert/)
    })

    withTestDatabase('should handle special characters in values', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .select('*')
        .filter('name', '=', 'Special $ ^ & * ( ) _ + { } | : < > ? characters')
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        '"select * from public.normal_table where name = \'Special $ ^ & * ( ) _ + { } | : < > ? characters\';"'
      )
      await validateSql(db, sql)
    })
  })

  describe('Advanced Filtering', () => {
    withTestDatabase('should handle "in" operator with array values', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .select('*')
        .filter('id', 'in', [1, 2, 3])
        .toSql()

      expect(sql).toMatchInlineSnapshot('"select * from public.normal_table where id in (1,2,3);"')
      await validateSql(db, sql)
    })

    withTestDatabase('should handle "is" operator with null value', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .select('*')
        .filter('name', 'is', 'null')
        .toSql()

      expect(sql).toMatchInlineSnapshot('"select * from public.normal_table where name is null;"')
      await validateSql(db, sql)
    })

    withTestDatabase('should handle "is" operator with not null value', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .select('*')
        .filter('name', 'is', 'not null')
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        '"select * from public.normal_table where name is not null;"'
      )
      await validateSql(db, sql)
    })
  })
})
