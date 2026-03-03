import { afterAll, describe, expect, test } from 'vitest'

import { Query } from '../../src/query/Query'
import { cleanupRoot, createTestDatabase } from '../db/utils'

type TestDb = Awaited<ReturnType<typeof createTestDatabase>>

async function validateSql(db: TestDb, sql: string): Promise<any> {
  try {
    const result = await db.executeQuery(sql)
    return result
  } catch (error) {
    throw new Error(`Invalid SQL generated: ${sql}\nError: ${error}`)
  }
}

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

      // Insert test data into each table
      await db.executeQuery(`
        -- Add data to normal_table
        INSERT INTO "public"."normal_table" (name) 
        VALUES 
          ('John Doe'),
          ('Jane Smith'),
          ('O''Reilly Books'),
          (NULL);
          
        -- Add data to table with spaces
        INSERT INTO "public"."table with spaces" (
          "column with spaces", 
          "quoted""column", 
          "quoted'column", 
          "camelCaseColumn", 
          "special#$%^&Column"
        ) 
        VALUES 
          ('value with spaces', 'value with "quotes"', 'value with ''quotes''', 'camelCaseValue', 'special#$%^&Value'),
          ('another value', 'another "quoted" value', 'another ''quoted'' value', 'anotherCamelCase', 'another#$%^&');
          
        -- Add data to quoted"table
        INSERT INTO "public"."quoted""table" (name) 
        VALUES 
          ('quoted table row 1'),
          ('quoted table row 2');
          
        -- Add data to quoted'table
        INSERT INTO "public"."quoted'table" (name) 
        VALUES 
          ('single quoted table row 1'),
          ('single quoted table row 2');
          
        -- Add data to camelCaseTable
        INSERT INTO "public"."camelCaseTable" (name) 
        VALUES 
          ('camel case table row 1'),
          ('camel case table row 2');
          
        -- Add data to special#$%^&Table
        INSERT INTO "public"."special#$%^&Table" (name) 
        VALUES 
          ('special char table row 1'),
          ('special char table row 2');
      `)

      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

