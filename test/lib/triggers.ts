import { expect, test } from 'vitest'
import { pgMeta } from './utils'

test('retrieve, create, update, delete', async () => {
  let res = await pgMeta.triggers.create({
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
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number), table_id: expect.any(Number) } },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.triggers.retrieve({ id: res.data!.id })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number), table_id: expect.any(Number) } },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.triggers.update(res.data!.id, {
    name: 'test_trigger_renamed',
    enabled_mode: 'DISABLED',
  })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number), table_id: expect.any(Number) } },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.triggers.update(res.data!.id, {
    enabled_mode: 'REPLICA',
  })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number), table_id: expect.any(Number) } },
    `
    {
      "data": {
        "activation": "AFTER",
        "condition": "(old.* IS DISTINCT FROM new.*)",
        "enabled_mode": "REPLICA",
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
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.triggers.remove(res.data!.id)
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number), table_id: expect.any(Number) } },
    `
    {
      "data": {
        "activation": "AFTER",
        "condition": "(old.* IS DISTINCT FROM new.*)",
        "enabled_mode": "REPLICA",
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
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.triggers.retrieve({ id: res.data!.id })
  expect(res).toMatchObject({
    data: null,
    error: {
      message: expect.stringMatching(/^Cannot find a trigger with ID \d+$/),
    },
  })
})

test('multi event', async () => {
  let res = await pgMeta.triggers.create({
    name: 'test_multi_event_trigger',
    schema: 'public',
    table: 'users_audit',
    function_schema: 'public',
    function_name: 'audit_action',
    function_args: ['test1', 'test2'],
    activation: 'AFTER',
    events: ['insert', 'update', 'delete'],
    orientation: 'ROW',
    condition: '',
  })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number), table_id: expect.any(Number) } },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )
  await pgMeta.triggers.remove(res.data!.id)
})

test('triggers with the same name on different schemas', async () => {
  await pgMeta.query(`
create function tr_f() returns trigger language plpgsql as 'begin end';
create schema s1; create table s1.t(); create trigger tr before insert on s1.t execute function tr_f();
create schema s2; create table s2.t(); create trigger tr before insert on s2.t execute function tr_f();
`)

  const res = await pgMeta.triggers.list()
  const triggers = res.data?.map(({ id, table_id, ...trigger }) => trigger)
  expect(triggers).toMatchInlineSnapshot(`
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

  await pgMeta.query('drop schema s1 cascade; drop schema s2 cascade;')
})

test('triggers on capitalized schema and table names', async () => {
  await pgMeta.query(`
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

  const res = await pgMeta.triggers.list()
  const triggers = res.data?.map(({ id, table_id, ...trigger }) => trigger)
  expect(triggers).toMatchInlineSnapshot(`
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

  await pgMeta.query('drop schema "MySchema" cascade;')
})
