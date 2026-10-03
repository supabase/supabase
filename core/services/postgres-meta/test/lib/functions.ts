import { expect, test } from 'vitest'
import { pgMeta } from './utils'

test('list', async () => {
  const res = await pgMeta.functions.list()
  expect(res.data?.find(({ name }) => name === 'add')).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "args": [
        {
          "has_default": false,
          "mode": "in",
          "name": "",
          "type_id": 23,
        },
        {
          "has_default": false,
          "mode": "in",
          "name": "",
          "type_id": 23,
        },
      ],
      "argument_types": "integer, integer",
      "behavior": "IMMUTABLE",
      "complete_statement": "CREATE OR REPLACE FUNCTION public.add(integer, integer)
     RETURNS integer
     LANGUAGE sql
     IMMUTABLE STRICT
    AS $function$select $1 + $2;$function$
    ",
      "config_params": null,
      "definition": "select $1 + $2;",
      "id": Any<Number>,
      "identity_argument_types": "integer, integer",
      "is_set_returning_function": false,
      "language": "sql",
      "name": "add",
      "prorows": null,
      "return_type": "integer",
      "return_type_id": 23,
      "return_type_relation_id": null,
      "schema": "public",
      "security_definer": false,
    }
  `
  )
})

test('list set-returning function with single object limit', async () => {
  const res = await pgMeta.functions.list()
  expect(res.data?.filter(({ name }) => name === 'get_user_audit_setof_single_row'))
    .toMatchInlineSnapshot(`
      [
        {
          "args": [
            {
              "has_default": false,
              "mode": "in",
              "name": "user_row",
              "type_id": 16395,
            },
          ],
          "argument_types": "user_row users",
          "behavior": "STABLE",
          "complete_statement": "CREATE OR REPLACE FUNCTION public.get_user_audit_setof_single_row(user_row users)
       RETURNS SETOF users_audit
       LANGUAGE sql
       STABLE ROWS 1
      AS $function$
        SELECT * FROM public.users_audit WHERE user_id = user_row.id;
      $function$
      ",
          "config_params": null,
          "definition": "
        SELECT * FROM public.users_audit WHERE user_id = user_row.id;
      ",
          "id": 16507,
          "identity_argument_types": "user_row users",
          "is_set_returning_function": true,
          "language": "sql",
          "name": "get_user_audit_setof_single_row",
          "prorows": 1,
          "return_type": "SETOF users_audit",
          "return_type_id": 16419,
          "return_type_relation_id": 16417,
          "schema": "public",
          "security_definer": false,
        },
      ]
    `)
})

test('list set-returning function with multiples definitions', async () => {
  const res = await pgMeta.functions.list()
  expect(res.data?.filter(({ name }) => name === 'get_todos_setof_rows')).toMatchInlineSnapshot(`
    [
      {
        "args": [
          {
            "has_default": false,
            "mode": "in",
            "name": "user_row",
            "type_id": 16395,
          },
        ],
        "argument_types": "user_row users",
        "behavior": "STABLE",
        "complete_statement": "CREATE OR REPLACE FUNCTION public.get_todos_setof_rows(user_row users)
     RETURNS SETOF todos
     LANGUAGE sql
     STABLE
    AS $function$
      SELECT * FROM public.todos WHERE "user-id" = user_row.id;
    $function$
    ",
        "config_params": null,
        "definition": "
      SELECT * FROM public.todos WHERE "user-id" = user_row.id;
    ",
        "id": 16510,
        "identity_argument_types": "user_row users",
        "is_set_returning_function": true,
        "language": "sql",
        "name": "get_todos_setof_rows",
        "prorows": 1000,
        "return_type": "SETOF todos",
        "return_type_id": 16405,
        "return_type_relation_id": 16403,
        "schema": "public",
        "security_definer": false,
      },
      {
        "args": [
          {
            "has_default": false,
            "mode": "in",
            "name": "todo_row",
            "type_id": 16405,
          },
        ],
        "argument_types": "todo_row todos",
        "behavior": "STABLE",
        "complete_statement": "CREATE OR REPLACE FUNCTION public.get_todos_setof_rows(todo_row todos)
     RETURNS SETOF todos
     LANGUAGE sql
     STABLE
    AS $function$
      SELECT * FROM public.todos WHERE "user-id" = todo_row."user-id";
    $function$
    ",
        "config_params": null,
        "definition": "
      SELECT * FROM public.todos WHERE "user-id" = todo_row."user-id";
    ",
        "id": 16511,
        "identity_argument_types": "todo_row todos",
        "is_set_returning_function": true,
        "language": "sql",
        "name": "get_todos_setof_rows",
        "prorows": 1000,
        "return_type": "SETOF todos",
        "return_type_id": 16405,
        "return_type_relation_id": 16403,
        "schema": "public",
        "security_definer": false,
      },
    ]
  `)
})

test('list functions with included schemas', async () => {
  let res = await pgMeta.functions.list({
    includedSchemas: ['public'],
  })

  expect(res.data?.length).toBeGreaterThan(0)

  res.data?.forEach((func) => {
    expect(func.schema).toBe('public')
  })
})

test('list functions with excluded schemas', async () => {
  let res = await pgMeta.functions.list({
    excludedSchemas: ['public'],
  })

  res.data?.forEach((func) => {
    expect(func.schema).not.toBe('public')
  })
})

test('list functions with excluded schemas and include System Schemas', async () => {
  let res = await pgMeta.functions.list({
    excludedSchemas: ['public'],
    includeSystemSchemas: true,
  })

  expect(res.data?.length).toBeGreaterThan(0)

  res.data?.forEach((func) => {
    expect(func.schema).not.toBe('public')
  })
})

test('retrieve, create, update, delete', async () => {
  const {
    data: { id: testSchemaId },
  }: any = await pgMeta.schemas.create({ name: 'test_schema' })

  let res = await pgMeta.functions.create({
    name: 'test_func',
    schema: 'public',
    args: ['a int2', 'b int2'],
    definition: 'select a + b',
    return_type: 'integer',
    language: 'sql',
    behavior: 'STABLE',
    security_definer: true,
    config_params: { search_path: 'hooks, auth', role: 'postgres' },
  })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "args": [
          {
            "has_default": false,
            "mode": "in",
            "name": "a",
            "type_id": 21,
          },
          {
            "has_default": false,
            "mode": "in",
            "name": "b",
            "type_id": 21,
          },
        ],
        "argument_types": "a smallint, b smallint",
        "behavior": "STABLE",
        "complete_statement": "CREATE OR REPLACE FUNCTION public.test_func(a smallint, b smallint)
     RETURNS integer
     LANGUAGE sql
     STABLE SECURITY DEFINER
     SET search_path TO 'hooks', 'auth'
     SET role TO 'postgres'
    AS $function$select a + b$function$
    ",
        "config_params": {
          "role": "postgres",
          "search_path": "hooks, auth",
        },
        "definition": "select a + b",
        "id": Any<Number>,
        "identity_argument_types": "a smallint, b smallint",
        "is_set_returning_function": false,
        "language": "sql",
        "name": "test_func",
        "prorows": null,
        "return_type": "integer",
        "return_type_id": 23,
        "return_type_relation_id": null,
        "schema": "public",
        "security_definer": true,
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.functions.retrieve({ id: res.data!.id })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "args": [
          {
            "has_default": false,
            "mode": "in",
            "name": "a",
            "type_id": 21,
          },
          {
            "has_default": false,
            "mode": "in",
            "name": "b",
            "type_id": 21,
          },
        ],
        "argument_types": "a smallint, b smallint",
        "behavior": "STABLE",
        "complete_statement": "CREATE OR REPLACE FUNCTION public.test_func(a smallint, b smallint)
     RETURNS integer
     LANGUAGE sql
     STABLE SECURITY DEFINER
     SET search_path TO 'hooks', 'auth'
     SET role TO 'postgres'
    AS $function$select a + b$function$
    ",
        "config_params": {
          "role": "postgres",
          "search_path": "hooks, auth",
        },
        "definition": "select a + b",
        "id": Any<Number>,
        "identity_argument_types": "a smallint, b smallint",
        "is_set_returning_function": false,
        "language": "sql",
        "name": "test_func",
        "prorows": null,
        "return_type": "integer",
        "return_type_id": 23,
        "return_type_relation_id": null,
        "schema": "public",
        "security_definer": true,
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.functions.update(res.data!.id, {
    name: 'test_func_renamed',
    schema: 'test_schema',
    definition: 'select b - a',
  })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "args": [
          {
            "has_default": false,
            "mode": "in",
            "name": "a",
            "type_id": 21,
          },
          {
            "has_default": false,
            "mode": "in",
            "name": "b",
            "type_id": 21,
          },
        ],
        "argument_types": "a smallint, b smallint",
        "behavior": "STABLE",
        "complete_statement": "CREATE OR REPLACE FUNCTION test_schema.test_func_renamed(a smallint, b smallint)
     RETURNS integer
     LANGUAGE sql
     STABLE SECURITY DEFINER
     SET role TO 'postgres'
     SET search_path TO 'hooks', 'auth'
    AS $function$select b - a$function$
    ",
        "config_params": {
          "role": "postgres",
          "search_path": "hooks, auth",
        },
        "definition": "select b - a",
        "id": Any<Number>,
        "identity_argument_types": "a smallint, b smallint",
        "is_set_returning_function": false,
        "language": "sql",
        "name": "test_func_renamed",
        "prorows": null,
        "return_type": "integer",
        "return_type_id": 23,
        "return_type_relation_id": null,
        "schema": "test_schema",
        "security_definer": true,
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.functions.remove(res.data!.id)
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "args": [
          {
            "has_default": false,
            "mode": "in",
            "name": "a",
            "type_id": 21,
          },
          {
            "has_default": false,
            "mode": "in",
            "name": "b",
            "type_id": 21,
          },
        ],
        "argument_types": "a smallint, b smallint",
        "behavior": "STABLE",
        "complete_statement": "CREATE OR REPLACE FUNCTION test_schema.test_func_renamed(a smallint, b smallint)
     RETURNS integer
     LANGUAGE sql
     STABLE SECURITY DEFINER
     SET role TO 'postgres'
     SET search_path TO 'hooks', 'auth'
    AS $function$select b - a$function$
    ",
        "config_params": {
          "role": "postgres",
          "search_path": "hooks, auth",
        },
        "definition": "select b - a",
        "id": Any<Number>,
        "identity_argument_types": "a smallint, b smallint",
        "is_set_returning_function": false,
        "language": "sql",
        "name": "test_func_renamed",
        "prorows": null,
        "return_type": "integer",
        "return_type_id": 23,
        "return_type_relation_id": null,
        "schema": "test_schema",
        "security_definer": true,
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.functions.retrieve({ id: res.data!.id })
  expect(res).toMatchObject({
    data: null,
    error: {
      message: expect.stringMatching(/^Cannot find a function with ID \d+$/),
    },
  })

  await pgMeta.schemas.remove(testSchemaId)
})

test('retrieve set-returning function', async () => {
  const res = await pgMeta.functions.retrieve({
    schema: 'public',
    name: 'function_returning_set_of_rows',
    args: [],
  })
  expect(res.data).toMatchInlineSnapshot(
    {
      id: expect.any(Number),
      return_type_id: expect.any(Number),
      return_type_relation_id: expect.any(Number),
    },
    `
    {
      "args": [],
      "argument_types": "",
      "behavior": "STABLE",
      "complete_statement": "CREATE OR REPLACE FUNCTION public.function_returning_set_of_rows()
     RETURNS SETOF users
     LANGUAGE sql
     STABLE
    AS $function$
      select * from public.users;
    $function$
    ",
      "config_params": null,
      "definition": "
      select * from public.users;
    ",
      "id": Any<Number>,
      "identity_argument_types": "",
      "is_set_returning_function": true,
      "language": "sql",
      "name": "function_returning_set_of_rows",
      "prorows": 1000,
      "return_type": "SETOF users",
      "return_type_id": Any<Number>,
      "return_type_relation_id": Any<Number>,
      "schema": "public",
      "security_definer": false,
    }
  `
  )
})

test('retrieve function by args filter - polymorphic function with text argument', async () => {
  const res = await pgMeta.functions.retrieve({
    schema: 'public',
    name: 'polymorphic_function',
    args: ['text'],
  })
  expect(res.data).toMatchObject({
    name: 'polymorphic_function',
    schema: 'public',
    argument_types: 'text',
    args: [
      { type_id: 25, mode: 'in' }, // text type_id is 25
    ],
  })
  expect(res.error).toBeNull()
})

test('retrieve function by args filter - polymorphic function with boolean argument', async () => {
  const res = await pgMeta.functions.retrieve({
    schema: 'public',
    name: 'polymorphic_function',
    args: ['boolean'],
  })
  expect(res.data).toMatchObject({
    name: 'polymorphic_function',
    schema: 'public',
    argument_types: 'boolean',
    args: [
      { type_id: 16, mode: 'in' }, // boolean type_id is 16
    ],
  })
  expect(res.error).toBeNull()
})

test('retrieve function by args filter - function with no arguments', async () => {
  const res = await pgMeta.functions.retrieve({
    schema: 'public',
    name: 'function_returning_set_of_rows',
    args: [],
  })
  expect(res.data).toMatchObject({
    name: 'function_returning_set_of_rows',
    schema: 'public',
    argument_types: '',
    args: [],
  })
  expect(res.error).toBeNull()
})