describe('Advanced Query Tests', () => {
  afterAll(async () => {
    await cleanupRoot()
  })

  describe('Special Table and Column Names', () => {
    withTestDatabase('should handle tables with spaces', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('*').toSql()

      expect(sql).toMatchInlineSnapshot(`"select * from public."table with spaces";"`)
      const result = await validateSql(db, sql)
      expect(result.length).toBe(2)
      expect(result[0]['column with spaces']).toBe('value with spaces')
      expect(result[1]['column with spaces']).toBe('another value')
    })

    withTestDatabase('should handle tables with double quotes', async (db) => {
      const query = new Query()
      const sql = query.from('quoted"table', 'public').select('*').toSql()

      expect(sql).toMatchInlineSnapshot(`"select * from public."quoted""table";"`)
      const result = await validateSql(db, sql)
      expect(result.length).toBe(2)
      expect(result[0].name).toBe('quoted table row 1')
      expect(result[1].name).toBe('quoted table row 2')
    })

    withTestDatabase('should handle tables with single quotes', async (db) => {
      const query = new Query()
      const sql = query.from("quoted'table", 'public').select('*').toSql()

      expect(sql).toMatchInlineSnapshot(`"select * from public."quoted'table";"`)
      const result = await validateSql(db, sql)
      expect(result.length).toBe(2)
      expect(result[0].name).toBe('single quoted table row 1')
      expect(result[1].name).toBe('single quoted table row 2')
    })

    withTestDatabase('should handle camelCase table names', async (db) => {
      const query = new Query()
      const sql = query.from('camelCaseTable', 'public').select('*').toSql()

      expect(sql).toMatchInlineSnapshot(`"select * from public."camelCaseTable";"`)
      const result = await validateSql(db, sql)
      expect(result.length).toBe(2)
      expect(result[0].name).toBe('camel case table row 1')
      expect(result[1].name).toBe('camel case table row 2')
    })

    withTestDatabase('should handle tables with special characters', async (db) => {
      const query = new Query()
      const sql = query.from('special#$%^&Table', 'public').select('*').toSql()

      expect(sql).toMatchInlineSnapshot(`"select * from public."special#$%^&Table";"`)
      const result = await validateSql(db, sql)
      expect(result.length).toBe(2)
      expect(result[0].name).toBe('special char table row 1')
      expect(result[1].name).toBe('special char table row 2')
    })

    withTestDatabase('should handle columns with spaces', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('"column with spaces"').toSql()

      expect(sql).toMatchInlineSnapshot(
        `"select "column with spaces" from public."table with spaces";"`
      )
      const result = await validateSql(db, sql)
      expect(result.length).toBe(2)
      expect(result[0]['column with spaces']).toBe('value with spaces')
      expect(result[1]['column with spaces']).toBe('another value')
    })

    withTestDatabase('should handle columns with double quotes', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('"quoted""column"').toSql()

      expect(sql).toMatchInlineSnapshot(
        `"select "quoted""column" from public."table with spaces";"`
      )
      const result = await validateSql(db, sql)
      expect(result.length).toBe(2)
      expect(result[0]['quoted"column']).toBe('value with "quotes"')
      expect(result[1]['quoted"column']).toBe('another "quoted" value')
    })

    withTestDatabase('should handle columns with single quotes', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('"quoted\'column"').toSql()

      expect(sql).toMatchInlineSnapshot(`"select "quoted'column" from public."table with spaces";"`)
      const result = await validateSql(db, sql)
      expect(result.length).toBe(2)
      expect(result[0]["quoted'column"]).toBe("value with 'quotes'")
      expect(result[1]["quoted'column"]).toBe("another 'quoted' value")
    })

    withTestDatabase('should handle camelCase column names', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('"camelCaseColumn"').toSql()

      expect(sql).toMatchInlineSnapshot(
        `"select "camelCaseColumn" from public."table with spaces";"`
      )
      const result = await validateSql(db, sql)
      expect(result.length).toBe(2)
      expect(result[0].camelCaseColumn).toBe('camelCaseValue')
      expect(result[1].camelCaseColumn).toBe('anotherCamelCase')
    })

    withTestDatabase('should handle columns with special characters', async (db) => {
      const query = new Query()
      const sql = query.from('table with spaces', 'public').select('"special#$%^&Column"').toSql()

      expect(sql).toMatchInlineSnapshot(
        `"select "special#$%^&Column" from public."table with spaces";"`
      )
      const result = await validateSql(db, sql)
      expect(result.length).toBe(2)
      expect(result[0]['special#$%^&Column']).toBe('special#$%^&Value')
      expect(result[1]['special#$%^&Column']).toBe('another#$%^&')
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
          
          -- Insert test data
          INSERT INTO "public"."table with spaces" ("column with spaces")
          VALUES ('test value'), ('other value');
        `)

      const query = new Query()

      // Specify the column name without extra quotes in the filter
      // The Query class handles the proper quoting
      const sql = query
        .from('table with spaces', 'public')
        .select('*')
        .filter('column with spaces', '=', 'test value')
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        `"select * from public."table with spaces" where "column with spaces" = 'test value';"`
      )

      // Validate the generated SQL directly against the database
      const result = await validateSql(db, sql)
      expect(result.length).toBe(1)
      expect(result[0]['column with spaces']).toBe('test value')
    })

    withTestDatabase('should handle filtering with values containing quotes', async (db) => {
      await db.executeQuery(`
        INSERT INTO "public"."normal_table" (name) 
        VALUES ('O''Reilly');
      `)

      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .select('*')
        .filter('name', '=', "O'Reilly")
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        `"select * from public.normal_table where name = 'O''Reilly';"`
      )

      const result = await validateSql(db, sql)
      expect(result.length).toBe(1)
      expect(result[0].name).toBe("O'Reilly")
    })

    withTestDatabase('should handle updating with values containing quotes', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .update({ name: "John O'Reilly" }, { returning: true })
        .filter('id', '=', 1)
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        `"update public.normal_table set (name) = (select name from json_populate_record(null::public.normal_table, '{"name":"John O''Reilly"}')) where id = 1 returning *;"`
      )
      await validateSql(db, sql)
    })

    withTestDatabase('should handle inserting with values containing quotes', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .insert([{ name: "John O'Reilly" }], { returning: true })
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        `"insert into public.normal_table (name) select name from jsonb_populate_recordset(null::public.normal_table, '[{"name":"John O''Reilly"}]') returning *;"`
      )
      await validateSql(db, sql)
    })
  })

  describe('Advanced SQL Generation and Validation', () => {
    withTestDatabase(
      'should generate valid select with multiple filters and sorting',
      async (db) => {
        await db.executeQuery(`
          DELETE FROM "public"."normal_table";
          INSERT INTO "public"."normal_table" (id, name) 
          VALUES 
            (11, 'John Smith'),
            (12, 'John Doe'),
            (13, 'Jane Smith'),
            (14, 'Someone Else');
        `)

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
          `"select id, name from public.normal_table where id > 10 and name::text ~~ '%John%' order by normal_table.name asc nulls last limit 10 offset 0;"`
        )

        const result = await validateSql(db, sql)
        expect(result.length).toBe(2)
        expect(result[0].name).toBe('John Doe') // Alphabetically first
        expect(result[1].name).toBe('John Smith')
        expect(result.every((row: any) => row.id > 10)).toBe(true)
      }
    )

    withTestDatabase('should generate valid insert with returning clause', async (db) => {
      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .insert([{ name: 'John Doe' }], { returning: true })
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        `"insert into public.normal_table (name) select name from jsonb_populate_recordset(null::public.normal_table, '[{"name":"John Doe"}]') returning *;"`
      )

      const result = await validateSql(db, sql)
      expect(result.length).toBe(1)
      expect(result[0].name).toBe('John Doe')
    })

    withTestDatabase('should generate valid update with filtering', async (db) => {
      await db.executeQuery(`
        -- Clear and insert test data
        DELETE FROM "public"."normal_table";
        INSERT INTO "public"."normal_table" (id, name) 
        VALUES (1, 'Original Name') ON CONFLICT (id) DO UPDATE SET name = 'Original Name';
      `)

      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .update({ name: 'Updated Name' }, { returning: true })
        .filter('id', '=', 1)
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        `"update public.normal_table set (name) = (select name from json_populate_record(null::public.normal_table, '{"name":"Updated Name"}')) where id = 1 returning *;"`
      )

      const result = await validateSql(db, sql)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe(1)
      expect(result[0].name).toBe('Updated Name')

      // Verify the update was actually persisted
      const verifyResult = await db.executeQuery('SELECT * FROM public.normal_table WHERE id = 1')
      expect(verifyResult[0].name).toBe('Updated Name')
    })

    withTestDatabase('should generate valid delete with filtering', async (db) => {
      await db.executeQuery(`
        -- Clear and insert test data
        DELETE FROM "public"."normal_table";
        INSERT INTO "public"."normal_table" (id, name) 
        VALUES (1, 'To Be Deleted') ON CONFLICT (id) DO UPDATE SET name = 'To Be Deleted';
      `)

      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .delete({ returning: true })
        .filter('id', '=', 1)
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        '"delete from public.normal_table where id = 1 returning *;"'
      )

      const result = await validateSql(db, sql)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe(1)
      expect(result[0].name).toBe('To Be Deleted')

      // Verify the row was actually deleted
      const verifyResult = await db.executeQuery('SELECT * FROM public.normal_table WHERE id = 1')
      expect(verifyResult.length).toBe(0)
    })

    withTestDatabase('should generate valid count with filtering', async (db) => {
      await db.executeQuery(`
        -- Clear and insert test data
        DELETE FROM "public"."normal_table";
        INSERT INTO "public"."normal_table" (name) 
        VALUES ('John Smith'), ('John Doe'), ('Jane Doe');
      `)

      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .count()
        .filter('name', '~~', '%John%')
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        '"select count(*) from public.normal_table where name::text ~~ \'%John%\';"'
      )

      const result = await validateSql(db, sql)
      expect(result[0].count).toBe(2) // PostgreSQL returns count as string
    })

    withTestDatabase('should generate valid truncate query', async (db) => {
      await db.executeQuery(`
        INSERT INTO "public"."normal_table" (name) 
        VALUES ('Test Row 1'), ('Test Row 2');
      `)

      // Verify data exists
      const beforeCount = await db.executeQuery(`SELECT COUNT(*) FROM "public"."normal_table"`)
      expect(parseInt(beforeCount[0].count)).toBeGreaterThan(0)

      const query = new Query()
      const sql = query.from('normal_table', 'public').truncate().toSql()

      expect(sql).toMatchInlineSnapshot('"truncate public.normal_table;"')
      await validateSql(db, sql)

      // Verify truncate worked
      const afterCount = await db.executeQuery(`SELECT COUNT(*) FROM "public"."normal_table"`)
      expect(parseInt(afterCount[0].count)).toBe(0)
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
        `"select * from public.normal_table where name = 'Special $ ^ & * ( ) _ + { } | : < > ? characters';"`
      )
      await validateSql(db, sql)
    })
  })

  describe('Advanced Filtering', () => {
    withTestDatabase('should handle "in" operator with array values', async (db) => {
      await db.executeQuery(`
        DELETE FROM "public"."normal_table";
        INSERT INTO "public"."normal_table" (id, name) 
        VALUES 
          (1, 'Row 1'),
          (2, 'Row 2'),
          (3, 'Row 3'),
          (4, 'Row 4');
      `)

      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .select('*')
        .filter('id', 'in', [1, 2, 3])
        .toSql()

      expect(sql).toMatchInlineSnapshot(`"select * from public.normal_table where id in (1,2,3);"`)
      const result = await validateSql(db, sql)
      expect(result.length).toBe(3)
      expect(result.map((row: any) => row.id).sort()).toEqual([1, 2, 3])
    })

    withTestDatabase('should handle "is" operator with null value', async (db) => {
      await db.executeQuery(`
        DELETE FROM "public"."normal_table";
        INSERT INTO "public"."normal_table" (id, name) 
        VALUES 
          (1, 'Not Null'),
          (2, NULL);
      `)

      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .select('*')
        .filter('name', 'is', 'null')
        .toSql()

      expect(sql).toMatchInlineSnapshot(`"select * from public.normal_table where name is null;"`)
      const result = await validateSql(db, sql)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe(2)
      expect(result[0].name).toBeNull()
    })

    withTestDatabase('should handle "is" operator with not null value', async (db) => {
      await db.executeQuery(`
        DELETE FROM "public"."normal_table";
        INSERT INTO "public"."normal_table" (id, name) 
        VALUES 
          (1, 'Not Null'),
          (2, NULL);
      `)

      const query = new Query()
      const sql = query
        .from('normal_table', 'public')
        .select('*')
        .filter('name', 'is', 'not null')
        .toSql()

      expect(sql).toMatchInlineSnapshot(
        `"select * from public.normal_table where name is not null;"`
      )
      const result = await validateSql(db, sql)
      expect(result.length).toBe(1)
      expect(result[0].id).toBe(1)
      expect(result[0].name).toBe('Not Null')
    })
  })
})
