import { afterAll, beforeAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

beforeAll(async () => {
  // Any global setup if needed
})

afterAll(async () => {
  await cleanupRoot()
})

const withTestDatabase = (
  name: string,
  fn: (db: Awaited<ReturnType<typeof createTestDatabase>>) => Promise<void>
) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

withTestDatabase('retrieve, create, update, delete', async ({ executeQuery }) => {
  // Create trigger
  const { sql: createSql } = pgMeta.triggers.create({
    name: 'test_trigger',
    schema: 'public',
    table: 'users_audit',
    function_schema: 'public',
    function_name: 'audit_action',
    function_args: ['test1', 'test2'],
    activation: 'AFTER',
    events: ['UPDATE'],
    orientation: 'ROW',
    condition: '(old.* IS DISTINCT FROM new.*)',
  })
  await executeQuery(createSql)

  const { sql: listTriggers, zod: listZod } = pgMeta.triggers.list()
  const listedTriggers = await listZod.parse(await executeQuery(listTriggers))
  const createdTriggers = listedTriggers.find(
    (t) => t.name === 'test_trigger' && t.table === 'users_audit' && t.schema === 'public'
  )
  expect(createdTriggers!).toMatchInlineSnapshot(
    { id: expect.any(Number), table_id: expect.any(Number) },
    `
{
  "activation": "AFTER",
  "condition": "(old.* IS DISTINCT FROM new.*)",
  "enabled_mode": "ORIGIN",
  "events": [
    "UPDATE",
  ],
  "function_args": [
    "test1",
    "test2",
  ],
  "function_name": "audit_action",
  "function_schema": "public",
  "id": Any<Number>,
  "name": "test_trigger",
  "orientation": "ROW",
  "schema": "public",
  "table": "users_audit",
  "table_id": Any<Number>,
}
  `
  )

  // Retrieve created trigger by name
  const { sql: retrieveSqlByName, zod: retrieveZod } = pgMeta.triggers.retrieve({
    name: 'test_trigger',
    table: 'users_audit',
    schema: 'public',
  })
  const trigger = retrieveZod.parse((await executeQuery(retrieveSqlByName))[0])
  expect(trigger!).toMatchInlineSnapshot(
    { id: expect.any(Number), table_id: expect.any(Number) },
    `
{
  "activation": "AFTER",
  "condition": "(old.* IS DISTINCT FROM new.*)",
  "enabled_mode": "ORIGIN",
  "events": [
    "UPDATE",
  ],
  "function_args": [
    "test1",
    "test2",
  ],
  "function_name": "audit_action",
  "function_schema": "public",
  "id": Any<Number>,
  "name": "test_trigger",
  "orientation": "ROW",
  "schema": "public",
  "table": "users_audit",
  "table_id": Any<Number>,
}
  `
  )

  // Retrieve created trigger by id
  const { sql: retrieveSqlById } = pgMeta.triggers.retrieve({
    id: trigger!.id,
  })
  const triggerById = retrieveZod.parse((await executeQuery(retrieveSqlById))[0])
  expect(triggerById!).toMatchInlineSnapshot(
    { id: expect.any(Number), table_id: expect.any(Number) },
    `
{
  "activation": "AFTER",
  "condition": "(old.* IS DISTINCT FROM new.*)",
  "enabled_mode": "ORIGIN",
  "events": [
    "UPDATE",
  ],
  "function_args": [
    "test1",
    "test2",
  ],
  "function_name": "audit_action",
  "function_schema": "public",
  "id": Any<Number>,
  "name": "test_trigger",
  "orientation": "ROW",
  "schema": "public",
  "table": "users_audit",
  "table_id": Any<Number>,
}
  `
  )

  // Update trigger
  const { sql: updateSql } = pgMeta.triggers.update(trigger!, {
    name: 'test_trigger_renamed',
    enabled_mode: 'DISABLED',
  })
  await executeQuery(updateSql)

  // Verify update
  const { sql: retrieveUpdatedSql } = pgMeta.triggers.retrieve({
    id: trigger!.id,
  })
  const updatedTrigger = retrieveZod.parse((await executeQuery(retrieveUpdatedSql))[0])
  expect(updatedTrigger).toMatchInlineSnapshot(
    { id: expect.any(Number), table_id: expect.any(Number) },
    `
{
  "activation": "AFTER",
  "condition": "(old.* IS DISTINCT FROM new.*)",
  "enabled_mode": "DISABLED",
  "events": [
    "UPDATE",
  ],
  "function_args": [
    "test1",
    "test2",
  ],
  "function_name": "audit_action",
  "function_schema": "public",
  "id": Any<Number>,
  "name": "test_trigger_renamed",
  "orientation": "ROW",
  "schema": "public",
  "table": "users_audit",
  "table_id": Any<Number>,
}
`
  )

  // Update trigger again
  const { sql: updateSql2 } = pgMeta.triggers.update(updatedTrigger!, {
    enabled_mode: 'REPLICA',
  })
  await executeQuery(updateSql2)

  // Verify second update
  const { sql: retrieveUpdated2Sql } = pgMeta.triggers.retrieve({
    name: 'test_trigger_renamed',
    table: 'users_audit',
    schema: 'public',
  })
  const updatedTrigger2 = retrieveZod.parse((await executeQuery(retrieveUpdated2Sql))[0])
  expect(updatedTrigger2).toMatchObject({
    enabled_mode: 'REPLICA',
  })

  // Remove trigger
  const { sql: removeSql } = pgMeta.triggers.remove(updatedTrigger2!)
  await executeQuery(removeSql)

  // Verify removal
  const { sql: verifyRemoveSql } = pgMeta.triggers.retrieve({
    name: 'test_trigger_renamed',
    table: 'users_audit',
    schema: 'public',
  })
  const result = retrieveZod.parse((await executeQuery(verifyRemoveSql))[0])
  expect(result).toBeUndefined()
})

withTestDatabase('multi event', async ({ executeQuery }) => {
  // Create trigger
  const { sql: createSql } = pgMeta.triggers.create({
    name: 'test_multi_event_trigger',
    schema: 'public',
    table: 'users_audit',
    function_schema: 'public',
    function_name: 'audit_action',
    function_args: ['test1', 'test2'],
    activation: 'AFTER',
    events: ['insert', 'update', 'delete'],
    orientation: 'ROW',
  })
  await executeQuery(createSql)

  // Verify created trigger
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.triggers.retrieve({
    name: 'test_multi_event_trigger',
    table: 'users_audit',
    schema: 'public',
  })
  const trigger = retrieveZod.parse((await executeQuery(retrieveSql))[0])
  expect(trigger).toMatchInlineSnapshot(
    { id: expect.any(Number), table_id: expect.any(Number) },
    `
    {
      "activation": "AFTER",
      "condition": null,
      "enabled_mode": "ORIGIN",
      "events": [
        "INSERT",
        "DELETE",
        "UPDATE",
      ],
      "function_args": [
        "test1",
        "test2",
      ],
      "function_name": "audit_action",
      "function_schema": "public",
      "id": Any<Number>,
      "name": "test_multi_event_trigger",
      "orientation": "ROW",
      "schema": "public",
      "table": "users_audit",
      "table_id": Any<Number>,
    }
    `
  )

  // Remove trigger
  const { sql: removeSql } = pgMeta.triggers.remove(trigger!)
  await executeQuery(removeSql)

  // Verify removal
  const { sql: verifyRemoveSql } = pgMeta.triggers.retrieve({
    name: 'test_multi_event_trigger',
    table: 'users_audit',
    schema: 'public',
  })
  const result = retrieveZod.parse((await executeQuery(verifyRemoveSql))[0])
  expect(result).toBeUndefined()
})

withTestDatabase('triggers with the same name on different schemas', async ({ executeQuery }) => {
  // Create test schemas and triggers
  await executeQuery(`
    create function tr_f() returns trigger language plpgsql as 'begin end';
    create schema s1; create table s1.t(); create trigger tr before insert on s1.t execute function tr_f();
    create schema s2; create table s2.t(); create trigger tr before insert on s2.t execute function tr_f();
  `)

  // List and verify triggers
  const { sql: listSql, zod: listZod } = pgMeta.triggers.list()
  const triggers = listZod.parse(await executeQuery(listSql))
  expect(triggers.map(({ id, table_id, ...trigger }) => trigger)).toMatchInlineSnapshot(`
    [
      {
        "activation": "BEFORE",
        "condition": null,
        "enabled_mode": "ORIGIN",
        "events": [
          "INSERT",
        ],
        "function_args": [],
        "function_name": "tr_f",
        "function_schema": "public",
        "name": "tr",
        "orientation": "STATEMENT",
        "schema": "s1",
        "table": "t",
      },
      {
        "activation": "BEFORE",
        "condition": null,
        "enabled_mode": "ORIGIN",
        "events": [
          "INSERT",
        ],
        "function_args": [],
        "function_name": "tr_f",
        "function_schema": "public",
        "name": "tr",
        "orientation": "STATEMENT",
        "schema": "s2",
        "table": "t",
      },
    ]
  `)
})

withTestDatabase('triggers on capitalized schema and table names', async ({ executeQuery }) => {
  // Create test schema and trigger
  await executeQuery(`
    CREATE SCHEMA "MySchema";
    CREATE TABLE "MySchema"."MyTable" (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    );
    CREATE OR REPLACE FUNCTION "MySchema"."my_trigger_function"()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at := CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER "my_trigger"
    BEFORE INSERT ON "MySchema"."MyTable"
    FOR EACH ROW
    EXECUTE FUNCTION "MySchema"."my_trigger_function"();
  `)

  // List and verify triggers
  const { sql: listSql, zod: listZod } = pgMeta.triggers.list()
  const triggers = listZod.parse(await executeQuery(listSql))
  expect(triggers.map(({ id, table_id, ...trigger }) => trigger)).toMatchInlineSnapshot(`
    [
      {
        "activation": "BEFORE",
        "condition": null,
        "enabled_mode": "ORIGIN",
        "events": [
          "INSERT",
        ],
        "function_args": [],
        "function_name": "my_trigger_function",
        "function_schema": "MySchema",
        "name": "my_trigger",
        "orientation": "ROW",
        "schema": "MySchema",
        "table": "MyTable",
      },
    ]
  `)
})
