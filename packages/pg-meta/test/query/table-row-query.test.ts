import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import pgMeta from '../../src/index'
import { Filter, Sort } from '../../src/query'
import { getDefaultOrderByColumns, getTableRowsSql } from '../../src/query/table-row-query'
import { cleanupRoot, createTestDatabase } from '../db/utils'

beforeAll(async () => {
  // Any global setup if needed
})

afterAll(async () => {
  await cleanupRoot()
})

type TestDb = Awaited<ReturnType<typeof createTestDatabase>>

const withTestDatabase = (name: string, fn: (db: TestDb) => Promise<void>) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

describe('Table Row Query', () => {
  describe('getDefaultOrderByColumns', () => {
    test('should return empty array when no primary keys and no columns exist', () => {
      const result = getDefaultOrderByColumns({
        primary_keys: [],
        columns: [],
      })
      expect(result).toEqual([])
    })

    test('should exclude specified columns when determining default sort', () => {
      const table = {
        primary_keys: [{ name: 'id' }],
        columns: [
          {
            name: 'id',
            data_type: 'integer',
            format: 'int4',
            ordinal_position: 1,
          },
          {
            name: 'name',
            data_type: 'text',
            format: 'text',
            ordinal_position: 2,
          },
        ],
      } as any

      const result = getDefaultOrderByColumns(table, { excludedColumns: ['id'] })
      expect(result).toEqual(['name'])
    })
  })

  describe('getTableRowsSql', () => {
    withTestDatabase('should handle array of enums correctly', async (db) => {
      // Create an enum type and a table with an array of that enum
      await db.executeQuery(`
        -- Create enum type
        CREATE TYPE status_type AS ENUM ('pending', 'active', 'completed', 'canceled');

        -- Create table with array of enums
        CREATE TABLE test_enum_array (
          id SERIAL PRIMARY KEY,
          name TEXT,
          status status_type, -- Regular enum column
          history status_type[] -- Array of enums
        );

        -- Insert test data with various enum array values
        INSERT INTO test_enum_array (name, status, history) VALUES
          ('Item 1', 'active', ARRAY['pending', 'active']::status_type[]),
          ('Item 2', 'completed', ARRAY['pending', 'active', 'completed']::status_type[]),
          ('Item 3', 'canceled', ARRAY['active', 'canceled']::status_type[]),
          ('Item 4', 'pending', NULL);
      `)

      // Get table metadata
      const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
      const tables = tablesZod.parse(await db.executeQuery(tablesSql))
      const testTable = tables.find((table) => table.name === 'test_enum_array')

      expect(testTable).toBeDefined()

      // Generate SQL
      const sql = getTableRowsSql({
        table: testTable!,
        page: 1,
        limit: 10,
      })

      // Verify SQL generation with snapshot
      expect(sql).toMatchInlineSnapshot(`
        "with _base_query as (select * from public.test_enum_array order by test_enum_array.id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name,status,
                case 
                  when octet_length(history::text) > 10240 
                  then
                    case
                      when array_ndims(history) = 1
                      then
                        (select array_cat(history[1:50]::text[], array['...']::text[]))::text[]
                      else
                        history[1:50]::text[]
                    end
                  else history::text[]
                end
               from _base_query;"
      `)

      // Execute the generated SQL and verify the results
      const queryResult = await db.executeQuery(sql)
      expect(queryResult).toMatchInlineSnapshot(`
        [
          {
            "history": [
              "pending",
              "active",
            ],
            "id": 1,
            "name": "Item 1",
            "status": "active",
          },
          {
            "history": [
              "pending",
              "active",
              "completed",
            ],
            "id": 2,
            "name": "Item 2",
            "status": "completed",
          },
          {
            "history": [
              "active",
              "canceled",
            ],
            "id": 3,
            "name": "Item 3",
            "status": "canceled",
          },
          {
            "history": null,
            "id": 4,
            "name": "Item 4",
            "status": "pending",
          },
        ]
      `)

      // Test filtering on enum array values
      const filtersStatusSQL = getTableRowsSql({
        table: testTable!,
        filters: [
          { column: 'status', operator: '=', value: `active` }, // Contains 'active' using text pattern matching
        ],
        page: 1,
        limit: 10,
      })

      expect(filtersStatusSQL).toMatchInlineSnapshot(`
        "with _base_query as (select * from public.test_enum_array where status = 'active' order by test_enum_array.id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name,status,
                case 
                  when octet_length(history::text) > 10240 
                  then
                    case
                      when array_ndims(history) = 1
                      then
                        (select array_cat(history[1:50]::text[], array['...']::text[]))::text[]
                      else
                        history[1:50]::text[]
                    end
                  else history::text[]
                end
               from _base_query;"
      `)
      // Execute the filtered query
      const filtersStatusResult = await db.executeQuery(filtersStatusSQL)
      expect(filtersStatusResult).toMatchInlineSnapshot(`
        [
          {
            "history": [
              "pending",
              "active",
            ],
            "id": 1,
            "name": "Item 1",
            "status": "active",
          },
        ]
      `)

      const filtersHistorySQL = getTableRowsSql({
        table: testTable!,
        filters: [
          { column: 'history', operator: '=', value: `ARRAY['active']::status_type[]` }, // Contains 'active' using text pattern matching
        ],
        page: 1,
        limit: 10,
      })

      expect(filtersHistorySQL).toMatchInlineSnapshot(`
        "with _base_query as (select * from public.test_enum_array where history = ARRAY['active']::status_type[] order by test_enum_array.id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name,status,
                case 
                  when octet_length(history::text) > 10240 
                  then
                    case
                      when array_ndims(history) = 1
                      then
                        (select array_cat(history[1:50]::text[], array['...']::text[]))::text[]
                      else
                        history[1:50]::text[]
                    end
                  else history::text[]
                end
               from _base_query;"
      `)
      const filtersHistoryResult = await db.executeQuery(filtersHistorySQL)
      expect(filtersHistoryResult).toMatchInlineSnapshot(`[]`)
    })

    withTestDatabase('should handle array columns correctly', async (db) => {
      await db.executeQuery(`
        CREATE TABLE test_array_table (
          id SERIAL PRIMARY KEY,
          name TEXT,
          tags TEXT[] -- Array of text
        );

        -- Insert test data with array values
        INSERT INTO test_array_table (name, tags) VALUES
          ('Item 1', ARRAY['tag1', 'tag2']),
          ('Item 2', ARRAY['tag3']),
          ('Item 3', ARRAY['tag1', 'tag4']);
      `)

      // Get table metadata
      const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
      const tables = tablesZod.parse(await db.executeQuery(tablesSql))
      const testTable = tables.find((table) => table.name === 'test_array_table')

      expect(testTable).toBeDefined()

      // Generate SQL
      const sql = getTableRowsSql({
        table: testTable!,
        page: 1,
        limit: 10,
      })
      expect(sql).toMatchInlineSnapshot(`
        "with _base_query as (select * from public.test_array_table order by test_array_table.id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name,
                case 
                  when octet_length(tags::text) > 10240 
                  then
                    case
                      when array_ndims(tags) = 1
                      then
                        (select array_cat(tags[1:50]::text[], array['...']::text[]))::text[]
                      else
                        tags[1:50]::text[]
                    end
                  else tags::text[]
                end
               from _base_query;"
      `)

      const queryResult = await db.executeQuery(sql)
      expect(queryResult.length).toBe(3)
      expect(queryResult).toMatchInlineSnapshot(`
        [
          {
            "id": 1,
            "name": "Item 1",
            "tags": [
              "tag1",
              "tag2",
            ],
          },
          {
            "id": 2,
            "name": "Item 2",
            "tags": [
              "tag3",
            ],
          },
          {
            "id": 3,
            "name": "Item 3",
            "tags": [
              "tag1",
              "tag4",
            ],
          },
        ]
      `)
    })

    withTestDatabase('should generate basic SELECT SQL for a table', async (db) => {
      // Create test table and insert data
      await db.executeQuery(`
        CREATE TABLE test_sql_gen (
          id SERIAL PRIMARY KEY,
          name TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Insert test data
        INSERT INTO test_sql_gen (name, description) VALUES
          ('Row 1', 'Description 1'),
          ('Row 2', 'Description 2'),
          ('Row 3', 'Description 3');
      `)

      // Get table metadata
      const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
      const tables = tablesZod.parse(await db.executeQuery(tablesSql))
      const testTable = tables.find((table) => table.name === 'test_sql_gen')

      expect(testTable).toBeDefined()

      // Generate SQL
      const sql = getTableRowsSql({
        table: testTable!,
        page: 1,
        limit: 10,
      })

      // Verify SQL generation with snapshot
      expect(sql).toMatchInlineSnapshot(
        `
        "with _base_query as (select * from public.test_sql_gen order by test_sql_gen.id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name,case
                when octet_length(description::text) > 10240 
                then left(description::text, 10240) || '...'
                else description::text
              end as description,created_at from _base_query;"
      `
      )

      // E2E Test: Execute the SQL and verify results
      const queryResult = await db.executeQuery(sql)
      expect(queryResult.length).toBe(3)
      expect(queryResult.map((row: any) => row.name)).toEqual(['Row 1', 'Row 2', 'Row 3'])
      expect(queryResult.map((row: any) => row.description)).toEqual([
        'Description 1',
        'Description 2',
        'Description 3',
      ])
    })

    withTestDatabase(
      'should truncate large arrays to maxArraySize elements if their size is > maxCharacters',
      async (db) => {
        // Create test table with array column
        await db.executeQuery(`
        CREATE TABLE test_large_array_table (
          id SERIAL PRIMARY KEY,
          name TEXT,
          large_array TEXT[] -- Will hold a very large array
        );

        -- Insert test data with a large array (>10KB)
        -- Create an array with 1000 elements to ensure it exceeds 10KB
        INSERT INTO test_large_array_table (name, large_array) VALUES
          ('Large Array Item', (SELECT array_agg('element_' || i) FROM generate_series(1, 1000) i)),
          ('Large Array Small items', (SELECT array_agg('' || i) FROM generate_series(1, 100) i)),
          ('Normal Array Item', ARRAY['tag1', 'tag2', 'tag3']);
      `)

        // Get table metadata
        const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
        const tables = tablesZod.parse(await db.executeQuery(tablesSql))
        const testTable = tables.find((table) => table.name === 'test_large_array_table')

        expect(testTable).toBeDefined()

        // Generate SQL with lower maxCharacters and maxArraySize limits
        const sql = getTableRowsSql({
          table: testTable!,
          page: 1,
          limit: 10,
          maxCharacters: 2048,
          maxArraySize: 10,
        })

        // Verify the SQL contains the array truncation logic
        expect(sql).toMatchInlineSnapshot(`
          "with _base_query as (select * from public.test_large_array_table order by test_large_array_table.id asc nulls last limit 10 offset 0)
            select id,case
                  when octet_length(name::text) > 2048 
                  then left(name::text, 2048) || '...'
                  else name::text
                end as name,
                  case 
                    when octet_length(large_array::text) > 2048 
                    then
                      case
                        when array_ndims(large_array) = 1
                        then
                          (select array_cat(large_array[1:10]::text[], array['...']::text[]))::text[]
                        else
                          large_array[1:10]::text[]
                      end
                    else large_array::text[]
                  end
                 from _base_query;"
        `)

        // Execute the SQL and verify results
        const queryResult = await db.executeQuery(sql)
        expect(queryResult).toMatchInlineSnapshot(`
          [
            {
              "id": 1,
              "large_array": [
                "element_1",
                "element_2",
                "element_3",
                "element_4",
                "element_5",
                "element_6",
                "element_7",
                "element_8",
                "element_9",
                "element_10",
                "...",
              ],
              "name": "Large Array Item",
            },
            {
              "id": 2,
              "large_array": [
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10",
                "11",
                "12",
                "13",
                "14",
                "15",
                "16",
                "17",
                "18",
                "19",
                "20",
                "21",
                "22",
                "23",
                "24",
                "25",
                "26",
                "27",
                "28",
                "29",
                "30",
                "31",
                "32",
                "33",
                "34",
                "35",
                "36",
                "37",
                "38",
                "39",
                "40",
                "41",
                "42",
                "43",
                "44",
                "45",
                "46",
                "47",
                "48",
                "49",
                "50",
                "51",
                "52",
                "53",
                "54",
                "55",
                "56",
                "57",
                "58",
                "59",
                "60",
                "61",
                "62",
                "63",
                "64",
                "65",
                "66",
                "67",
                "68",
                "69",
                "70",
                "71",
                "72",
                "73",
                "74",
                "75",
                "76",
                "77",
                "78",
                "79",
                "80",
                "81",
                "82",
                "83",
                "84",
                "85",
                "86",
                "87",
                "88",
                "89",
                "90",
                "91",
                "92",
                "93",
                "94",
                "95",
                "96",
                "97",
                "98",
                "99",
                "100",
              ],
              "name": "Large Array Small items",
            },
            {
              "id": 3,
              "large_array": [
                "tag1",
                "tag2",
                "tag3",
              ],
              "name": "Normal Array Item",
            },
          ]
        `)
      }
    )

    withTestDatabase(
      'should truncate large arrays of jsonb and json to maxArraySize elements if their size is > maxCharacters',
      async (db) => {
        // Create test table with array column
        await db.executeQuery(`
        CREATE TABLE test_large_array_table (
          id SERIAL PRIMARY KEY,
          name TEXT,
          large_array_jsonb jsonb[],
          large_array_json json[]
        );

        -- Insert test data with a large array (>10KB)
        -- Create arrays with JSON objects
        INSERT INTO test_large_array_table (name, large_array_jsonb, large_array_json) VALUES
          (
            'Large Array Item',
            (SELECT array_agg(jsonb_build_object(
              'id', i,
              'name', 'element_' || i,
              'data', jsonb_build_object('value', i * 10, 'active', true)
            )) FROM generate_series(1, 1000) i),
            (SELECT array_agg(json_build_object(
              'id', i,
              'name', 'element_' || i,
              'data', json_build_object('value', i * 10, 'active', true)
            )) FROM generate_series(1, 1000) i)
          ),
          (
            'Large Array Small items',
            (SELECT array_agg(jsonb_build_object(
              'id', i,
              'value', i
            )) FROM generate_series(1, 100) i),
            (SELECT array_agg(json_build_object(
              'id', i,
              'value', i
            )) FROM generate_series(1, 100) i)
          ),
          (
            'Normal Array Item',
            ARRAY[
              '{"id": 1, "tag": "tag1"}'::jsonb,
              '{"id": 2, "tag": "tag2"}'::jsonb,
              '{"id": 3, "tag": "tag3"}'::jsonb
            ],
            ARRAY[
              '{"id": 1, "tag": "tag1"}'::json,
              '{"id": 2, "tag": "tag2"}'::json,
              '{"id": 3, "tag": "tag3"}'::json
            ]
          );
      `)

        // Get table metadata
        const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
        const tables = tablesZod.parse(await db.executeQuery(tablesSql))
        const testTable = tables.find((table) => table.name === 'test_large_array_table')

        expect(testTable).toBeDefined()

        // Generate SQL with lower maxCharacters and maxArraySize limits
        const sql = getTableRowsSql({
          table: testTable!,
          page: 1,
          limit: 10,
          maxCharacters: 2048,
          maxArraySize: 10,
        })

        // Verify the SQL contains the array truncation logic
        expect(sql).toMatchInlineSnapshot(`
          "with _base_query as (select * from public.test_large_array_table order by test_large_array_table.id asc nulls last limit 10 offset 0)
            select id,case
                  when octet_length(name::text) > 2048 
                  then left(name::text, 2048) || '...'
                  else name::text
                end as name,
                  case 
                    when octet_length(large_array_jsonb::text) > 2048 
                    then
                      case
                        when array_ndims(large_array_jsonb) = 1
                        then
                          (select array_cat(large_array_jsonb[1:10]::jsonb[], array['{"truncated": true}'::json]::jsonb[]))::jsonb[]
                        else
                          large_array_jsonb[1:10]::jsonb[]
                      end
                    else large_array_jsonb::jsonb[]
                  end
                ,
                  case 
                    when octet_length(large_array_json::text) > 2048 
                    then
                      case
                        when array_ndims(large_array_json) = 1
                        then
                          (select array_cat(large_array_json[1:10]::json[], array['{"truncated": true}'::json]::json[]))::json[]
                        else
                          large_array_json[1:10]::json[]
                      end
                    else large_array_json::json[]
                  end
                 from _base_query;"
        `)

        // Execute the SQL and verify results
        const queryResult = await db.executeQuery(sql)
        expect(queryResult).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
          "large_array_json": [
            {
              "data": {
                "active": true,
                "value": 10,
              },
              "id": 1,
              "name": "element_1",
            },
            {
              "data": {
                "active": true,
                "value": 20,
              },
              "id": 2,
              "name": "element_2",
            },
            {
              "data": {
                "active": true,
                "value": 30,
              },
              "id": 3,
              "name": "element_3",
            },
            {
              "data": {
                "active": true,
                "value": 40,
              },
              "id": 4,
              "name": "element_4",
            },
            {
              "data": {
                "active": true,
                "value": 50,
              },
              "id": 5,
              "name": "element_5",
            },
            {
              "data": {
                "active": true,
                "value": 60,
              },
              "id": 6,
              "name": "element_6",
            },
            {
              "data": {
                "active": true,
                "value": 70,
              },
              "id": 7,
              "name": "element_7",
            },
            {
              "data": {
                "active": true,
                "value": 80,
              },
              "id": 8,
              "name": "element_8",
            },
            {
              "data": {
                "active": true,
                "value": 90,
              },
              "id": 9,
              "name": "element_9",
            },
            {
              "data": {
                "active": true,
                "value": 100,
              },
              "id": 10,
              "name": "element_10",
            },
            {
              "truncated": true,
            },
          ],
          "large_array_jsonb": [
            {
              "data": {
                "active": true,
                "value": 10,
              },
              "id": 1,
              "name": "element_1",
            },
            {
              "data": {
                "active": true,
                "value": 20,
              },
              "id": 2,
              "name": "element_2",
            },
            {
              "data": {
                "active": true,
                "value": 30,
              },
              "id": 3,
              "name": "element_3",
            },
            {
              "data": {
                "active": true,
                "value": 40,
              },
              "id": 4,
              "name": "element_4",
            },
            {
              "data": {
                "active": true,
                "value": 50,
              },
              "id": 5,
              "name": "element_5",
            },
            {
              "data": {
                "active": true,
                "value": 60,
              },
              "id": 6,
              "name": "element_6",
            },
            {
              "data": {
                "active": true,
                "value": 70,
              },
              "id": 7,
              "name": "element_7",
            },
            {
              "data": {
                "active": true,
                "value": 80,
              },
              "id": 8,
              "name": "element_8",
            },
            {
              "data": {
                "active": true,
                "value": 90,
              },
              "id": 9,
              "name": "element_9",
            },
            {
              "data": {
                "active": true,
                "value": 100,
              },
              "id": 10,
              "name": "element_10",
            },
            {
              "truncated": true,
            },
          ],
          "name": "Large Array Item",
        },
        {
          "id": 2,
          "large_array_json": [
            {
              "id": 1,
              "value": 1,
            },
            {
              "id": 2,
              "value": 2,
            },
            {
              "id": 3,
              "value": 3,
            },
            {
              "id": 4,
              "value": 4,
            },
            {
              "id": 5,
              "value": 5,
            },
            {
              "id": 6,
              "value": 6,
            },
            {
              "id": 7,
              "value": 7,
            },
            {
              "id": 8,
              "value": 8,
            },
            {
              "id": 9,
              "value": 9,
            },
            {
              "id": 10,
              "value": 10,
            },
            {
              "truncated": true,
            },
          ],
          "large_array_jsonb": [
            {
              "id": 1,
              "value": 1,
            },
            {
              "id": 2,
              "value": 2,
            },
            {
              "id": 3,
              "value": 3,
            },
            {
              "id": 4,
              "value": 4,
            },
            {
              "id": 5,
              "value": 5,
            },
            {
              "id": 6,
              "value": 6,
            },
            {
              "id": 7,
              "value": 7,
            },
            {
              "id": 8,
              "value": 8,
            },
            {
              "id": 9,
              "value": 9,
            },
            {
              "id": 10,
              "value": 10,
            },
            {
              "truncated": true,
            },
          ],
          "name": "Large Array Small items",
        },
        {
          "id": 3,
          "large_array_json": [
            {
              "id": 1,
              "tag": "tag1",
            },
            {
              "id": 2,
              "tag": "tag2",
            },
            {
              "id": 3,
              "tag": "tag3",
            },
          ],
          "large_array_jsonb": [
            {
              "id": 1,
              "tag": "tag1",
            },
            {
              "id": 2,
              "tag": "tag2",
            },
            {
              "id": 3,
              "tag": "tag3",
            },
          ],
          "name": "Normal Array Item",
        },
      ]
    `)
      }
    )

    withTestDatabase('should truncate fields to maxCharacters avoid', async (db) => {
      // Create test table with array column
      await db.executeQuery(`
        CREATE TABLE test_large_array_table (
          id SERIAL PRIMARY KEY,
          name TEXT,
          large_array TEXT[] -- Will hold a very large array
        );

        -- Insert test data with a large array (>10KB)
        -- Create an array with 1000 elements to ensure it exceeds 10KB
        INSERT INTO test_large_array_table (name, large_array) VALUES
          ('Normal Array Item', ARRAY['tag1', 'tag2', 'tag3']),
          -- Locally testing with up to 700 Mo in size should work and not raise a JS string alloc size error
          (repeat('A', 5 * 1024 * 1024), ARRAY['tag1', 'tag2', 'tag3']);
      `)

      // Get table metadata
      const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
      const tables = tablesZod.parse(await db.executeQuery(tablesSql))
      const testTable = tables.find((table) => table.name === 'test_large_array_table')

      expect(testTable).toBeDefined()

      // Generate SQL with lower maxCharacters and maxArraySize limits
      const sql = getTableRowsSql({
        table: testTable!,
        page: 1,
        limit: 10,
        maxCharacters: 256,
      })

      // Verify the SQL contains the array truncation logic
      expect(sql).toMatchInlineSnapshot(`
        "with _base_query as (select * from public.test_large_array_table order by test_large_array_table.id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length(name::text) > 256 
                then left(name::text, 256) || '...'
                else name::text
              end as name,
                case 
                  when octet_length(large_array::text) > 256 
                  then
                    case
                      when array_ndims(large_array) = 1
                      then
                        (select array_cat(large_array[1:50]::text[], array['...']::text[]))::text[]
                      else
                        large_array[1:50]::text[]
                    end
                  else large_array::text[]
                end
               from _base_query;"
      `)

      // Execute the SQL and verify results
      const start = performance.now()
      const queryResult = await db.executeQuery(sql)
      const end = performance.now()
      expect(end - start).lessThan(1000)

      expect(queryResult).toMatchInlineSnapshot(`
        [
          {
            "id": 1,
            "large_array": [
              "tag1",
              "tag2",
              "tag3",
            ],
            "name": "Normal Array Item",
          },
          {
            "id": 2,
            "large_array": [
              "tag1",
              "tag2",
              "tag3",
            ],
            "name": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA...",
          },
        ]
      `)
    })

    withTestDatabase('should generate SQL with filtering', async (db) => {
      // Create test table and insert data
      await db.executeQuery(`
        CREATE TABLE test_sql_filter (
          id SERIAL PRIMARY KEY,
          name TEXT,
          category TEXT
        );

        -- Insert test data with different categories
        INSERT INTO test_sql_filter (name, category) VALUES
          ('Test Item 1', 'A'),
          ('Test Item 2', 'B'),
          ('Test Item 3', 'A'),
          ('Another Item', 'A'),
          ('Different Item', 'C');
      `)

      // Get table metadata
      const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
      const tables = tablesZod.parse(await db.executeQuery(tablesSql))
      const testTable = tables.find((table) => table.name === 'test_sql_filter')

      expect(testTable).toBeDefined()

      // Define filters
      const filters: Filter[] = [
        { column: 'name', operator: '~~', value: 'Test%' },
        { column: 'category', operator: '=', value: 'A' },
      ]

      // Generate SQL with filters
      const sql = getTableRowsSql({
        table: testTable!,
        filters,
        page: 1,
        limit: 10,
      })

      // Verify SQL generation with snapshot
      expect(sql).toMatchInlineSnapshot(
        `
        "with _base_query as (select * from public.test_sql_filter where name::text ~~ 'Test%' and category = 'A' order by test_sql_filter.id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name,case
                when octet_length(category::text) > 10240 
                then left(category::text, 10240) || '...'
                else category::text
              end as category from _base_query;"
      `
      )

      // E2E Test: Execute the SQL and verify results
      const queryResult = await db.executeQuery(sql)
      expect(queryResult.length).toBe(2) // Should only get items that match both filters
      expect(queryResult.map((row: any) => row.name)).toEqual(['Test Item 1', 'Test Item 3'])
      expect(queryResult.every((row: any) => row.category === 'A')).toBe(true)
    })

    withTestDatabase('should generate SQL with sorting', async (db) => {
      // Create test table and insert data
      await db.executeQuery(`
        CREATE TABLE test_sql_sort (
          id SERIAL PRIMARY KEY,
          name TEXT,
          value INTEGER
        );

        -- Insert test data with varying values
        INSERT INTO test_sql_sort (name, value) VALUES
          ('Z Item', 10),
          ('A Item', 30),
          ('M Item', 20),
          ('X Item', null);
      `)

      // Get table metadata
      const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
      const tables = tablesZod.parse(await db.executeQuery(tablesSql))
      const testTable = tables.find((table) => table.name === 'test_sql_sort')

      expect(testTable).toBeDefined()

      // Define sorts
      const sorts: Sort[] = [
        { column: 'name', table: 'test_sql_sort', ascending: true, nullsFirst: false },
        { column: 'value', table: 'test_sql_sort', ascending: false, nullsFirst: true },
      ]

      // Generate SQL with sorting
      const sql = getTableRowsSql({
        table: testTable!,
        sorts,
        page: 1,
        limit: 10,
      })

      // Verify SQL generation with snapshot
      expect(sql).toMatchInlineSnapshot(
        `
        "with _base_query as (select * from public.test_sql_sort order by test_sql_sort.name asc nulls last, test_sql_sort.value desc nulls first limit 10 offset 0)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name,value from _base_query;"
      `
      )

      // E2E Test: Execute the SQL and verify results
      const queryResult = await db.executeQuery(sql)
      expect(queryResult.length).toBe(4)

      // Should be sorted by name (asc) first, then by value (desc, nulls first)
      expect(queryResult.map((row: any) => row.name)).toEqual([
        'A Item',
        'M Item',
        'X Item',
        'Z Item',
      ])

      // The first item (A Item) should have value 30
      expect(queryResult[0].value).toBe(30)

      // Check if the X Item (with null value) is before Z Item (non-null value)
      // due to nullsFirst: true for the value sort
      const xItemIndex = queryResult.findIndex((row: any) => row.name === 'X Item')
      const zItemIndex = queryResult.findIndex((row: any) => row.name === 'Z Item')
      expect(xItemIndex).toBeLessThan(zItemIndex)
    })

    withTestDatabase('should generate SQL for special/quoted column names', async (db) => {
      // Create test table with quoted names and insert data
      await db.executeQuery(`
        CREATE TABLE "test sql spaces" (
          id SERIAL PRIMARY KEY,
          "user name" TEXT,
          "column-with-dashes" TEXT,
          "quoted""column" TEXT
        );

        -- Insert test data
        INSERT INTO "test sql spaces" ("user name", "column-with-dashes", "quoted""column") VALUES
          ('User 1', 'Value 1', 'Quoted 1'),
          ('User 2', 'Value 2', 'Quoted 2');
      `)

      // Get table metadata
      const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
      const tables = tablesZod.parse(await db.executeQuery(tablesSql))
      const testTable = tables.find((table) => table.name === 'test sql spaces')

      expect(testTable).toBeDefined()

      // Generate SQL
      const sql = getTableRowsSql({
        table: testTable!,
        page: 1,
        limit: 10,
      })

      // Verify SQL generation with snapshot
      expect(sql).toMatchInlineSnapshot(
        `
        "with _base_query as (select * from public."test sql spaces" order by "test sql spaces".id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length("user name"::text) > 10240 
                then left("user name"::text, 10240) || '...'
                else "user name"::text
              end as "user name",case
                when octet_length("column-with-dashes"::text) > 10240 
                then left("column-with-dashes"::text, 10240) || '...'
                else "column-with-dashes"::text
              end as "column-with-dashes",case
                when octet_length("quoted""column"::text) > 10240 
                then left("quoted""column"::text, 10240) || '...'
                else "quoted""column"::text
              end as "quoted""column" from _base_query;"
      `
      )

      // E2E Test: Execute the SQL and verify results
      const queryResult = await db.executeQuery(sql)
      expect(queryResult.length).toBe(2)
      expect(queryResult.map((row: any) => row['user name'])).toEqual(['User 1', 'User 2'])
      expect(queryResult.map((row: any) => row['column-with-dashes'])).toEqual([
        'Value 1',
        'Value 2',
      ])
      expect(queryResult.map((row: any) => row['quoted"column'])).toEqual(['Quoted 1', 'Quoted 2'])
    })

    withTestDatabase('should generate SQL for tables with large text fields', async (db) => {
      // Create test table with large text fields
      await db.executeQuery(`
        CREATE TABLE test_large_text (
          id SERIAL PRIMARY KEY,
          small_text VARCHAR(100),
          large_text TEXT,
          json_data JSONB
        );

        -- Insert test data including a large text field
        INSERT INTO test_large_text (small_text, large_text, json_data) VALUES
          ('Small text', repeat('Lorem ipsum ', 100), '{"key": "value", "nested": {"data": true}}'),
          ('Another small text', repeat('Dolor sit amet ', 100), '{"array": [1, 2, 3], "bool": false}');
      `)

      // Get table metadata
      const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
      const tables = tablesZod.parse(await db.executeQuery(tablesSql))
      const testTable = tables.find((table) => table.name === 'test_large_text')

      expect(testTable).toBeDefined()

      // Generate SQL
      const sql = getTableRowsSql({
        table: testTable!,
        page: 1,
        limit: 10,
      })

      // Verify SQL generation with snapshot
      expect(sql).toMatchInlineSnapshot(
        `
        "with _base_query as (select * from public.test_large_text order by test_large_text.id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length(small_text::text) > 10240 
                then left(small_text::text, 10240) || '...'
                else small_text::text
              end as small_text,case
                when octet_length(large_text::text) > 10240 
                then left(large_text::text, 10240) || '...'
                else large_text::text
              end as large_text,case
                when octet_length(json_data::text) > 10240 
                then left(json_data::text, 10240) || '...'
                else json_data::text
              end as json_data from _base_query;"
      `
      )

      // E2E Test: Execute the SQL and verify results
      const queryResult = await db.executeQuery(sql)
      expect(queryResult.length).toBe(2)
      expect(queryResult.map((row: any) => row.small_text)).toEqual([
        'Small text',
        'Another small text',
      ])

      expect(queryResult[0].large_text.startsWith('Lorem ipsum')).toBe(true)
      expect(queryResult[1].large_text.startsWith('Dolor sit amet')).toBe(true)

      expect(JSON.parse(queryResult[0].json_data)).toHaveProperty('key', 'value')
      expect(JSON.parse(queryResult[1].json_data)).toHaveProperty('array')
    })

    withTestDatabase('should generate SQL with pagination', async (db) => {
      // Create test table and insert multiple rows for pagination
      await db.executeQuery(`
        CREATE TABLE test_pagination (
          id SERIAL PRIMARY KEY,
          name TEXT
        );

        -- Insert 15 rows for pagination testing
        INSERT INTO test_pagination (name)
        SELECT 'Item ' || i FROM generate_series(1, 15) i;
      `)

      // Get table metadata
      const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
      const tables = tablesZod.parse(await db.executeQuery(tablesSql))
      const testTable = tables.find((table) => table.name === 'test_pagination')

      expect(testTable).toBeDefined()

      // Generate SQL for page 1 (5 items)
      const sql1 = getTableRowsSql({
        table: testTable!,
        page: 1,
        limit: 5,
      })

      expect(sql1).toMatchInlineSnapshot(
        `
        "with _base_query as (select * from public.test_pagination order by test_pagination.id asc nulls last limit 5 offset 0)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name from _base_query;"
      `
      )

      const page1Result = await db.executeQuery(sql1)
      expect(page1Result.length).toBe(5)
      expect(page1Result.map((row: any) => row.name)).toEqual([
        'Item 1',
        'Item 2',
        'Item 3',
        'Item 4',
        'Item 5',
      ])

      const sql2 = getTableRowsSql({
        table: testTable!,
        page: 2,
        limit: 5,
      })

      // Verify SQL generation for page 2
      expect(sql2).toMatchInlineSnapshot(
        `
        "with _base_query as (select * from public.test_pagination order by test_pagination.id asc nulls last limit 5 offset 5)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name from _base_query;"
      `
      )

      const page2Result = await db.executeQuery(sql2)
      expect(page2Result.length).toBe(5)
      expect(page2Result.map((row: any) => row.name)).toEqual([
        'Item 6',
        'Item 7',
        'Item 8',
        'Item 9',
        'Item 10',
      ])
    })

    withTestDatabase('should generate SQL for view', async (db) => {
      // Create table and view
      await db.executeQuery(`
        CREATE TABLE test_view_source (
          id SERIAL PRIMARY KEY,
          name TEXT,
          active BOOLEAN
        );

        -- Insert test data
        INSERT INTO test_view_source (name, active) VALUES
          ('Active Item 1', true),
          ('Inactive Item', false),
          ('Active Item 2', true);

        -- Create view that only shows active items
        CREATE VIEW test_sql_view AS
        SELECT id, name, active FROM test_view_source WHERE active = true;
      `)

      // Get view metadata
      const { sql: viewsSql, zod: viewsZod } = pgMeta.views.list()
      const views = viewsZod.parse(await db.executeQuery(viewsSql))
      const testView = views.find((view) => view.name === 'test_sql_view')

      expect(testView).toBeDefined()

      // Generate SQL
      const sql = getTableRowsSql({
        table: testView!,
        page: 1,
        limit: 10,
      })

      // Verify SQL generation with snapshot
      expect(sql).toMatchInlineSnapshot(
        `
        "with _base_query as (select * from public.test_sql_view order by test_sql_view.id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name,active from _base_query;"
      `
      )

      // E2E Test: Execute the SQL and verify results
      const queryResult = await db.executeQuery(sql)
      expect(queryResult.length).toBe(2) // Only active items should be in the view
      expect(queryResult.map((row: any) => row.name)).toEqual(['Active Item 1', 'Active Item 2'])
      expect(queryResult.every((row: any) => row.active === true)).toBe(true)
    })

    withTestDatabase('should generate SQL for materialized view', async (db) => {
      // Create table and materialized view
      await db.executeQuery(`
        CREATE TABLE test_mv_source (
          id SERIAL PRIMARY KEY,
          name TEXT,
          value NUMERIC
        );

        -- Insert test data
        INSERT INTO test_mv_source (name, value) VALUES
          ('Item 1', 10.5),
          ('Item 2', -5.25),
          ('Item 3', 20);

        -- Create materialized view that only includes positive values
        CREATE MATERIALIZED VIEW test_sql_mv AS
        SELECT id, name, value FROM test_mv_source WHERE value > 0;
      `)

      // Get materialized view metadata
      const { sql: mvSql, zod: mvZod } = pgMeta.materializedViews.list()
      const materializedViews = mvZod.parse(await db.executeQuery(mvSql))
      const testMv = materializedViews.find((mv) => mv.name === 'test_sql_mv')

      expect(testMv).toBeDefined()

      // Generate SQL
      const sql = getTableRowsSql({
        table: testMv!,
        page: 1,
        limit: 10,
      })

      // Verify SQL generation with snapshot
      expect(sql).toMatchInlineSnapshot(
        `
        "with _base_query as (select * from public.test_sql_mv order by test_sql_mv.id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name,value from _base_query;"
      `
      )

      // E2E Test: Execute the SQL and verify results
      const queryResult = await db.executeQuery(sql)
      expect(queryResult.length).toBe(2) // Only items with positive values
      expect(queryResult.map((row: any) => row.name)).toEqual(['Item 1', 'Item 3'])
      expect(queryResult.every((row: any) => row.value > 0)).toBe(true)
    })

    withTestDatabase('should generate SQL for foreign table', async (db) => {
      // Set up a foreign table with the file_fdw extension
      await db.executeQuery(`
        -- Create the extension if it doesn't exist
        CREATE EXTENSION IF NOT EXISTS file_fdw;

        -- Create a foreign server
        DROP SERVER IF EXISTS file_server2 CASCADE;
        CREATE SERVER file_server2 FOREIGN DATA WRAPPER file_fdw;

        -- Create a table to export data from
        CREATE TABLE source_for_foreign_test (
          id SERIAL PRIMARY KEY,
          name TEXT,
          description TEXT
        );

        -- Insert test data
        INSERT INTO source_for_foreign_test (name, description) VALUES
          ('Foreign Item 1', 'Description 1'),
          ('Foreign Item 2', 'Description 2');

        -- Export to CSV for the foreign table
        COPY source_for_foreign_test TO '/tmp/foreign_test2.csv' WITH (FORMAT csv, HEADER);

        -- Create the foreign table
        CREATE FOREIGN TABLE test_sql_foreign (
          id INT,
          name TEXT,
          description TEXT
        ) SERVER file_server2
        OPTIONS (filename '/tmp/foreign_test2.csv', format 'csv', header 'true');
      `)

      // Get foreign table metadata
      const { sql: ftSql, zod: ftZod } = pgMeta.foreignTables.list()
      const foreignTables = ftZod.parse(await db.executeQuery(ftSql))
      const testFt = foreignTables.find((ft) => ft.name === 'test_sql_foreign')

      expect(testFt).toBeDefined()

      // Generate SQL
      const sql = getTableRowsSql({
        table: testFt!,
        page: 1,
        limit: 10,
      })

      // Verify SQL generation with snapshot
      expect(sql).toMatchInlineSnapshot(
        `
        "with _base_query as (select * from public.test_sql_foreign order by test_sql_foreign.id asc nulls last limit 10 offset 0)
          select id,case
                when octet_length(name::text) > 10240 
                then left(name::text, 10240) || '...'
                else name::text
              end as name,case
                when octet_length(description::text) > 10240 
                then left(description::text, 10240) || '...'
                else description::text
              end as description from _base_query;"
      `
      )

      // E2E Test: Execute the SQL and verify results
      const queryResult = await db.executeQuery(sql)
      expect(queryResult).toMatchInlineSnapshot(`
        [
          {
            "description": "Description 1",
            "id": 1,
            "name": "Foreign Item 1",
          },
          {
            "description": "Description 2",
            "id": 2,
            "name": "Foreign Item 2",
          },
        ]
      `)
    })
  })
  withTestDatabase('should handle large multi-dimensional arrays correctly', async (db) => {
    // Create test table with multi-dimensional arrays
    await db.executeQuery(`
      CREATE TABLE public.monitor_data (
        subject_id TEXT,
        "timestamp" TIMESTAMP[],
        "PPG" FLOAT8[][],
        "ACC" FLOAT8[][]
      );
  
      INSERT INTO public.monitor_data (subject_id, "timestamp", "PPG", "ACC")
      VALUES (
        'subject-1',
        ARRAY['2024-01-01 00:00:00'::timestamp, '2024-01-02 00:00:00'::timestamp],
        ARRAY[
          [1.1, 1.2, 1.3, 1.4, 1.5, 1.6],
          [2.1, 2.2, 2.3, 2.4, 2.5, 2.6],
          [3.1, 3.2, 3.3, 3.4, 3.5, 3.6]
        ]::FLOAT8[][],
        ARRAY[
          [4.1, 4.2, 4.3, 4.4, 4.5, 4.6],
          [5.1, 5.2, 5.3, 5.4, 5.5, 5.6],
          [6.1, 6.2, 6.3, 6.4, 6.5, 6.6]
        ]::FLOAT8[][]
      );
  
      INSERT INTO public.monitor_data (subject_id, "timestamp", "PPG", "ACC")
      VALUES (
        'subject-large',
        -- large 1D timestamp array (e.g., 1000 timestamps)
        ARRAY(
          SELECT generate_series('2024-01-01'::timestamp, '2024-01-01'::timestamp + interval '999 minutes', '1 minute')
        ),
        -- large 2D float8 arrays (e.g., 1000 x 6)
        ARRAY(
          SELECT ARRAY[
            random(), random(), random(), random(), random(), random()
          ]::float8[]
          FROM generate_series(1, 1000)
        )::float8[][],
        ARRAY(
          SELECT ARRAY[
            random(), random(), random(), random(), random(), random()
          ]::float8[]
          FROM generate_series(1, 1000)
        )::float8[][]
      );
    `)

    // Get table metadata
    const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
    const tables = tablesZod.parse(await db.executeQuery(tablesSql))
    const testTable = tables.find((table) => table.name === 'monitor_data')

    expect(testTable).toBeDefined()

    // Generate SQL with default settings
    const sql = getTableRowsSql({
      table: testTable!,
      page: 1,
      limit: 10,
    })

    // Verify SQL generation with snapshot
    expect(sql).toMatchInlineSnapshot(`
      "with _base_query as (select * from public.monitor_data order by monitor_data.subject_id asc nulls last limit 10 offset 0)
        select case
              when octet_length(subject_id::text) > 10240 
              then left(subject_id::text, 10240) || '...'
              else subject_id::text
            end as subject_id,
              case 
                when octet_length("timestamp"::text) > 10240 
                then
                  case
                    when array_ndims("timestamp") = 1
                    then
                      (select array_cat("timestamp"[1:50]::text[], array['...']::text[]))::text[]
                    else
                      "timestamp"[1:50]::text[]
                  end
                else "timestamp"::text[]
              end
            ,
              case 
                when octet_length("PPG"::text) > 10240 
                then
                  case
                    when array_ndims("PPG") = 1
                    then
                      (select array_cat("PPG"[1:50]::text[], array['...']::text[]))::text[]
                    else
                      "PPG"[1:50]::text[]
                  end
                else "PPG"::text[]
              end
            ,
              case 
                when octet_length("ACC"::text) > 10240 
                then
                  case
                    when array_ndims("ACC") = 1
                    then
                      (select array_cat("ACC"[1:50]::text[], array['...']::text[]))::text[]
                    else
                      "ACC"[1:50]::text[]
                  end
                else "ACC"::text[]
              end
             from _base_query;"
    `)

    // Execute the SQL and verify results
    const queryResult = await db.executeQuery(sql)
    expect(queryResult.length).toBe(2)

    // Verify the first row (small arrays)
    const smallRow = queryResult.find((row: any) => row.subject_id === 'subject-1')
    expect(smallRow).toBeDefined()
    expect(smallRow.timestamp).toHaveLength(2)
    expect(smallRow.PPG).toHaveLength(3)
    expect(smallRow.PPG[0]).toHaveLength(6)
    expect(smallRow.ACC).toHaveLength(3)
    expect(smallRow.ACC[0]).toHaveLength(6)

    // Verify the second row (large arrays)
    const largeRow = queryResult.find((row: any) => row.subject_id === 'subject-large')
    expect(largeRow).toBeDefined()
    expect(largeRow.timestamp).toHaveLength(51) // Has the extra '...' element
    expect(largeRow.PPG).toHaveLength(50)
    expect(largeRow.PPG[0]).toHaveLength(6)
    expect(largeRow.ACC).toHaveLength(50)
    expect(largeRow.ACC[0]).toHaveLength(6)

    // Test with custom maxArraySize
    const sqlWithCustomSize = getTableRowsSql({
      table: testTable!,
      page: 1,
      limit: 10,
      maxArraySize: 10,
    })

    const customSizeResult = await db.executeQuery(sqlWithCustomSize)
    const largeRowCustom = customSizeResult.find((row: any) => row.subject_id === 'subject-large')
    expect(largeRowCustom.timestamp).toHaveLength(11) // Has the extra '...' element
    expect(largeRowCustom.PPG).toHaveLength(10) // multi-dimentional array are truncated
    expect(largeRowCustom.ACC).toHaveLength(10)
  })

  withTestDatabase('should handle reserved keyword "collation" as column name', async (db) => {
    // Create a table with a column named "collation" (a PostgreSQL reserved keyword)
    await db.executeQuery(`
      CREATE TABLE IF NOT EXISTS "public"."test" (
        id SERIAL PRIMARY KEY,
        "collation" TEXT
      );
      
      DELETE FROM "public"."test";
      INSERT INTO "public"."test" ("collation") 
      VALUES 
        ('value1'),
        ('value2'),
        ('value3');
    `)

    // Get table metadata
    const { sql: tablesSql, zod: tablesZod } = pgMeta.tables.list()
    const tables = tablesZod.parse(await db.executeQuery(tablesSql))
    const testTable = tables.find((table) => table.name === 'test')

    expect(testTable).toBeDefined()

    // Generate SQL - this should properly quote the "collation" column name
    const sql = getTableRowsSql({
      table: testTable!,
      page: 1,
      limit: 100,
    })

    // Verify SQL generation - the "collation" column should be properly quoted
    expect(sql).toMatchInlineSnapshot(`
      "with _base_query as (select * from public.test order by test.id asc nulls last limit 100 offset 0)
        select id,case
              when octet_length("collation"::text) > 10240 
              then left("collation"::text, 10240) || '...'
              else "collation"::text
            end as "collation" from _base_query;"
    `)

    // Execute the generated SQL and verify the results
    const queryResult = await db.executeQuery(sql)
    expect(queryResult.length).toBe(3)
    expect(queryResult[0].collation).toBe('value1')
    expect(queryResult[1].collation).toBe('value2')
    expect(queryResult[2].collation).toBe('value3')

    // Test with ORDER BY on the collation column
    const sqlWithOrder = getTableRowsSql({
      table: testTable!,
      page: 1,
      limit: 100,
      sorts: [{ table: 'test', column: 'collation', ascending: true, nullsFirst: false }],
    })

    // Verify the ORDER BY clause properly quotes the collation column
    expect(sqlWithOrder).toMatchInlineSnapshot(`
      "with _base_query as (select * from public.test order by test."collation" asc nulls last limit 100 offset 0)
        select id,case
              when octet_length("collation"::text) > 10240 
              then left("collation"::text, 10240) || '...'
              else "collation"::text
            end as "collation" from _base_query;"
    `)

    const queryResultWithOrder = await db.executeQuery(sqlWithOrder)
    expect(queryResultWithOrder.length).toBe(3)
    expect(queryResultWithOrder[0].collation).toBe('value1')
    expect(queryResultWithOrder[1].collation).toBe('value2')
    expect(queryResultWithOrder[2].collation).toBe('value3')

    // Test with FILTER on the collation column
    const sqlWithFilter = getTableRowsSql({
      table: testTable!,
      page: 1,
      limit: 100,
      filters: [{ column: 'collation', operator: '=', value: 'value2' }],
    })

    // Verify the WHERE clause properly quotes the collation column
    expect(sqlWithFilter).toMatchInlineSnapshot(`
      "with _base_query as (select * from public.test where "collation" = 'value2' order by test.id asc nulls last limit 100 offset 0)
        select id,case
              when octet_length("collation"::text) > 10240 
              then left("collation"::text, 10240) || '...'
              else "collation"::text
            end as "collation" from _base_query;"
    `)

    const queryResultWithFilter = await db.executeQuery(sqlWithFilter)
    expect(queryResultWithFilter.length).toBe(1)
    expect(queryResultWithFilter[0].collation).toBe('value2')
  })
})
